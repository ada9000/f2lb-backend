async function requirmentsMeet(){
    // pool must have less than 50 lifetime blocks or less than 1 mill to enter queue 
    // (don't forget to minus Cardano foundation?)
    // return true / false
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

module.exports = {requirmentsMeet, balance, listUpdate, requeue, inactive, handleAddOn}
