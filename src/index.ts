const express = require("express");
const cors = require("cors");
const app = express();

const { graphqlHTTP } = require("express-graphql");
const { loadSchema } = require("@graphql-tools/load");
const { GraphQLFileLoader } = require("@graphql-tools/graphql-file-loader");
const { addResolversToSchema } = require("@graphql-tools/schema");

const { initRedis } = require("./util/redis");
const { resolvers } = require("./gql/resolvers");
import { update } from "./controllers/f2lb";
import { getPools } from "./model/pools";
import { getSupporters } from "./model/supporters";
import {
  recoverCurrentSupporters,
  recoverCurrentPoolList,
} from "./util/recoverFromGoogleSheets";

async function initServer() {
  console.log("☀️  init cors");
  app.use(cors());
  console.log("☀️  init redis");
  await initRedis();
  console.log("☀️  init graphql");
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
  if (true) {
    console.log("🐸 recover from gSheets");
    await recoverCurrentPoolList();
    await recoverCurrentSupporters();
    await update();
  }
}

initServer().then(() => {
  const minuteUpdateTime = 15;
  app.listen(4001, () => {
    console.log(
      `🥳 server Running, http://localhost:4001/graphql (updates every ${minuteUpdateTime} minute/s)`
    );
  });
  setInterval(update, 60000 * minuteUpdateTime);
});
