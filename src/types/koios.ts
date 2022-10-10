export type AccountInformation = {
  stake_address: string;
  status: "registered" | "not registered";
  delegated_pool: string | null;
  total_balance: string;
  utxo: string;
  rewards: string;
  withdrawals: string;
  rewards_available: string;
  reserves: string;
  treasury: string;
};

export type PoolMetadata = {
  pool_id_bech32: string;
  meta_url: string;
  meta_hash: string;
  meta_json: {
    name: string;
    ticker: string;
    homepage: string;
    description: string;
  };
};

export type PoolListItem = {
  pool_id_bech32: string;
  ticker: string;
};

export type Tip = {
  hash: string;
  epoch_no: string;
  abs_slot: string;
  epoch_slot: string;
  block_no: string;
  block_time: string;
};
