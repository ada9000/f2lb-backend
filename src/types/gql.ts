export type Supporter = {
  supportingLeader: boolean;
  alias: String;
  wallets: Wallet[];
};

export type Pool = {
  supportingLeader: boolean;
  bech32: string;
  ticker: string;
  description?: string;
  website?: string;
  imageUrl?: string;
  queuePos: number;
  allowedEpochs: number;
  assignedEpochs: number[];
  wallets: Wallet[];
};

export type Wallet = {
  lace: number;
  stakeAddr: string;
  delegatedBech32: string | null;
  ticker?: string;
};
