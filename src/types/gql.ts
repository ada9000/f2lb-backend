export type Supporter = {
  supportingLeader: boolean;
  alias: String;
  wallets: [Wallet];
};

export type Pool = {
  supportingLeader: boolean;
  bech32: string;
  ticker: string;
  description?: string;
  website?: string;
  imageUrl?: string;
  epochs: [number];
  wallets: [Wallet];
};

export type Wallet = {
  lace: number;
  delegatedBech32: String;
  ticker: String;
};
