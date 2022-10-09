import { Pool } from "../types/gql";
const { redisSet, redisGet, redisDel } = require("../util/redis");

// return a list of pool bech32 Ids
// important for recovering pools
async function getPoolBech32Ids(): Promise<string[]> {
  // get pool ids from redis
  const poolBech32Ids: string[] = JSON.parse(await redisGet("pools"));
  return poolBech32Ids ? poolBech32Ids : [];
}

export async function addBech32Id(bech32PoolId: string) {
  const poolBech32Ids: string[] = await getPoolBech32Ids();
  if (poolBech32Ids.length === 0) {
    await redisSet("pools", JSON.stringify([bech32PoolId]));
  } else {
    poolBech32Ids.push(bech32PoolId);
    await redisSet("pools", JSON.stringify(poolBech32Ids));
  }
}

export async function getPools(): Promise<Pool[]> {
  // get pool ids from redis
  const poolBech32Ids: string[] = await getPoolBech32Ids();
  let pools: Pool[] = [];
  // get full pool data from redis
  poolBech32Ids.forEach(async (poolBech32: string) => {
    pools.push(JSON.parse(await redisGet(poolBech32)));
  });
  console.log("get pools");
  return pools;
}

export async function addPool(pool: Pool) {
  // add pool to db
  await redisSet(pool.bech32, JSON.stringify(pool));
  // add pool bech32 to poolBech32 Ids
  await addBech32Id(pool.bech32);
}

export async function getPool(poolBech32: string) {
  return JSON.parse(await redisGet(poolBech32));
}

export async function removePool(poolBech32: string) {
  console.log("TODO: remove pool");
}
