const dotenv = require("dotenv")
const blockfrost = require('@blockfrost/blockfrost-js');
const redis = require('../db/redis')

dotenv.config()
const API = new blockfrost.BlockFrostAPI({
    projectId: process.env.BLOCKFROST,
});

// TODO add save and recover

async function todo(){
    console.log("blockfrost TODO")
}

async function updatePools(){
    console.log("update pools todo")
}

module.exports = {todo, updatePools};