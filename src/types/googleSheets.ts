export type PoolFromGSheet = {
  tmpTicker: string;
  allowedEpochs: number;
  bech32: string;
  poolId: string;
  queuePos: number;
};

export type SupporterFromGSheet = {
  alias: string;
  stakeAddrBech32: string;
};
