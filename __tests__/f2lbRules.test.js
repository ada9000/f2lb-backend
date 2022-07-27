const { epochs } = require('@blockfrost/blockfrost-js/lib/endpoints/api/epochs')
const koios = require('../api/koios')
const fs = require('fs');
const { adaToLace, laceToAda, updateAllowedEpochs, updateStatus, STATUS, epochChanged, updateQueue } = require('../controllers/f2lbRules')

jest.mock('../api/koios')
const poolMock = {
    poolIdBech32: "pool1fu6ppur5uumrpydpeswzrvfg4epr68xw39aar9rcu56tk5ukat3",
    ticker: "PIXEL",
    website: "https://pixelpool.io/",
    imageUrl: "https://pixelpool.io/assets/pool/pool_logo.png",
    description: "Pixel believes in a decentralized future achieved with sustainable solutions. Will always be a single pool operator donating profits to environmental projects.",
    epochsGranted: 2,
    epochs: [400, 401],
    numEpochs: 2,
    queuePos: 10,
    status: 0,
    wallet: {
      stakeAddress: "stake1uxh85e3y330pj3fx8y8dgje94pam5zklj9x3zaxz6fztqmq03a8jr",
      amount: 3000000001,
      delegation: "pool13vc4ekwpky5vtnl8pyj60phkmwtv7gsthn4g525udt7mjycs85v",
      delegationTicker: "ANTRX"
    }
}
// load pools mocking data from file
const poolsMock = JSON.parse(fs.readFileSync('__tests__/queueMock.json', 'utf8'));

async function test(){
    return await koios.poolMeta(delegation)
}

