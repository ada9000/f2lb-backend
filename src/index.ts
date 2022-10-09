const express = require("express");
const cors = require("cors");
const app = express();

const { graphqlHTTP } = require("express-graphql");
const { loadSchema } = require("@graphql-tools/load");
const { GraphQLFileLoader } = require("@graphql-tools/graphql-file-loader");
const { addResolversToSchema } = require("@graphql-tools/schema");

const { initRedis } = require("./util/redis");
const { resolvers } = require("./gql/resolvers");
import { getPools } from "./model/pools";
import { recoverCurrentPoolList } from "./util/recoverFromGoogleSheets";

async function initServer() {
  console.log("Init cors");
  app.use(cors());

  console.log("Init redis");
  await initRedis();

  console.log("Init graphql");
  // get schema
  const schema = await loadSchema("src/gql/schema.graphql", {
    loaders: [new GraphQLFileLoader()],
  });
  // get resolvers
  const schemaWithResolvers = await addResolversToSchema({ schema, resolvers });
  app.use(
    "/graphql",
    graphqlHTTP({
      schema: schemaWithResolvers,
      graphiql: true,
    })
  );
  console.log("Init app");

  // const forceUpdateFromGoogleSheet = false;
  // if ((await redis.get("pools")) === null || forceUpdateFromGoogleSheet) {
  //   // recover from google sheet (I would like to deprecate this)
  //   //await findSupporters()
  //   await findCurrentList();
  // }
  // await redis.save();
}

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

initServer().then(() => {
  app.listen(4001, () => {
    console.log("Server Running, http://localhost:4001/graphql");
  });
  // update every 15 minutes
  //update();
  (async () => {
    console.log("recover test");
    await recoverCurrentPoolList();
    const res = await getPools();
    console.log(JSON.stringify(res));
  })();
  //setInterval(update, 60000 * 15);
});
