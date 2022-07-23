//const fetch = require("node-fetch");
const axios = require('axios');
const dotenv = require("dotenv")
const blockfrost = require('@blockfrost/blockfrost-js');
dotenv.config()
const GOOGLE_API = process.env.GOOGLE_API

axios(`https://sheets.googleapis.com/v4/spreadsheets/1-mA8vY0ZtzlVdH4XA5-J4nIZo4qFR_vFbnBFkpMLlYo/values/MainQueue?key=${GOOGLE_API}`)
.then(res => {
    const header = res.data.values[1];
    const rows = res.data.values.slice(2);
    console.log(header)
    console.log(rows)
})