describe("ada conversions", () =>{
    it('ada to lace', () =>{
        expect(adaToLace(1)).toBe(1000000);
    })
    it('lace to ada', () =>{
        expect(laceToAda(1000000)).toBe(1);
    })
    it('ada to lac decimal', () =>{
        expect(adaToLace(1.1)).toBe(1100000);
    })
}),
describe("update Allowed epochs", () =>{
    it('over 1k ada gives 1 assigned epochs', async () =>{
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:adaToLace(1000.1)});
        const updatedPool = await updateAllowedEpochs(poolMock, 300);
        expect(updatedPool.epochsGranted).toBe(1);
    })
    it('over 3k ada gives 2 assigned epochs', async () =>{
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:adaToLace(3000.1)});
        const updatedPool = await updateAllowedEpochs(poolMock, 300);
        expect(updatedPool.epochsGranted).toBe(2);
    })
    it('over 10k ada gives 3 assigned epochs', async () =>{
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:adaToLace(10000.1)});
        const updatedPool = await updateAllowedEpochs(poolMock, 300);
        expect(updatedPool.epochsGranted).toBe(3);
    })
    it('over 40k ada gives 4 assigned epochs', async () =>{
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:adaToLace(40000.1)});
        const updatedPool = await updateAllowedEpochs(poolMock, 300);
        expect(updatedPool.epochsGranted).toBe(4);
    })
    it('exactly 1k ada gives 0 assigned epochs', async () =>{
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:adaToLace(1000)});
        const updatedPool = await updateAllowedEpochs(poolMock, 300);
        expect(updatedPool.epochsGranted).toBe(0);
    })
    it('under 1k ada gives 0 assigned epochs', async () =>{
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:adaToLace(100)});
        const updatedPool = await updateAllowedEpochs(poolMock, 300);
        expect(updatedPool.epochsGranted).toBe(0);
    })
    it('in next 7, reduced stake from over 4k to 1k reduces blocks allowed', async () =>{
        var updatedPoolMock = poolMock;
        updatedPoolMock.wallet.amount = adaToLace(4000)
        updatedPoolMock.queuePos = 5
        updatedPoolMock.epochs = [305, 306]
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:adaToLace(1000.1)});
        const updatedPool = await updateAllowedEpochs(updatedPoolMock, 300);
        expect(updatedPool.epochsGranted).toBe(1);
    })
    it('in next 7, reduced stake from over 4k to 10k same blocks allowed', async () =>{
        var updatedPoolMock = poolMock;
        updatedPoolMock.wallet.amount = adaToLace(4000)
        updatedPoolMock.queuePos = 5
        updatedPoolMock.epochs = [305, 306]
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:adaToLace(10000)});
        const updatedPool = await updateAllowedEpochs(updatedPoolMock, 300);
        expect(updatedPool.epochsGranted).toBe(2);
    })
    it('in next 7, reduced stake from over 4k to 0 no blocks allowed', async () =>{
        var updatedPoolMock = poolMock;
        updatedPoolMock.wallet.amount = adaToLace(4000)
        updatedPoolMock.queuePos = 5
        updatedPoolMock.epochs = [305, 306]
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:0});
        const updatedPool = await updateAllowedEpochs(updatedPoolMock, 300);
        expect(updatedPool.epochsGranted).toBe(0);
    })

}),
describe("update status", () =>{
    const targetPool = {
        poolIdBech32: poolMock.wallet.delegation
    }
    it('pool wallet matches target wallet', async () =>{
        var updatedPoolMock = poolMock;
        const updatedPool = await updateStatus(updatedPoolMock, targetPool);
        expect(updatedPool.status).toBe(STATUS.DELEGATED);
    })
    it('pool wallet doesn\'t match target', async () =>{
        var updatedPoolMock = poolMock;
        updatedPoolMock.wallet.delegation = "pool1fu6ppur5uumrpydpeswzrvfg4epr68xw39aar9rcu56tk5ukat3";
        const updatedPool = await updateStatus(updatedPoolMock, targetPool);
        expect(updatedPool.status).toBe(STATUS.NOT_DELEGATED);
    })
    it('status values are correct', ()=>{
        expect(STATUS.DELEGATED).toBe(0);
        expect(STATUS.NOT_DELEGATED).toBe(1);
    })
}),
describe("epoch changed", () =>{
    it('epoch hasnt changed', async () =>{
        koios.epoch = jest.fn().mockReturnValue(300);
        const res = await epochChanged(300)
        expect(res).not.toBeTruthy()
    })
    it('epoch has changed, expect callback', async () =>{
        koios.epoch = jest.fn().mockReturnValue(301);
        const res = await epochChanged(300)
        expect(res).toBeTruthy()
    })
})
describe("update queue", () =>{
    it('pool with status 1 is moved down', async () =>{
        let pools = JSON.parse(JSON.stringify(poolsMock));
        pools[pools.length-1].status = STATUS.NOT_DELEGATED; // alter last pools status
        pools[23].status = STATUS.NOT_DELEGATED; // pixel
        const pool0 = pools[pools.length-1].ticker;
        const pool1 = pools[23].ticker;
        const updatedQueue = await updateQueue(pools, 353);
        expect(updatedQueue[0].queuePos).toBe(0);
        expect(updatedQueue[pools.length-1].ticker).toBe(pool0);
        expect(updatedQueue[24].ticker).toBe(pool1);
    })
    it('multiple pools with status 1 at bottom of pool do not change', async () =>{
        let pools = JSON.parse(JSON.stringify(poolsMock));
        pools[pools.length-1].status = STATUS.NOT_DELEGATED; // alter last pools status
        pools[pools.length-2].status = STATUS.NOT_DELEGATED; // alter last pools status
        pools[pools.length-3].status = STATUS.NOT_DELEGATED; // alter last pools status
        const pool0 = pools[pools.length-1].ticker;
        const pool1 = pools[pools.length-2].ticker;
        const pool2 = pools[pools.length-3].ticker;
        const updatedQueue = await updateQueue(pools, 353);
        expect(updatedQueue[pools.length-1].ticker).toBe(pool0);
        expect(updatedQueue[pools.length-2].ticker).toBe(pool1);
        expect(updatedQueue[pools.length-3].ticker).toBe(pool2);
    })
    it('multiple pools not delgated with a single pool gap', async () =>{
        let pools = JSON.parse(JSON.stringify(poolsMock));
        pools[pools.length-1].status = STATUS.NOT_DELEGATED; // alter last pools status
        pools[pools.length-2].status = STATUS.NOT_DELEGATED; // alter last pools status
        pools[pools.length-3].status = STATUS.NOT_DELEGATED; // alter last pools status
        pools[pools.length-5].status = STATUS.NOT_DELEGATED; // alter last pools status
        const pool0 = pools[pools.length-1].ticker;
        const pool1 = pools[pools.length-2].ticker;
        const pool2 = pools[pools.length-3].ticker;
        const pool3 = pools[pools.length-5].ticker;
        const updatedQueue = await updateQueue(pools, 353);
        expect(updatedQueue[pools.length-1].ticker).toBe(pool0);
        expect(updatedQueue[pools.length-2].ticker).toBe(pool1);
        expect(updatedQueue[pools.length-3].ticker).toBe(pool2);
        expect(updatedQueue[pools.length-4].ticker).toBe(pool3);
        /* TODO uncomment if you want to double check 😅
        console.log("old")
        console.log(`${pools[pools.length-5].ticker} status=${pools[pools.length-5].status}`)
        console.log(`${pools[pools.length-4].ticker} status=${pools[pools.length-4].status}`)
        console.log(`${pools[pools.length-3].ticker} status=${pools[pools.length-3].status}`)
        console.log(`${pools[pools.length-2].ticker} status=${pools[pools.length-2].status}`)
        console.log(`${pools[pools.length-1].ticker} status=${pools[pools.length-1].status}`)
        console.log("new")
        console.log(updatedQueue[pools.length-5].ticker)
        console.log(updatedQueue[pools.length-4].ticker)
        console.log(updatedQueue[pools.length-3].ticker)
        console.log(updatedQueue[pools.length-2].ticker)
        console.log(updatedQueue[pools.length-1].ticker)
        */
    })
    it('leader is no loneger leader and moved to end of queue', async () =>{
        let pools = JSON.parse(JSON.stringify(poolsMock));
        const leaderTicker = pools[0].ticker;
        const updatedQueue = await updateQueue(pools, 355);
        expect(updatedQueue[updatedQueue.length-1].ticker).toBe(leaderTicker);
    })
    it('leader is not delgated, but keeps position', async () =>{
        let pools = JSON.parse(JSON.stringify(poolsMock));
        //var pools = JSON.parse(fs.readFileSync('__tests__/queueMock.json', 'utf8'));
        pools[0].status = STATUS.NOT_DELEGATED;
        const updatedQueue = await updateQueue(pools, 353);
        console.log(`${pools[0].queuePos} ${pools[0].ticker}`)
        console.log(`${updatedQueue[0].queuePos} ${updatedQueue[0].ticker}`)
        expect(updatedQueue[0].queuePos).toBe(0);

    })
})
describe("update leader", () =>{
    it('new leader is assgined', async () =>{
    })
})
describe("full tests", () =>{
    it('epoch changes pool moves down queue, new leader is assigned', async () =>{
        // set status

        // update epoch

        // update list

        // update leader
    })
})
