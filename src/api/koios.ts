import {
  AccountInformation,
  PoolListItem,
  PoolMetadata,
  Tip,
} from "../types/koios";

const { default: axios } = require("axios");

export async function epoch(): Promise<Tip> {
  return await axios(`https://api.koios.rest/api/v0/tip`)
    .then((res: any) => {
      return res.data[0].epoch_no;
    })
    .catch((e: any) => {
      throw "koios epoch";
    });
}

export async function allCardanoPools(
  offset = 0,
  data = []
): Promise<PoolListItem[]> {
  const limit = 900;
  return await axios(
    `https://api.koios.rest/api/v0/pool_list?offset=${offset}&limit=${limit}`
  )
    .then((res: any) => {
      if (res.data.length > 0) {
        //@ts-ignore
        data.push(...res.data);
        // console.log(
        //   `GET https://api.koios.rest/api/v0/pool_list?offset=${offset}&limit=${limit}`
        // );
        return allCardanoPools(offset + limit, data);
      }
      return data;
    })
    .catch((e: any) => {
      throw "koios pools";
    });
}

export async function poolMeta(
  poolBech32Ids: string[]
): Promise<PoolMetadata[]> {
  return await axios
    .post(`https://api.koios.rest/api/v0/pool_metadata`, {
      _pool_bech32_ids: poolBech32Ids,
    })
    .then((res: any) => {
      return res.data;
    })
    .catch((e: any) => {
      throw "koios pool meta";
    });
}

export async function accountInfo(
  bech32StakeAddresses: string[]
): Promise<AccountInformation[]> {
  return await axios
    .post(`https://api.koios.rest/api/v0/account_info`, {
      _stake_addresses: [bech32StakeAddresses],
    })
    .then((res: any) => {
      return res.data;
    })
    .catch((e: any) => {
      throw new Error(`koios account info issue with ${bech32StakeAddresses}`);
    });
}
