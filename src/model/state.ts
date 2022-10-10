import { redisSet, redisGet, redisDel, redisKeys } from "../util/redis";

export async function setEpoch(epoch: number) {
  await redisSet("epoch", epoch);
}

export async function getEpoch(): Promise<number> {
  return await redisGet("epoch");
}
