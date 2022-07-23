const dotenv = require("dotenv")
const blockfrost = require('@blockfrost/blockfrost-js');
//const redis = require('../db/redis')

dotenv.config()
const API = new blockfrost.BlockFrostAPI({
    projectId: process.env.BLOCKFROST,
});

async function getEpoch(){
    return await API.epochsLatest();
}

// TODO add save and recover
async function getStakeInfo(stakeKey){
    const epoch = await API.epochsLatest();
    //const x = await  API.accountsDelegations(stakeKey);
    const account = await  API.accounts(stakeKey);
    console.log(epoch)
    console.log(account)
    console.log(epoch.epoch)
    console.log(account.pool_id)
    console.log(account.controlled_amount / 1000000)
}


async function todo(){
    console.log("blockfrost TODO")
}

async function updatePools(){
    console.log("update pools todo")
}

module.exports = {todo, updatePools, getStakeInfo, getEpoch};