import { Pool } from "../types/gql";
import { redisSet, redisGet, redisDel, redisKeys } from "../util/redis";

// return a list of pool bech32 Ids
// important for recovering pools
async function getPoolBech32Ids(): Promise<string[]> {
  // get pool ids from redis
  return await redisKeys("pool*");
}

export async function getPools(): Promise<Pool[]> {
  // get pool ids from redis
  const poolBech32Ids: string[] = await getPoolBech32Ids();
  let pools: Pool[] = [];
  // get full pool data from redis
  for (const bech32 of poolBech32Ids) {
    pools.push(await JSON.parse(await redisGet(bech32)));
  }
  return pools;
}

export async function setPool(pool: Pool) {
  if (pool.bech32.slice(0, 4).match("pool")) {
    // add pool to db
    await redisSet(pool.bech32, JSON.stringify(pool));
  } else {
    throw new Error(
      `adding pool [${pool.ticker}] failed due to pool.bech32 '${pool.bech32}' not starting with pool`
    );
  }
}

export async function getPool(poolBech32: string) {
  return JSON.parse(await redisGet(poolBech32));
}

export async function removePool(poolBech32: string) {
  console.log("TODO: remove pool");
}
