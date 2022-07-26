const { epochs } = require('@blockfrost/blockfrost-js/lib/endpoints/api/epochs')
const koios = require('../api/koios')
const { adaToLace, laceToAda, updateAllowedEpochs } = require('../controllers/f2lbRules')

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

async function test(){
    return await koios.poolMeta(delegation)
}

describe("update Allowed epochs", () =>{
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
    afterEach(() => {
        jest.clearAllMocks()
    })

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
        console.log("a")
        var updatedPoolMock = poolMock;
        console.log(poolMock)
        console.log(updatedPoolMock)
        updatedPoolMock.wallet.amount = adaToLace(4000)
        updatedPoolMock.queuePos = 5
        updatedPoolMock.epochs = [305, 306]
        console.log(`epochs granted = ${updatedPoolMock.epochsGranted} epochs = ${updatedPoolMock.ticker}` ) 
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:adaToLace(10000)});
        const updatedPool = await updateAllowedEpochs(updatedPoolMock, 300);
        expect(updatedPool.epochsGranted).toBe(2);
    })
    it('in next 7, reduced stake from over 4k to 0 no blocks allowed', async () =>{
        console.log("a")
        var updatedPoolMock = poolMock;
        console.log(poolMock)
        console.log(updatedPoolMock)
        updatedPoolMock.wallet.amount = adaToLace(4000)
        updatedPoolMock.queuePos = 5
        updatedPoolMock.epochs = [305, 306]
        console.log(`epochs granted = ${updatedPoolMock.epochsGranted} epochs = ${updatedPoolMock.ticker}` ) 
        koios.accountInfo = jest.fn().mockReturnValue({total_balance:0});
        const updatedPool = await updateAllowedEpochs(updatedPoolMock, 300);
        expect(updatedPool.epochsGranted).toBe(0);
    })
})