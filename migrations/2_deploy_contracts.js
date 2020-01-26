let MyPing = artifacts.require('MyPing')
let contract = require("@truffle/contract");
let CHF36 = require("@element36-io/cash36-contracts/build/contracts/CHF36.json");
let chf36Json =  contract(CHF36);  // makes the CHF36 Json accessible as truffle contract


module.exports = async (deployer, network, accounts) => {
  chf36Json.setProvider(web3.currentProvider)
  let chf36 = await chf36Json.deployed();
  await deployer.deploy(MyPing, chf36.address )
  await MyPing.deployed()
}
