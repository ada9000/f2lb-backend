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

const db_number = 2;
client.select(db_number);
console.log(`using db ${db_number} run 'redis-cli' then select ${db_number}`)

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

// manual save
async function save() 
{
    await client.save()
}

module.exports = {set, get, del, save};