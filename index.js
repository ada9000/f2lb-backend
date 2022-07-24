const express = require('express')
const {graphqlHTTP} = require('express-graphql')
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLFloat,
  GraphQLNonNull,
} = require('graphql')
const cors = require('cors')
const app = express()
app.use(cors())

const blockfrost = require('./api/blockfrost')
const redis = require('./db/redis')
const { getGooglesheetData } = require('./util/googlesheetsToJson')

const PoolType = new GraphQLObjectType({
  name: 'Pool',
  description: 'Represents a bit_bot payloads',
  fields: () => ({
    poolId: { type: new GraphQLNonNull(GraphQLString) },
    poolIdBech32: { type: new GraphQLNonNull(GraphQLString) },
    ticker: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    website: { type: new GraphQLNonNull(GraphQLString) },
    imageUrl: { type: new GraphQLNonNull(GraphQLString) },
    epochs: { type: new GraphQLList(GraphQLInt) },
    numEpochs: { type: new GraphQLNonNull(GraphQLInt) },
    queuePos: { type: new GraphQLNonNull(GraphQLInt) },
    status: {type:new GraphQLNonNull(GraphQLInt)},
    wallet: {type: WalletType}
  })
})

const WalletType = new GraphQLObjectType({
  name: 'Wallet',
  description: 'Represents a bit_bot payloads',
  fields: () => ({
    stakeAddress: { type: new GraphQLNonNull(GraphQLString) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    delegation: { type: new GraphQLNonNull(GraphQLString) },
  })
})


const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root Query',
  fields: () => ({ 
    pools: {
      type: new GraphQLList(PoolType),
      description: 'All pools in rotation',
      resolve: async () => {
        return JSON.parse(await redis.get('pools'))
      }
    },
    pool: {
      type: PoolType,
      description: 'A single pool',
      args: {
        ticker: { type: GraphQLString }
      },
      resolve: async (parent, args) => {
        const pools = JSON.parse(await redis.get('pools'))
        return pools.find(p => p.ticker === args.ticker)
      }
    },
  })
})

const schema = new GraphQLSchema({
  query: RootQueryType,
})

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true
}))

async function initServer()
{
  console.log("Init server");
  //await blockfrost.getStakeInfo("stake1uxh85e3y330pj3fx8y8dgje94pam5zklj9x3zaxz6fztqmq03a8jr")
  const forceUpdateFromGoogleSheet = false
  if (await redis.get("pools") === null || forceUpdateFromGoogleSheet)
  {
    await getGooglesheetData()
  }
  await redis.save()
}

async function update()
{
  console.log("update job")
  // check and update wallets

  // check epoch, if it change update list
}

initServer().then(() => {
  app.listen(4000, () => {
    console.log('Server Running, http://localhost:4000/graphql')
  })
  // update data every minute
  console.log("Setting 1min update job")
  setInterval(update, 60000)
})


