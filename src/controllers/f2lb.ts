import { accountInfo, singleAccountInfo, tip } from "../api/koios";
import { getPools, setPool } from "../model/pools";
import { getEpoch } from "../model/state";
import { Pool, Wallet } from "../types/gql";
import { laceToAda } from "../util/utils";

export async function update() {
  console.log(`⏱️ update started at ${new Date().toISOString()}`);

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
  for (const idx in pools) {
    const pool = pools[idx];
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
  }

  // if new epoch > last epoch
  if (currentEpoch > lastEpoch) {
    await recalculateQueue(currentEpoch);
  }

  console.log(`🏁 update finished at ${new Date().toISOString()}`);
}

async function recalculateQueue(currentEpoch: number) {
  console.log(`🫠 queue recalculation`);
  // order by queue
  const pools = await getPools();
  const poolsByDescPoolPos = pools.sort((a, b) => b.queuePos - a.queuePos);

  for (const index in poolsByDescPoolPos) {
    const idx = parseInt(index);
    if (idx === poolsByDescPoolPos.length - 1) {
      // on pool leader
    }
    const pool = poolsByDescPoolPos[idx];
  }

  // reassign queue pos based on index ALSO reassign epochs

  //

  // rebase queue based on supporting leader tag
  console.log(`🫠 queue recalculation finished`);
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
