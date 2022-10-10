import { accountInfo, singleAccountInfo, tip } from "../api/koios";
import { getPools, setPool } from "../model/pools";
import { getEpoch } from "../model/state";
import { Pool, Wallet } from "../types/gql";
import { laceToAda } from "../util/utils";

/*
async function update() {
  try {
    // get pool list from redis
    const poolList = JSON.parse(await redis.get("pools"));
    // get epoch
    var epoch = await redis.get("epoch");
    if (!epoch) {
      epoch = await koios.epoch();
      redis.set("epoch", epoch);
      console.log(`epoch missing updated it to '${epoch}'`);
    }
    // get all pool objects (as 'pools' is just a list of reference strings)
    var pools = [];
    const leader = JSON.parse(await redis.get(poolList[0]));
    for (idx in poolList) {
      const pool = JSON.parse(await redis.get(poolList[idx]));
      const updatedPool = await f2lb.updateStatus(pool, leader);
      pools.push(updatedPool);
    }
    // update pool list and then reflect changes in redis
    const updatedPools = await f2lb.update(pools, epoch);
    for (idx in updatedPools) {
      const poolId = updatedPools[idx].poolIdBech32;
      redis.set(poolId, JSON.stringify(updatedPools[idx]));
    }
    // update epoch in db if nec
    const currentEpoch = await redis.get("epoch");
    const actualEpoch = await koios.epoch();

    if (actualEpoch !== currentEpoch) {
      await redis.set("epoch", actualEpoch);
      console.log(`epoch '${currentEpoch} -> '${actualEpoch}'`);
    }
    // log success / force save
    await redis.save();
    const time = new Date().toISOString();
    console.log(`updated list at '${time}'`);
  } catch (e) {
    const time = new Date().toISOString();
    console.log(`${time} failed to update due to ${e}`);
  }
}*/

export async function update() {
  console.log(`⏱️ update started at ${new Date().toLocaleString()}`);

  // TODO: ! update list again...

  const lastEpoch = await getEpoch();
  // get epoch
  const currentEpoch = parseInt((await tip()).epoch_no);

  // get pools
  const pools = await getPools();

  var leaderPoolId: string | null = null;

  await pools.forEach((pool) => {
    if (pool.queuePos === 0) {
      leaderPoolId = pool.bech32;
      console.log(`Leader is '${leaderPoolId}'`);
    }
  });

  if (!leaderPoolId) {
    throw new Error("could not find leader");
  }

  // filter out all wallets ids
  const bech32StakeAddresses: string[] = [];
  pools.forEach(async (pool) => {
    pool.wallets.forEach((wallet) => {
      bech32StakeAddresses.push(wallet.stakeAddr);
    });
  });

  // update each pools wallets information
  await pools.forEach(async (pool) => {
    let total_lace = 0;
    let supportingLeader = false;
    // update wallets
    const updatedWallets: Wallet[] = new Array();

    for (const idx in pool.wallets) {
      const wallet = pool.wallets[idx];
      const account = await singleAccountInfo(wallet.stakeAddr);
      console.log(account);
      total_lace += parseInt(account.total_balance);
      updatedWallets.push({
        stakeAddr: account.stake_address,
        lace: parseInt(account.total_balance),
        delegatedBech32: account.delegated_pool,
      });
      // update supporting leader, TODO: handle multiple wallets better
      if (
        account?.delegated_pool &&
        //@ts-ignore
        account.delegated_pool.match(leaderPoolId)
      ) {
        supportingLeader = true;
      }
    }

    const allowedEpochs = await epochsAllowed(
      total_lace,
      pool.allowedEpochs,
      pool.assignedEpochs,
      currentEpoch
    );

    console.log(
      `UPDATED [${pool.ticker}] has wallets ${JSON.stringify(updatedWallets)}`
    );
    const updatedPool: Pool = {
      ticker: pool.ticker,
      bech32: pool.bech32,
      wallets: updatedWallets,
      supportingLeader,
      queuePos: pool.queuePos,
      allowedEpochs,
      assignedEpochs: pool.assignedEpochs,
    };
    setPool(updatedPool);
  });

  // if new epoch > last epoch
  if (currentEpoch > lastEpoch) {
  }
  // order by queue

  // check if leader has epoch >= current epoch
  // if no
  // update queue so leader is last

  // rebase queue based on supporting leader tag

  console.log(`🏁 update finished at ${new Date().toLocaleString()}`);
}

export async function epochsAllowed(
  lace: number,
  allowedEpochs: number,
  assignedEpochs: number[],
  currentEpoch: number
) {
  const ada = laceToAda(lace.toString());
  let epochsGranted = 0;
  if (ada > 1000) {
    epochsGranted = 1;
  }
  if (ada > 3000) {
    epochsGranted = 2;
  }
  if (ada > 10000) {
    epochsGranted = 3;
  }
  if (ada > 40000) {
    epochsGranted = 4;
  }

  // if the target pool is in the next 7 to be selected
  // enter reduce only mode
  if (assignedEpochs[0] - 7 < currentEpoch) {
    // console.log(`top7 pool}`)
    epochsGranted = 4;
    if (ada <= 40000) {
      epochsGranted = 3;
    }
    if (ada <= 10000) {
      epochsGranted = 2;
    }
    if (ada <= 3000) {
      epochsGranted = 1;
    }
    if (ada <= 1000) {
      epochsGranted = 0;
    }
    if (epochsGranted > allowedEpochs) {
      epochsGranted = allowedEpochs;
    }
  }

  return epochsGranted;
}
