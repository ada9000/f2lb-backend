const { getPools } = require("../model/pools");

export const resolvers = {
  Query: {
    Pools: async () => {
      console.log("pools query");
      const pools = await getPools();
      console.log(pools[0]);
      return pools;
    },
    Supporters: async () => {
      return [];
    },
  },
};
