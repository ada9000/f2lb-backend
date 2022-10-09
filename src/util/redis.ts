const redis = require("redis");
const client = redis.createClient();

// initialize REDIS
export async function initRedis() {
  await client.connect();
  await client.on("connect", function (err: any) {
    if (err) {
      console.log("Could not establish a connection with Redis. " + err);
    } else {
      console.log("Connected to Redis successfully!");
    }
  });
  const db_number = 2;
  await client.select(db_number);
  console.log(`using db ${db_number} run 'redis-cli' then select ${db_number}`);
}

export async function redisSet(key: string, value: any) {
  await client.set(key, value);
}

export async function redisGet(key: string) {
  return await client.get(key);
}

export async function redisDel(key: string) {
  return await client.del(key);
}

// manual save
export async function redisSave() {
  await client.save();
}
