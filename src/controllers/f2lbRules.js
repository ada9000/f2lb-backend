const koios = require("../api/koios");

const STATUS = {
  DELEGATED: 0,
  NOT_DELEGATED: 1,
};

function adaToLace(ada) {
  return parseFloat(ada) * 1000000;
}

function laceToAda(lace) {
  return parseFloat(lace) / 1000000.0;
}

async function addNewPool(poolId, stakeAddress) {
  // TODO (also run for ANTRX)
}

async function addNewSupporter(alias, stakeAddress) {
  // TODO
}

async function updateAllowedEpochs(pool, epoch) {
  var updatedPool = JSON.parse(JSON.stringify(pool));
  // get ada
  const accountInfo = await koios.accountInfo(pool.wallet.stakeAddress);
  const ada = laceToAda(accountInfo.total_balance);
  // console.log(`updateAllowedEpochs ada = ${ada}`)
  // calc epochs
  var epochsGranted = 0;
  if (ada > 1000) {
    epochsGranted = 1;
  }
  if (ada > 3000) {
    epochsGranted = 2;
  }
  if (ada > 10000) {
    epochsGranted = 3;
  }
  if (ada > 40000) {
    epochsGranted = 4;
  }
  // if the target pool is in the next 7 to be selected
  // enter reduce only mode
  if (pool.epochs[0] - 7 < epoch) {
    // console.log(`top7 pool}`)
    epochsGranted = 4;
    if (ada <= 40000) {
      epochsGranted = 3;
    }
    if (ada <= 10000) {
      epochsGranted = 2;
    }
    if (ada <= 3000) {
      epochsGranted = 1;
    }
    if (ada <= 1000) {
      epochsGranted = 0;
    }
    if (epochsGranted > pool.epochsGranted) {
      epochsGranted = pool.epochsGranted;
    }
  }
  // console.log(`epochsGranted = ${epochsGranted}`)
  updatedPool.epochsGranted = epochsGranted;
  return updatedPool;
}

/*
async function updateLeader(pools){
    for(idx in pools){
        const pool = JSON.parse(await redis.get(pools[idx]))
        if (pool.queuePos === 0){
            return pool // return leader
        }
    }
}
*/

async function epochChanged(epoch) {
  const actualEpoch = await koios.epoch();
  if (parseInt(actualEpoch) > parseInt(epoch)) {
    return true;
  }
  return false;
}

async function updateStatus(pool, leader) {
  var updatedPool = JSON.parse(JSON.stringify(pool));
  var status = STATUS.NOT_DELEGATED;
  console.log(
    `updating pool '${pool.ticker}' with status '${pool.status}' delgated to ${
      pool.wallet.delegation
    } with '${laceToAda(pool.wallet.amount)}' ADA`
  );

  // update using koios
  const accountInfo = await koios.accountInfo(pool.wallet.stakeAddress);
  const laceAmount = parseInt(accountInfo.total_balance);
  const delegation = accountInfo.delegated_pool;

  console.log(delegation);
  updatedPool.wallet.amount = laceAmount;
  updatedPool.wallet.delegation = delegation;
  updatedPool.wallet.delegationTicker = await koios
    .poolMeta(delegation)
    .then((res) => {
      return res[0].meta_json.ticker;
    })
    .catch(() => {
      return "NOT FOUND";
    });

  //console.log(`${pool.wallet.delegation} === ${leader.poolIdBech32}`)
  if (updatedPool.wallet.delegation === leader.poolIdBech32) {
    status = STATUS.DELEGATED;
    // console.log("delegated")
  }
  updatedPool.status = status;

  console.log(
    `finshed update for pool '${updatedPool.ticker}' with status '${
      updatedPool.status
    }' delgated to ${updatedPool.wallet.delegation} with '${laceToAda(
      updatedPool.wallet.amount
    )}' ADA`
  );
  return updatedPool;
}

async function updateQueue(pools, epoch) {
  var updatedPools = JSON.parse(JSON.stringify(pools));
  // order by pos so higest number first
  updatedPools.sort(function (a, b) {
    return b.queuePos - a.queuePos;
  });
  // update each pool using status
  var lastIdx = null;
  for (idx in updatedPools) {
    if (parseInt(idx) === updatedPools.length - 1) {
      // ignore current leader (they delegate to themselves anyway)
      continue;
    }
    if (lastIdx !== null && updatedPools[idx].status === STATUS.NOT_DELEGATED) {
      // swap last pool with current pool
      // i.e move last pool up the queue and current pool down the queue
      if (updatedPools[lastIdx].status !== STATUS.NOT_DELEGATED) {
        lastPoolsPos = updatedPools[lastIdx].queuePos;
        currentPoolPos = updatedPools[idx].queuePos;
        updatedPools[lastIdx].queuePos = currentPoolPos;
        updatedPools[idx].queuePos = lastPoolsPos;
      }
    }
    lastIdx = idx;
  }
  // check if leader has any epochs left
  const lastPos = updatedPools[0].queuePos;
  if (updatedPools[updatedPools.length - 1].queuePos === 0) {
    const epochs = updatedPools[updatedPools.length - 1].epochs;
    var epochsLeft = 0;
    for (idx in epochs) {
      if (epochs[idx] >= epoch) {
        epochsLeft += 1;
      }
    }
    // if no epochs left move leader to back of the queue
    if (epochsLeft === 0) {
      console.log("no epochs");
      updatedPools[updatedPools.length - 1].queuePos = lastPos + 1;
    }
  }
  // sort so queuepos 0 is first pool
  updatedPools.sort(function (a, b) {
    return a.queuePos - b.queuePos;
  });
  return updatedPools;
}

async function update(pools, epoch) {
  var updatedPools = JSON.parse(JSON.stringify(pools));
  // update all status
  const leader = updatedPools[0];
  console.log(`leader ticker is '${leader.ticker}'`);
  for (idx in updatedPools) {
    //console.log(updatedPools[idx])
    updatedPools[idx] = await updateStatus(updatedPools[idx], leader);
  }

  // if epoch change update list
  if (await epochChanged(epoch)) {
    const actualEpoch = await koios.epoch();
    console.log(`epcoh changed to '${actualEpoch}'`);
    return await updateQueue(updatedPools, actualEpoch);
  }
  console.log(`no change returning updated`);
  return updatedPools;
}

async function inactive() {
  // after 6 failed epochs
  // remove from queue
  // update queue
}

async function handleAddOn() {
  // take one epoch from the pool
  // move that epoch into add on queue
  // TODO think about this more
}

async function requirmentsMeet() {
  // pool must have less than 50 lifetime blocks or less than 1 mill to enter queue
  // (don't forget to minus Cardano foundation?)
  // return true / false
}

module.exports = {
  adaToLace,
  laceToAda,
  STATUS,
  requirmentsMeet,
  updateAllowedEpochs,
  updateStatus,
  epochChanged,
  updateQueue,
  update,
  inactive,
  handleAddOn,
};
