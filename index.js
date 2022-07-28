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
const koios = require('./api/koios')
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
  try {
    // get pool list from redis
    const poolList = JSON.parse(await redis.get('pools'))
    // get epoch
    var epoch = await redis.get('epoch')
    if(!epoch){
      epoch = await koios.epoch();
      redis.set("epoch", epoch)
      console.log(`epoch missing updated it to '${epoch}'`)
    }
    // get all pool objects (as 'pools' is just a list of reference strings)
    var pools = []
    for(idx in poolList){
      const pool = JSON.parse(await redis.get(poolList[idx]))
      pools.push(pool)
    }
    // update pool list and then reflect changes in redis
    const updatedPools = f2lb.update(pools, epoch);
    for (idx in updatedPools){
      const poolId = updatedList[idx].poolIdBech32;
      redis.set(poolId, JSON.stringify(updatedPools[idx]))
    }
    // log success / force save
    await redis.save()
    const time = new Date().toISOString();
    console.log(`updated list at '${time}'`)
  } catch(e) {
    const time = new Date().toISOString();
    console.log(`${time} failed to update due to ${e}`)
  }
}

initServer().then(() => {
  app.listen(4001, () => {
    console.log('Server Running, http://localhost:4001/graphql')
  })
  // update every 15 minutes
  setInterval(update, 60000*15)
})


