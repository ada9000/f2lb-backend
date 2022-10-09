const redis = require("../db/redis");

async function updateWithoutAccessToGSheet() {
  const poolList = JSON.parse(await redis.get("pools"));
  for (idx in poolList) {
    var pool = JSON.parse(await redis.get(poolList[idx]));
    if (pool.ticker === "ANTRX") {
      console.log("found");
      // set epochs to 1 due to import data not yet updated
      pool.epochs = [354];
      pool.epochsGranted = 1;
      pool.numEpochs = 1;
      const poolId = pool.poolIdBech32;
      redis.set(poolId, JSON.stringify(pool));
      console.log("updated");
    }
  }
}

updateWithoutAccessToGSheet();
console.log("finished");
