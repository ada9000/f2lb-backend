const axios = require("axios");
const dotenv = require("dotenv");

import { accountInfo, allCardanoPools, tip, poolMeta } from "../api/koios";
import { epochsAllowed } from "../controllers/f2lb";
import { setPool } from "../model/pools";
import { addSupporter } from "../model/supporters";
import { PoolFromGSheet, SupporterFromGSheet } from "../types/googleSheets";
import { Pool, Supporter, Wallet } from "../types/gql";
import { AccountInformation, PoolMetadata } from "../types/koios";
import { hexToBech32, laceToAda } from "./utils";

dotenv.config();
const GOOGLE_API = process.env.GOOGLE_API;
//const redis = require("../db/redis");

// SCRAPE GOOGLE SHEET FOR SUPPORTERS
export async function recoverCurrentSupporters() {
  console.log("⏱️  recovering supporters from google sheet");
  const gSheetData = await axios(
    `https://sheets.googleapis.com/v4/spreadsheets/1-mA8vY0ZtzlVdH4XA5-J4nIZo4qFR_vFbnBFkpMLlYo/values/F2LB-Supporters?key=${GOOGLE_API}`
  ).then((res: any) => {
    return res.data.values.slice(1);
  });

  const gSheetSupporter: SupporterFromGSheet[] = [];
  for (let row in gSheetData) {
    const alias = gSheetData[row][0];
    const stakeAddrBech32 = gSheetData[row][2];
    gSheetSupporter.push({ alias, stakeAddrBech32 });
  }
  const bech32StakeAddresses: string[] = [];
  gSheetSupporter.forEach((x) => {
    bech32StakeAddresses.push(x.stakeAddrBech32);
  });

  const accounts = await accountInfo(bech32StakeAddresses);

  await gSheetSupporter.forEach(async (gSupporter) => {
    const wallets: Wallet[] = [];

    const foundWallets = accounts.filter((x) =>
      x.stake_address.match(gSupporter.stakeAddrBech32)
    );
    await foundWallets.forEach((foundWallet) => {
      const wallet: Wallet = {
        lace: parseInt(foundWallet.total_balance),
        //@ts-ignore TODO: handle
        delegatedBech32: foundWallet.delegated_pool,
        stakeAddr: foundWallet.stake_address,
      };
      wallets.push(wallet);
    });

    const supporter: Supporter = {
      supportingLeader: false,
      alias: gSupporter.alias,
      wallets: wallets,
    };
    await addSupporter(supporter);
  });
  console.log(`🏁 recover supporters finished`);
}

// SCRAPE GOOGLE SHEET FOR POOLS
export async function recoverCurrentPoolList() {
  console.log(`⏱️  recoverCurrentPoolList`);
  const currentPoolIndex = 14;
  const pools: Pool[] = new Array();

  const allPools = await allCardanoPools();
  const tickers: string[] = [];
  allPools.forEach((x) => {
    tickers.push(x.ticker);
  });

  // get data from google sheets
  const gSheetData = await axios(
    `https://sheets.googleapis.com/v4/spreadsheets/1-mA8vY0ZtzlVdH4XA5-J4nIZo4qFR_vFbnBFkpMLlYo/values/MainQueue?key=${GOOGLE_API}`
  ).then((res: any) => {
    const rows = res.data.values.slice(currentPoolIndex - 1); // minus 1 as google sheets counts from 1
    return rows;
  });

  // scrape google sheet
  const poolFromGSheet: PoolFromGSheet[] = [];
  await gSheetData.forEach((entry: any) => {
    const queuePos = parseInt(entry[1]);
    const tmpTicker = entry[3];
    const stakeKey = entry[9];
    const allowedEpochs = parseInt(entry[5]);
    const bech32 = hexToBech32(stakeKey);
    if (!bech32) {
      throw new Error(
        `bech32 address required '${tmpTicker}' failed with '${stakeKey}'`
      );
    }

    var poolId: string = "";
    if (tickers.includes(tmpTicker)) {
      // get pool id
      poolId = allPools.filter((x) => x.ticker === tmpTicker)[0].pool_id_bech32;
      if (!poolId) {
        throw new Error(`bech32 pool id required '${tmpTicker}'`);
      }
    } else if (entry[12].length >= 56) {
      // handle edge case of Koios
      poolId = entry[12];
    } else {
      throw new Error(`Missing pool id for ${tmpTicker}`);
    }

    poolFromGSheet.push({
      tmpTicker,
      allowedEpochs,
      bech32,
      poolId,
      queuePos,
    });
  });

  // obtain all bech32 stake ids for efficient api call
  const stakeBech32Ids: string[] = [];
  poolFromGSheet.forEach((p) => {
    stakeBech32Ids.push(p.bech32);
  });

  // obtain all bech32 pool ids for efficient api call
  const poolBech32Ids: string[] = [];
  poolFromGSheet.forEach((p) => {
    poolBech32Ids.push(p.poolId);
  });

  const poolMetadata = await poolMeta(poolBech32Ids);
  const poolWallets = await accountInfo(stakeBech32Ids);

  let targetEpoch = parseInt((await tip()).epoch_no);

  for (const idx in poolFromGSheet) {
    //await poolFromGSheet.forEach(async (p) => {
    const p = poolFromGSheet[idx];
    const metadata: PoolMetadata[] = poolMetadata.filter((x) =>
      x.pool_id_bech32.match(p.poolId)
    );

    const accountInfo: AccountInformation[] = poolWallets.filter((x) =>
      x.stake_address.match(p.bech32)
    );

    const wallets: Wallet[] = new Array();
    var totalLace = 0;
    accountInfo.forEach((account) => {
      totalLace += parseInt(account.total_balance);
      wallets.push({
        lace: parseInt(account.total_balance),
        //@ts-ignore TODO: handle
        delegatedBech32: account.delegated_pool,
        stakeAddr: account.stake_address,
      });
    });

    console.log(JSON.stringify(wallets));

    const bech32 = p.poolId;
    const queuePos = p.queuePos;

    const ticker = metadata[0]?.meta_json?.ticker
      ? metadata[0].meta_json.ticker
      : p.tmpTicker;

    // assign allowed epochs
    const ada = laceToAda(totalLace.toString());
    let allowedEpochs = 0;
    if (ada > 1000) {
      allowedEpochs = 1;
    }
    if (ada > 3000) {
      allowedEpochs = 2;
    }
    if (ada > 10000) {
      allowedEpochs = 3;
    }
    if (ada > 40000) {
      allowedEpochs = 4;
    }

    // TODO: REMOVE ONE EPOCH - due to epochsAllowed not accounting for last past epoch on first pool in queue
    if (p.tmpTicker.match("T2H")) {
      allowedEpochs -= 1;
    }
    // TODO: ABOVE

    const assignedEpochs: number[] = new Array();

    for (
      let index = targetEpoch;
      index < targetEpoch + allowedEpochs;
      index++
    ) {
      assignedEpochs.push(index);
    }

    targetEpoch += allowedEpochs;

    pools.push({
      supportingLeader: false,
      bech32,
      ticker,
      allowedEpochs,
      assignedEpochs,
      wallets,
      queuePos,
    });
  }

  for (const pool of pools) {
    await setPool(pool);
  }
  console.log(`🏁 recover pool list finished`);
}
