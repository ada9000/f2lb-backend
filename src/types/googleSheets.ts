export type PoolFromGSheet = {
  tmpTicker: string;
  allowedEpochs: number;
  bech32: string;
  poolId: string;
};

export type SupporterFromGSheet = {
  alias: string;
  stakeAddrBech32: string;
};
