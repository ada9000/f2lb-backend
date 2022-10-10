const axios = require("axios");
const dotenv = require("dotenv");

import { accountInfo, allCardanoPools, epoch, poolMeta } from "../api/koios";
import { epochsAllowed } from "../controllers/f2lb";
import { addPool } from "../model/pools";
import { addSupporter } from "../model/supporters";
import { PoolFromGSheet, SupporterFromGSheet } from "../types/googleSheets";
import { Pool, Supporter, Wallet } from "../types/gql";
import { AccountInformation, PoolMetadata } from "../types/koios";
import { hexToBech32, laceToAda } from "./utils";

dotenv.config();
const GOOGLE_API = process.env.GOOGLE_API;
//const redis = require("../db/redis");

// SCRAPE GOOGLE SHEET FOR SUPPORTERS
export async function findSupporters() {
  console.log("Recovering supporters from google sheet");
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
        lace: foundWallet.total_balance,
        delegatedBech32: foundWallet.delegated_pool,
      };
      wallets.push(wallet);
    });

    const supporter: Supporter = {
      supportingLeader: false,
      alias: gSupporter.alias,
      wallets: wallets,
    };
    console.log(
      `\n[${gSupporter.alias}]adding supporter ${JSON.stringify(
        supporter
      )} with ${gSupporter.stakeAddrBech32}`
    );
    await addSupporter(supporter);
  });
}

// SCRAPE GOOGLE SHEET FOR POOLS
export async function recoverCurrentPoolList() {
  console.log(`recoverCurrentPoolList`);
  const currentPoolIndex = 14;
  const pools: Pool[] = new Array();

  var targetEpoch = (await epoch()).epoch_no;
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
    const tmpTicker = entry[2];
    const stakeKey = entry[8];
    const allowedEpochs = entry[4];
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
    } else if (entry[11].length >= 56) {
      // handle edge case of Koios
      poolId = entry[11];
    } else {
      throw new Error(`Missing pool id for ${tmpTicker}`);
    }

    poolFromGSheet.push({
      tmpTicker,
      allowedEpochs,
      bech32,
      poolId,
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

  await poolFromGSheet.forEach(async (p) => {
    console.log(`Building data for [${p.tmpTicker}]`);
    const metadata: PoolMetadata[] = poolMetadata.filter((x) =>
      x.pool_id_bech32.match(p.poolId)
    );

    const accountInfo: AccountInformation[] = poolWallets.filter((x) =>
      x.stake_address.match(p.bech32)
    );

    const wallets: Wallet[] = new Array();
    var totalLace = 0;
    accountInfo.forEach((account) => {
      totalLace += account.total_balance;
      wallets.push({
        lace: account.total_balance,
        delegatedBech32: account.delegated_pool,
      });
    });

    const bech32 = p.poolId;

    const ticker = metadata[0]?.meta_json?.ticker
      ? metadata[0].meta_json.ticker
      : p.tmpTicker;
    const allowedEpochs = await epochsAllowed(totalLace);
    const assignedEpochs = [0];
    console.log(
      `[${ticker}] -> ${bech32}, ${allowedEpochs}, ${assignedEpochs}, ${JSON.stringify(
        wallets
      )}`
    );

    pools.push({
      supportingLeader: false,
      bech32,
      ticker,
      allowedEpochs,
      assignedEpochs,
      wallets,
    });
  });

  console.log(`pools ${Object.keys(pools)}`);
  for (const pool of pools) {
    await addPool(pool);
    console.log(
      `Added pool [${pool.ticker}] with '${laceToAda(
        pool?.wallets[0]?.lace.toString()
      )} ada' to db`
    );
  }
  console.log("finished recoverCurrentPoolList()");
}
