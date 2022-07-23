//const fetch = require("node-fetch");
const axios = require('axios');
const dotenv = require("dotenv")
const blockfrost = require('@blockfrost/blockfrost-js');
dotenv.config()
const GOOGLE_API = process.env.GOOGLE_API
const {bech32} = require('bech32');

async function getGooglesheetData(){
    const gSheetData = await axios(`https://sheets.googleapis.com/v4/spreadsheets/1-mA8vY0ZtzlVdH4XA5-J4nIZo4qFR_vFbnBFkpMLlYo/values/MainQueue?key=${GOOGLE_API}`)
    .then(res => {
        //const header = res.data.values[1];
        const rows = res.data.values.slice(15);
        //return [header, ...rows]
        return rows
    })


    for(row in gSheetData){
        const stakeHex = gSheetData[row][8];
        const stakeAddressDecoded = 'e1' + stakeHex;
        var bech32StakeAddress = stakeHex;
        if (stakeHex.indexOf("stake") !== 0){
           bech32StakeAddress = bech32.encode(
              'stake',
              bech32.toWords(Uint8Array.from(Buffer.from(stakeAddressDecoded, 'hex'))),
              1000
            );
        }
        const ticker = gSheetData[row][2]
        console.log(`${ticker} : ${bech32StakeAddress}`)
    }
}

getGooglesheetData()