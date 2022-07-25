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

const redis = require('./db/redis')
const f2lb = require('./controllers/f2lbRules')
const { findSupporters, findCurrentList } = require('./util/googlesheetsToJson')

const SupporterType = new GraphQLObjectType({
name: 'Supporter',
  description: 'A F2LB supporter',
  fields: () => ({
    alias: { type: new GraphQLNonNull(GraphQLString)},
    status: {type:new GraphQLNonNull(GraphQLInt)},
    wallet: {type: WalletType}
  })
})


const PoolType = new GraphQLObjectType({
  name: 'Pool',
  description: 'A F2LB pool',
  fields: () => ({
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
  description: 'A Cardano wallet',
  fields: () => ({
    stakeAddress: { type: new GraphQLNonNull(GraphQLString) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    delegation: { type: new GraphQLNonNull(GraphQLString) },
    delegationTicker: { type: new GraphQLNonNull(GraphQLString) },
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
        const poolList = JSON.parse(await redis.get('pools'))
        var pools = []
        for (idx in poolList){
          pools.push(JSON.parse(await redis.get(poolList[idx])))
        }
        return pools;
      }
    },
    pool: {
      type: PoolType,
      description: 'A single pool',
      args: {
        ticker: { type: GraphQLString }
      },
      resolve: async (parent, args) => {
        const poolList = JSON.parse(await redis.get('pools'))
        for (idx in poolList){
          const pool = JSON.parse(await redis.get(poolList[idx]))
          console.log(`${pool.ticker} ${args.ticker}`)
          if (pool.ticker === args.ticker){
            return pool
          }
        }
        return null
      }
    },
    supporters: {
      type: new GraphQLList(SupporterType),
      description: 'F2LB supporters',
      resolve: async () => {
        return JSON.parse(await redis.get('supporters'))
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
  const forceUpdateFromGoogleSheet = false
  if (await redis.get("pools") === null || forceUpdateFromGoogleSheet)
  {
    // recover from google sheet (I would like to deprecate this)
    await findSupporters()
    await findCurrentList()
  }
  await redis.save()
}

async function update()
{
  const poolList = JSON.parse(await redis.get('pools'))
  console.log("update leader")
  await f2lb.updateLeader();
  for(idx in poolList){
    const pool = JSON.parse(await redis.get(poolList[idx]))
    console.log("update status")
    await f2lb.setStatus(pool)
  }

  console.log("done")
  // check epoch, if it change update list
}

initServer().then(() => {
  app.listen(4000, () => {
    console.log('Server Running, http://localhost:4000/graphql')
  })
  // update data every minute
  update()
  console.log("Setting 1min update job")
  //setInterval(update, 60000)
})


