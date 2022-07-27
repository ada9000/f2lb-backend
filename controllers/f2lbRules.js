const koios = require('../api/koios')


const STATUS = {
    DELEGATED: 0,
    NOT_DELEGATED: 1,
}

function adaToLace(ada){
    return parseFloat(ada) * 1000000
}

function laceToAda(lace){
    return parseFloat(lace) / 1000000.0
}

async function updateAllowedEpochs(pool, epoch)
{
    var updatedPool = {...pool};
    // get ada
    const accountInfo = await koios.accountInfo(pool.wallet.stakeAddress);
    const ada = laceToAda(accountInfo.total_balance);
    console.log(`updateAllowedEpochs ada = ${ada}`)
    // calc epochs
    var epochsGranted = 0;
    if (ada > 1000 ){ epochsGranted = 1 } 
    if (ada > 3000 ){ epochsGranted = 2 } 
    if (ada > 10000){ epochsGranted = 3 } 
    if (ada > 40000){ epochsGranted = 4 } 
    // if the target pool is in the next 7 to be selected
    // enter reduce only mode
    if (pool.epochs[0] - 7 < epoch){
        console.log(`top7 pool}`)
        epochsGranted = 4;
        if (ada <= 40000){ epochsGranted = 3 } 
        if (ada <= 10000){ epochsGranted = 2 } 
        if (ada <= 3000 ){ epochsGranted = 1 } 
        if (ada <= 1000 ){ epochsGranted = 0 }
        if(epochsGranted > pool.epochsGranted){
            console.log("er")
            epochsGranted = pool.epochsGranted;
        }
    }
    console.log(`epochsGranted = ${epochsGranted}`)
    updatedPool.epochsGranted = epochsGranted;
    return updatedPool;
}


async function updateLeader(pools){
    for(idx in pools){
        const pool = JSON.parse(await redis.get(pools[idx]))
        if (pool.queuePos === 0){
            return pool // return leader
        }
    }
}

async function updateStatus(pool, leader){
    var updatedPool = pool;
    var status = STATUS.NOT_DELEGATED
    console.log(`${pool.wallet.delegation} === ${leader.poolIdBech32}`)
    if (pool.wallet.delegation === leader.poolIdBech32){
        status = STATUS.DELEGATED
        console.log("delegated")
    }
    updatedPool.status = status;
    return updatedPool;
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

async function requirmentsMeet(){
    // pool must have less than 50 lifetime blocks or less than 1 mill to enter queue 
    // (don't forget to minus Cardano foundation?)
    // return true / false
}


module.exports = {adaToLace, laceToAda, STATUS, requirmentsMeet, updateAllowedEpochs, updateLeader, updateStatus, balance, listUpdate, requeue, inactive, handleAddOn}
