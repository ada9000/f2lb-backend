const redis = require('redis')
const client = redis.createClient();

client.connect()

client.on('connect', function (err) {
    if (err) {
      console.log('Could not establish a connection with Redis. ' + err);
    } else {
      console.log('Connected to Redis successfully!');
    }
});

async function set(key, value)
{
    await client.set(key,value)
}

async function get(key)
{
    return await client.get(key)
}

async function del(key)
{
    return await client.del(key)
}

module.exports = {set, get, del};