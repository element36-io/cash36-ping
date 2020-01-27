/**
 * Contains all Test specific for CHF36
 * see https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
const {BN, constants, expectEvent, expectRevert} = require('@openzeppelin/test-helpers')
const TruffleContract = require('@truffle/contract')
const Ping = artifacts.require('./MyPing.sol')


function format (value) {
  //return value;
  return value * 10e18
}

function parse (value) {
  //return value;
  return value / 10e18
}

async function newInstanceFromJson(jsonFile) {
  //console.log(" reading "+jsonFile)
  let  data = require(jsonFile)
  let contract = TruffleContract(data);
  contract.setProvider(web3.eth.currentProvider);
  return contract.deployed();
}
contract('Create and Test Token36', function (accounts) {

  var Cash36Instance
  var Cash36ComplianceInstance
  var CHF36ControllerInstance
  var exchangeAddress
  
  var pingInstance

  before('...Setup Cash36Instance and Ping', async function () {
    console.log("bind contracts")
    pingInstance = await Ping.deployed()
    Cash36Instance  = await newInstanceFromJson("@element36-io/cash36-contracts/build/contracts/Cash36.json")
    CHF36Instance = await newInstanceFromJson("@element36-io/cash36-contracts/build/contracts/CHF36.json")
    Cash36ComplianceInstance = await newInstanceFromJson("@element36-io/cash36-contracts/build/contracts/Cash36Compliance.json")
    Cash36ExchangeInstance = await newInstanceFromJson("@element36-io/cash36-contracts/build/contracts/Cash36Exchanges.json")
    exchangeAddress=Cash36ExchangeInstance.address
    CHF36ControllerInstance = await newInstanceFromJson("@element36-io/cash36-contracts/build/contracts/CHF36Controller.json")
    console.log("bind contracts done")
    console.log("bind contracts done "+Cash36Instance+","+CHF36Instance+","+Cash36ComplianceInstance+","+CHF36ControllerInstance+","+exchangeAddress)
  })


  

  it('...it should add accounts[1] as user we initial rights.', async function () {
    await Cash36ComplianceInstance.addUser(accounts[1], {from: accounts[0]})
    await Cash36ComplianceInstance.setAttribute(accounts[1], web3.utils.fromAscii("ATTR_SELL"), 1, {from: accounts[0]})
    await Cash36ComplianceInstance.setAttribute(accounts[1], web3.utils.fromAscii("ATTR_SEND"), 1, {from: accounts[0]})
    await Cash36ComplianceInstance.setAttribute(accounts[1], web3.utils.fromAscii("ATTR_RECEIVE"), 1, {from: accounts[0]})

    var checkUser1 = await Cash36ComplianceInstance.checkUser(accounts[1], {from: accounts[0]})
    assert.equal(checkUser1, true, 'The checkUser1 was not correct.')

    var checkUser1Attr = await Cash36ComplianceInstance.hasAttribute(accounts[1], web3.utils.fromAscii('ATTR_SELL'), {from: accounts[0]})
    assert.equal(checkUser1Attr, true, 'The checkUser1Attr was not correct.')
  })

  it('...it should add accounts[2] as user we initial rights.', async function () {
    await Cash36ComplianceInstance.addUser(accounts[2], {from: accounts[0]})
    await Cash36ComplianceInstance.setAttribute(accounts[2], web3.utils.fromAscii("ATTR_SELL"), 1, {from: accounts[0]})
    await Cash36ComplianceInstance.setAttribute(accounts[2], web3.utils.fromAscii("ATTR_SEND"), 1, {from: accounts[0]})
    await Cash36ComplianceInstance.setAttribute(accounts[2], web3.utils.fromAscii("ATTR_RECEIVE"), 1, {from: accounts[0]})

    var checkUser1 = await Cash36ComplianceInstance.checkUser(accounts[2], {from: accounts[0]})
    assert.equal(checkUser1, true, 'The checkUser1 was not correct.')

    var checkUser1Attr = await Cash36ComplianceInstance.hasAttribute(accounts[2], web3.utils.fromAscii('ATTR_SELL'), {from: accounts[0]})
    assert.equal(checkUser1Attr, true, 'The checkUser1Attr was not correct.')
    await testBalance(0,0,0,0)
  })


  it('...it should mint 200 CHF36 and assign it to accounts[1].', async function () {
    await CHF36ControllerInstance.mint(accounts[1], 20, {from: exchangeAddress})
    await testBalance(20,0,0,20)
  })

  it('...it should send 2x25 chf from accounts[1] and exchange to Ping.', async function () {
    await CHF36Instance.transfer(accounts[2], 2, {from: accounts[1]})
    await CHF36Instance.transfer(pingInstance.address, 2, {from: accounts[1]})
    await testBalance(16,2,2,20)
    await CHF36ControllerInstance.mint(pingInstance.address, 10, {from: exchangeAddress})
    await testBalance(16,2,12,30)
  })

  it ("...it should steal funds from ping contract", async function () {
    // can not be stolen by account 3, bause it is not KYC-ed
    await expectRevert.unspecified(pingInstance.steal({from: accounts[3]}))

    // can be stolen by account 2
    await pingInstance.steal({from: accounts[1]})
    await testBalance(28,2,0,30)
  })

  it ("...it should give more funds to ping - requires approval; and get it back with pong ", async function () {
    
    await CHF36Instance.approve(pingInstance.address, 2,{from: accounts[1]})
    //             1:28 2:2 ping:0   total:30
    await pingInstance.ping(accounts[2], 2,{from: accounts[1]})
    //2:a1-->ping  1:26 2:2 ping:2 total:30
    await testBalance(26,2,2,30)

    var bene=await pingInstance.beneficiary();
    assert.equal(bene,accounts[2])
    
    await pingInstance.pong({from: accounts[2]})
    //2:ping-->a2  a1:26 a2:4 ping:0 total:30
 
    bene=await pingInstance.beneficiary();
    assert.equal(bene,0)
   
    await testBalance(26,4,0,30)
  })

  it ("...it should do a wallet-free ping transaction ", async function () {
    // in case of payment, mint comes from the exchange
    // ping
    var txData=await CHF36ControllerInstance.mint(pingInstance.address, 7, {from: exchangeAddress})
    await testBalance(26,4,7,37) 
    //pong - transaciton hash of minting will be taken as a clue to idetify receipient of SEPA transaction
    var tx=await pingInstance.pongWalletFree(txData.tx,5,{from:exchangeAddress});
    await testBalance(26,4,2,32);
   
  })

  async function testBalance( a1,  a2, ping, total) {
    console.log("      > test balances - ping:"+ping+" a1:"+a1+" a2:"+a2+" total:"+total)
    if ( (ping+a1+a2)!=total )  throw "wrong total in params"

    var b = await CHF36Instance.balanceOf(accounts[1])
    assert.equal(b, a1, 'The balance a1 was not correct.')
    b = await CHF36Instance.balanceOf(accounts[2])
    assert.equal(b, a2, 'The balance a2 was not correct.')
    b = await CHF36Instance.balanceOf(pingInstance.address)
    assert.equal(b, ping, 'The balance ping was not correct.')

    b = await CHF36Instance.totalSupply()
    assert.equal(b, total, 'The totalSupply was not correct.')
  }
})