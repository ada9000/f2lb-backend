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

  console.log(`🏁 update finished at ${new Date().toLocaleString()}`);
}

export async function epochsAllowed(lace: number) {
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
  return epochsGranted;
}
