const { default: axios } = require("axios");

async function epoch(){
    return await axios(`https://api.koios.rest/api/v0/tip`)
    .then(res => {
        return res.data[0].epoch_no
    }).catch(e => {
        throw 'koios epoch' 
    })
}

async function pools(offset=0, data=[]){
    const limit = 900;
    return await axios(`https://api.koios.rest/api/v0/pool_list?offset=${offset}&limit=${limit}`)
    .then(res => {
        if (res.data.length > 0){
            data.push(...res.data);
            console.log(`GET https://api.koios.rest/api/v0/pool_list?offset=${offset}&limit=${limit}`);
            return pools(offset + limit, data);
        }
        return data
    }).catch(e => {
        throw 'koios pools' 
    })
}

async function poolMeta(poolId){
    return await axios.post(`https://api.koios.rest/api/v0/pool_metadata`,{
        "_pool_bech32_ids":[
            poolId
        ]
    }).then(res => {return  res.data })
    .catch(e => {
        throw 'koios pool meta' 
    })
}
async function accountInfo(bech32StakeAddress){
    return await axios(`https://api.koios.rest/api/v0/account_info?_address=${bech32StakeAddress}`)
    .then(res => {return res.data[0]})
    .catch(e => {
        throw 'koios account info' 
    })
}

module.exports = {epoch, pools, poolMeta, accountInfo};