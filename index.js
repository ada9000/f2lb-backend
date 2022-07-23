const express = require('express')
const {graphqlHTTP} = require('express-graphql')
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull
} = require('graphql')
const cors = require('cors')
const app = express()
app.use(cors())

const blockfrost = require('./api/blockfrost')
const redis = require('./db/redis')

const PoolType = new GraphQLObjectType({
  name: 'Pool',
  description: 'Represents a bit_bot payloads',
  fields: () => ({
    poolId: { type: new GraphQLNonNull(GraphQLString) },
    poolIdBech32: { type: new GraphQLNonNull(GraphQLString) },
    ticker: { type: new GraphQLNonNull(GraphQLString) },
    website: { type: new GraphQLNonNull(GraphQLString) },
    imageUrl: { type: new GraphQLNonNull(GraphQLString) },
    epochs: { type: new GraphQLList(GraphQLString) },
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
  await blockfrost.todo();
}

initServer().then(() => {
  app.listen(4000, () => {
    console.log('Server Running, localhost:4000')
  })
  // update data every minute
  console.log("Setting 1min update job")
  //setInterval(updatePools, 60000)
})


