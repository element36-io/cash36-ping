App = {
  web3Provider: null,
  contracts: {},
  pingFile: 'MyPing.json',
  //pingFile:'@element36-io/cash36-contracts/build/contracts/Ping.json',
  getAmount: () => { return  $("#amount")[0].value },
  getBeneficiary: function () {  return $("#beneficiary")[0].value },
  format: (value) => { return value * 1000000000000000000 },
  parse: (value) => { return value / 1000000000000000000 },

  init: async function () {
    console.log("initWeb3 0");
    await App.initWeb3();
    console.log("updateUserData");
    return await App.updateUserData();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      console.log(".. Metamask or similar provides web3 ")
      App.web3Provider = window.ethereum;
      try {
        // Request account access - opens MetaMask
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      console.warn(" ==> fallback, no web3 object. Taking provider from " + $("#providerUrl")[0].value)
      App.web3Provider = new Web3.providers.HttpProvider($("#providerUrl")[0].value);
    }
    return App.initContract();
  },

  initContract: function () {
    console.log("initContract")
    //pingFile:'MyPing.json',
    //pingFile:'@element36-io/cash36-contracts/build/contracts/Ping.json',
    $.getJSON(App.pingFile, function (data) {
      App.contracts.Ping = TruffleContract(data);
      App.contracts.Ping.setProvider(App.web3Provider);
      App.contracts.Ping.deployed().then(() =>
        console.log(" > App.contracts.Ping.address:" + App.contracts.Ping.address))
    });
    $.getJSON("@element36-io/cash36-contracts/build/contracts/CHF36.json", function (data) {
      App.contracts.chf36 = TruffleContract(data);
      App.contracts.chf36.setProvider(App.web3Provider);
      App.contracts.chf36.deployed().then(() =>
        console.log(" > App.contracts.chf36.address:" + App.contracts.chf36.address))
    });
    $.getJSON("@element36-io/cash36-contracts/build/contracts/Cash36Compliance.json", function (data) {
      App.contracts.compliance = TruffleContract(data);
      // Set the provider for our contract
      App.contracts.compliance.setProvider(App.web3Provider);
      App.contracts.compliance.deployed().then(() =>
        console.log(" > App.contracts.compliance.address:" + App.contracts.compliance.address))
    });

    console.log("initContract done")
    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-ping', App.handlePing2);
    $(document).on('click', '.btn-pong', App.handlePong);
    $(document).on('click', '.btn-refresh', App.updateUserData);
    $(document).on('click', '.btn-withdraw', App.handleWithdraw);
  },

 
  handlePing2: function () {
    App.handlePing()
  },

  handlePing: async function (event) {
    if (event) event.preventDefault();

    const pingInstance = await App.contracts.Ping.deployed();
    const chf36Instance = await App.contracts.chf36.deployed();

    let ping = await chf36Instance.approve(pingInstance.address, App.format(App.getAmount()), { from: App.account })
      .then(() => {
        return pingInstance.ping(App.getBeneficiary(), App.format(App.getAmount()), { from: App.account });
      })
    App.updateUserData()
  },

  handlePong: function (event) {
    console.log(".. click pong");
    event.preventDefault();
    let pingInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      App.contracts.Ping.deployed().then(function (instance) {
        pingInstance = instance;
        // Execute adopt as a transaction by sending account
        pingInstance.pong().then(function (r) {
          console.log("done: " + r), (error) => {
            console.log(error)
          }
        })
          .catch(function (err) {
            console.log(err.message);
          });
      }).then(function (result) {
        return App.updateUserData();
      }).catch(function (err) {
        alert("Error " + err.message)
        console.log(err.message);
      });
    });
  },
  handleWithdraw: async function (event) {
    event.preventDefault();
    const pingInstance = await App.contracts.Ping.deployed();
    await pingInstance.steal({ from: App.account })
    App.updateUserData()
  },
  updateUserData: async function () {

    $("#account")[0].innerHTML = "..."
    $("#balanceEth")[0].innerHTML = "..."
    $("#balance36")[0].innerHTML = "..."
    $("#beneficiaryBalance36")[0].innerHTML = "..."
    $("#contractBalance36")[0].innerHTML = "..."

    // MILOS... how can we call this after init? Could not figure out how 
    // to do this without a break in case of a pageload - my javascript is too rusty
    await new Promise(r => setTimeout(r, 2000));

    //get eth
    web3 = new Web3(App.web3Provider);
    App.account = web3.eth.accounts[0];
    $("#account")[0].innerHTML = App.account;

    web3.eth.getBalance(App.account, (err, balance) => {
      $("#balanceEth")[0].innerHTML = web3.fromWei(balance, "ether") + " ETH"
      if (err) $("#balanceEth")[0].innerHTML = err
    });

    $('#balance36')[0].innerHTML = JSON.stringify(await App.getUserStatus(App.account))

    $('#beneficiaryBalance36')[0].innerHTML = JSON.stringify(await App.getUserStatus(App.getBeneficiary()))
    
    const pingInstance = await App.contracts.Ping.deployed();
    const cBalanceChf36 = await chf36.balanceOf(pingInstance.address);
    const cBeneficiary = await pingInstance.beneficiary();
    $('#contractBalance36')[0].innerHTML = App.parse(cBalanceChf36) + " CHF36, beneficiary: " + cBeneficiary + ", contract: " + App.contracts.chf36.address;

  },

  getUserStatus: async function (address) {
    let result = {};
    result["address"] = address;
    chf36 = await App.contracts.chf36.deployed();
    result["balanceChf36"] = App.parse(await chf36.balanceOf(address));
    eur36 = await App.contracts.eur36.deployed();
    result["balanceEur36"] = App.parse(await eur36.balanceOf(address));
    compliance = await App.contracts.compliance.deployed();

    result["ATTR_BUY"] = await compliance.hasAttribute(address, "ATTR_BUY");

    result["ATTR_SEND"] = await compliance.hasAttribute(address, "ATTR_SEND");
    result["ATTR_RECEIVE"] = await compliance.hasAttribute(address, "ATTR_RECEIVE");
    result["ATTR_SELL"] = await compliance.hasAttribute(address, "ATTR_SELL");


    result["isOnBlacklist"] = await compliance.isOnBlacklist(address);
    result["isOnLockedAccounts"] = await compliance.isOnLockedAccounts(address);

    result["limgetUserLimitit"] = await compliance.getUserLimit(address);
    result["checkUserLimit"] = await compliance.checkUserLimit(address, App.format(App.getAmount()), result["balanceEur36"]);
    result["checkUser"] = await compliance.checkUser(address);
    console.log(" " + address + ": " + JSON.stringify(result));
    return result;
  }
}; //App
$(function () {
  $(window).load(function () {
    App.init();
  });
});
