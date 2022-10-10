import { Supporter } from "../types/gql";
import { redisSet, redisGet, redisDel, redisKeys } from "../util/redis";

// return a list of pool bech32 Ids
// important for recovering pools
async function getSupporterIds(): Promise<string[]> {
  // get pool ids from redis
  return await redisKeys("supporter_*");
}

export async function getSupporters(): Promise<Supporter[]> {
  // get pool ids from redis
  const supporterIds: string[] = await getSupporterIds();
  let supporters: Supporter[] = [];
  // get full pool data from redis
  for (const supporterId of supporterIds) {
    supporters.push(await JSON.parse(await redisGet(supporterId)));
  }
  return supporters;
}

export async function addSupporter(supporter: Supporter) {
  // add supporter to db, prefix with 'supporter_'
  await redisSet(`supporter_${supporter.alias}`, JSON.stringify(supporter));
}

export async function getSupporter(supporterId: string) {
  return JSON.parse(await redisGet(supporterId));
}

export async function removeSupporter(supporterId: string) {
  console.log("TODO: remove pool");
}
