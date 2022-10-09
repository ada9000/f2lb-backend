//const fetch = require("node-fetch");
const axios = require("axios");
const dotenv = require("dotenv");
const koios = require("../api/koios");
dotenv.config();
const GOOGLE_API = process.env.GOOGLE_API;
const { bech32 } = require("bech32");
//const redis = require("../db/redis");
const { updateAllowedEpochs } = require("../controllers/f2lbRules");

async function findSupporters() {
  console.log("Recovering supporters from googlesheet");
  const gSheetData = await axios(
    `https://sheets.googleapis.com/v4/spreadsheets/1-mA8vY0ZtzlVdH4XA5-J4nIZo4qFR_vFbnBFkpMLlYo/values/F2LB-Supporters?key=${GOOGLE_API}`
  ).then((res: any) => {
    return res.data.values.slice(1);
  });
  console.log(gSheetData);

  var supporters: any[] = [];

  type a = {
    alias: string;
    bech32: string;
  };
  let tmp: a[] = [];
  for (let row in gSheetData) {
    const alias = gSheetData[row][0];
    const bech32 = gSheetData[row][2];
    console.log(alias, bech32);
    tmp.push({ alias, bech32 });
  }
  const hmm: any[] = [];
  tmp.forEach((x) => {
    hmm.push(x.bech32);
  });

  const accounts = await koios.accountInfo(hmm);
  console.log(accounts);

  await tmp.forEach(async (supporter) => {
    const accInfo = accounts[supporter.bech32];

    const laceAmount = parseInt(accInfo.total_balance);
    const delegation = accInfo.delegated_pool;
    //@ts-ignore
    const delegationTicker = await koios.poolMeta(delegation).then((res) => {
      return res[0].meta_json.ticker;
    });
    const supporterInfo = {
      alias: supporter.alias,
      status: 0,
      wallet: {
        stakeAddress: supporter.bech32,
        amount: laceAmount,
        delegation: delegation,
        delegationTicker: delegationTicker,
      },
    };
    console.log(
      `adding supporter ${supporter.alias} with wallet ${laceAmount}`
    );
    supporters.push(supporterInfo);
  });

  //@ts-ignore
  redis.set("supporters", JSON.stringify(supporters));
}

async function findCurrentList() {
  console.log("Recovering data from googlesheet. Try again on error...");
  //@ts-ignore
  var pools = [];
  const gSheetData = await axios(
    `https://sheets.googleapis.com/v4/spreadsheets/1-mA8vY0ZtzlVdH4XA5-J4nIZo4qFR_vFbnBFkpMLlYo/values/MainQueue?key=${GOOGLE_API}`
    //@ts-ignore
  ).then((res) => {
    //const header = res.data.values[1];
    //@ts-ignore
    const rows = res.data.values.slice(12);
    return rows;
  });

  //@ts-ignore
  const currentEpoch = await koios.epoch();
  const poolList = await koios.pools().then((d: any) => {
    return d;
  });

  console.log("pool list done");

  var targetEpoch = parseInt(currentEpoch);
  var index = 0;
  for (let row in gSheetData) {
    const stakeHex = gSheetData[row][8];
    const stakeAddressDecoded = "e1" + stakeHex;
    var bech32StakeAddress = stakeHex;
    if (stakeHex.indexOf("stake") !== 0) {
      bech32StakeAddress = bech32.encode(
        "stake",
        bech32.toWords(
          Uint8Array.from(Buffer.from(stakeAddressDecoded, "hex"))
        ),
        1000
      );
    }
    // calc epochs
    const ticker = gSheetData[row][2];
    const epochsGranted = parseInt(gSheetData[row][4]);
    var epochs = [];
    for (let i = 0; i < epochsGranted; i++) {
      //@ts-ignore
      epochs.push(parseInt(targetEpoch + i));
    }
    //@ts-ignore
    targetEpoch += epochsGranted;
    // get pool ID
    //@ts-ignore
    const poolData = await poolList.find(
      //@ts-ignore
      (p: any) =>
        p.ticker !== null && p.ticker.toUpperCase() === ticker.toUpperCase()
    );
    var poolId = undefined;
    if (poolData !== undefined) {
      poolId = poolData.pool_id_bech32;
    } else if (ticker.toUpperCase() === "MAPLE") {
      // handle edge case
      console.log(`🐛 ${ticker}`);
      poolId = "pool1xpfe5q3v3axrjdc8h38taaa93frq3m9pfewxk46x4r6jgy2yj5n";
    } else {
      throw `Pool not found with ${ticker} when using https://api.koios.rest/api/v0/pool_list (retry)`;
    }
    // get metadata
    console.log("B4 Pool metadata");
    console.log(poolId);
    const poolMeta = await koios.poolMeta(poolId);
    console.log("Pool metadata");
    console.log(poolMeta);
    console.log(poolMeta[0]);
    var website: string;
    var description: string;
    var metaUrl: string;
    var image: string;
    if (poolMeta[0]) {
      website = poolMeta[0].meta_json.homepage;
      description = poolMeta[0].meta_json.description;
      metaUrl = poolMeta[0].meta_url;
    } else {
      throw new Error("boo");
    }

    if (metaUrl) {
      var meta = null;
      try {
        meta = await axios(metaUrl).then((res: any) => {
          return res.data;
        });
      } catch (e) {}
      var extendedMeta = null;
      try {
        extendedMeta = await axios(meta.extended).then((res: any) => {
          return res.data;
        });
      } catch (e) {}
      image = extendedMeta ? extendedMeta.info.url_png_logo : null;
    }

    // get wallet info
    const accountInfo = await koios.accountInfo(bech32StakeAddress);
    const laceAmount = parseInt(accountInfo.total_balance);
    const delegation = accountInfo.delegated_pool;

    var delegationTicker = await koios.poolMeta(delegation).then((res: any) => {
        return res[0].meta_json.ticker;
      });
    }
    // create pool json
    const pool = {
      poolIdBech32: poolId,
      ticker: ticker,
      website: website,
      //@ts-ignore
      imageUrl: image ? image : undefined,
      description: description,
      epochs: epochs,
      numEpochs: epochs.length,
      queuePos: index,
      status: 0,
      wallet: {
        stakeAddress: bech32StakeAddress,
        amount: laceAmount,
        delegation: delegation,
        delegationTicker: delegationTicker,
      },
    };
    var updatedPool = await updateAllowedEpochs(pool, 0); // update allowed epochs on recovery

    redis.set(poolId, JSON.stringify(updatedPool));
    pools.push(poolId);
    index += 1;
    console.log(
      `\nFinshed processing import for ${ticker}\n\tEpochs [${epochs}]\n\tLace '${laceAmount}'\n\tDelegated to ${delegationTicker}`
    );
  }
  redis.set("epoch", currentEpoch);
  redis.set("pools", JSON.stringify(pools));
  return pools;
}

module.exports = { findSupporters, findCurrentList };
