const redis = require('../db/redis')

async function requirmentsMeet(){
    // pool must have less than 50 lifetime blocks or less than 1 mill to enter queue 
    // (don't forget to minus Cardano foundation?)
    // return true / false
}

async function updateLeader(){
    // get all pools
    const poolList = JSON.parse(await redis.get('pools'))

    for(idx in poolList){
        const pool = JSON.parse(await redis.get(poolList[idx]))
        if (pool.queuePos === 0){
            await redis.set('leader', JSON.stringify(pool))
            return
        }
    }
}

async function setStatus(pool){
    const leader = JSON.parse(await redis.get('leader'))
    
    var updatePool = JSON.parse(JSON.stringify(pool))
    var status = 1
    if (leader.poolIdBech32 === pool.wallet.delegation){
        status = 0
    }
    updatePool.status = status;
    await redis.set(pool.poolIdBech32, JSON.stringify(updatePool))
}

async function balance(){
    // given a pool in the list

    // check they are delegated to the correct pool once per epoch

    // if they are not bump them down the list (ensure pool below moves up)
}

async function listUpdate(){
    // check current list against current epoch

    // adjust numbers

    // if leader is done change pos to -1
}

async function requeue(){
    // check for -1

    // move -1 pool to bottom of the list
}

async function inactive(){
    // after 6 failed epochs
    // remove from queue
    // update queue
}

async function handleAddOn(){
    // take one epoch from the pool
    // move that epoch into add on queue
    // TODO think about this more
}

module.exports = {requirmentsMeet, updateLeader, setStatus, balance, listUpdate, requeue, inactive, handleAddOn}
