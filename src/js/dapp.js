App = {
  web3Provider: null,
  contracts: {},
  // pingFile: 'MyPing.json',
  pingFile: '@element36-io/cash36-contracts/build/contracts/Ping.json',
  getAmount: () => {
    return $('#amount')[0].value;
  },
  getBeneficiary: function() {
    return $('#beneficiary')[0].value;
  },
  format: value => {
    return value * 1000000000000000000;
  },
  parse: value => {
    return value / 1000000000000000000;
  },

  init: async function() {
    console.log('initWeb3 0');
    await App.initWeb3();
    console.log('updateUserData');
    return await App.updateUserData();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      console.log('.. Metamask or similar provides web3 ');

      App.web3Provider = window.ethereum;
      try {
        // Request account access - opens MetaMask
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error('User denied account access');
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      console.warn(
        ' ==> fallback, no web3 object. Taking provider from ' +
          $('#providerUrl')[0].value
      );
      App.web3Provider = new Web3.providers.HttpProvider(
        $('#providerUrl')[0].value
      );
    }
    return App.initContract();
  },

  initContract: function() {
    console.log('initContract');
    //pingFile:'MyPing.json',
    //pingFile:'@element36-io/cash36-contracts/build/contracts/Ping.json',
    $.getJSON(App.pingFile, function(data) {
      App.contracts.Ping = TruffleContract(data);
      App.contracts.Ping.setProvider(App.web3Provider);
      App.contracts.Ping.deployed().then(() =>
        console.log(
          ' > App.contracts.Ping.address:' + App.contracts.Ping.address
        )
      );
    });
    $.getJSON(
      '@element36-io/cash36-contracts/build/contracts/CHF36.json',
      function(data) {
        App.contracts.chf36 = TruffleContract(data);
        App.contracts.chf36.setProvider(App.web3Provider);
        App.contracts.chf36
          .deployed()
          .then(() =>
            console.log(
              ' > App.contracts.chf36.address:' + App.contracts.chf36.address
            )
          );
      }
    );
    $.getJSON(
      '@element36-io/cash36-contracts/build/contracts/EUR36.json',
      function(data) {
        App.contracts.eur36 = TruffleContract(data);
        // Set the provider for our contract
        App.contracts.eur36.setProvider(App.web3Provider);
        App.contracts.eur36
          .deployed()
          .then(() =>
            console.log(
              ' > App.contracts.eur36.address:' + App.contracts.eur36.address
            )
          );
      }
    );
    $.getJSON(
      '@element36-io/cash36-contracts/build/contracts/Cash36Compliance.json',
      function(data) {
        App.contracts.compliance = TruffleContract(data);
        // Set the provider for our contract
        App.contracts.compliance.setProvider(App.web3Provider);
        App.contracts.compliance
          .deployed()
          .then(() =>
            console.log(
              ' > App.contracts.compliance.address:' +
                App.contracts.compliance.address
            )
          );
      }
    );

    console.log('initContract done');
    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-ping', App.handlePing2);
    $(document).on('click', '.btn-pong', App.handlePong);
    $(document).on('click', '.btn-refresh', App.updateUserData);
    $(document).on('click', '.btn-withdraw', App.handleWithdraw);
  },

  handlePing2: function() {
    App.handlePing();
  },

  handlePing: async function(event) {
    if (event) event.preventDefault();

    const pingInstance = await App.contracts.Ping.deployed();
    const chf36Instance = await App.contracts.chf36.deployed();

    let ping = await chf36Instance
      .approve(pingInstance.address, App.format(App.getAmount()), {
        from: App.account
      })
      .then(() => {
        return pingInstance.ping(
          App.getBeneficiary(),
          App.format(App.getAmount()),
          { from: App.account }
        );
      });
    App.updateUserData();
  },

  handlePong: function(event) {
    console.log('.. click pong');
    event.preventDefault();
    let pingInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      App.contracts.Ping.deployed()
        .then(function(instance) {
          pingInstance = instance;
          // Execute adopt as a transaction by sending account
          pingInstance
            .pong()
            .then(function(r) {
              console.log('done: ' + r),
                error => {
                  console.log(error);
                };
            })
            .catch(function(err) {
              console.log(err.message);
            });
        })
        .then(function(result) {
          return App.updateUserData();
        })
        .catch(function(err) {
          alert('Error ' + err.message);
          console.log(err.message);
        });
    });
  },
  handleWithdraw: async function(event) {
    event.preventDefault();
    const pingInstance = await App.contracts.Ping.deployed();
    await pingInstance.steal({ from: App.account });
    App.updateUserData();
  },
  updateUserData: async function() {
    $('#account')[0].innerHTML = '...';
    $('#balanceEth')[0].innerHTML = '...';
    $('#chf36balance')[0].innerHTML = '...';
    $('#senderKycd')[0].innerHTML = '...';
    $('#allowedSend')[0].innerHTML = '...';
    $('#beneficiaryKycd')[0].innerHTML = '...';
    $('#allowedReceive')[0].innerHTML = '...';
    $('#allowedBuy')[0].innerHTML = '...';
    $('#chf36balance__contract')[0].innerHTML = '...';
    $('#chf36__contractAddress')[0].innerHTML = '...';

    // MILOS... how can we call this after init? Could not figure out how

    // to do this without a break in case of a pageload - my javascript is too rusty
    await new Promise(r => setTimeout(r, 2000));

    //get eth
    web3 = new Web3(App.web3Provider);
    App.account = web3.eth.accounts[0];

    $('#account')[0].innerHTML = App.account;

    web3.eth.getBalance(App.account, (err, balance) => {
      $('#balanceEth')[0].innerHTML = web3.fromWei(balance, 'ether') + ' ETH';
      if (err) $('#balanceEth')[0].innerHTML = err;
    });

    // get user status, peel of what you need from there (balance, contract, status, limits)
    const userStatus = await App.getUserStatus(App.account);

    if (userStatus.checkUser) {
      $('#senderKycd')[0].innerHTML = 'Yes';
    } else {
      $('#senderKycd')[0].innerHTML = 'No';
    }

    if (userStatus.ATTR_SEND) {
      $('#allowedSend')[0].innerHTML = 'Yes';
    } else {
      $('#allowedSend')[0].innerHTML = 'No';
    }

    $('#chf36balance')[0].innerHTML = userStatus.balanceChf36;

    const beneficiaryStatus = await App.getUserStatus(App.getBeneficiary());

    if (beneficiaryStatus.checkUser) {
      $('#beneficiaryKycd')[0].innerHTML = 'Yes';
    } else {
      $('#beneficiaryKycd')[0].innerHTML = 'No';
    }

    if (beneficiaryStatus.ATTR_RECEIVE) {
      $('#allowedReceive')[0].innerHTML = 'Yes';
    } else {
      $('#allowedReceive')[0].innerHTML = 'No';
    }

    if (beneficiaryStatus.ATTR_BUY) {
      $('#allowedBuy')[0].innerHTML = 'Yes';
    } else {
      $('#allowedBuy')[0].innerHTML = 'No';
    }

    const pingInstance = await App.contracts.Ping.deployed();
    $('#targetContract')[0].defaultValue = pingInstance.address;
    const cBalanceChf36 = await chf36.balanceOf(pingInstance.address);
    const cBeneficiary = await pingInstance.beneficiary();
    $('#chf36balance__contract')[0].innerHTML = App.parse(cBalanceChf36);
    $('#chf36__contractAddress')[0].innerHTML = App.contracts.chf36.address;

    $('#btn-reveal').on('click', async () => {
      // `Message for Walter` Enter your credentials here
      const username = Kyc.getAPIUserId();
      const password = Kyc.getAPIPassword();
      const clue = Kyc.getClue();

      const data = await Kyc.revealData(username, password, clue);

      if (data.error) {
        $('#reveal')[0].innerHTML = `<div>&#9888; ${data.error}</div>`;
        return;
      }

      $('#reveal')[0].innerHTML = `
      <div class="reveal__data">
        <div class="smart-contracts__field__label">Username</div>
        <div
          class="smart-contracts__field__value"
        >
          ${data.username}
        </div>
      </div>
      <div class="reveal__data">
      <div class="smart-contracts__field__label">Name</div>
      <div
        class="smart-contracts__field__value"
      >
        ${data.firstName} ${data.lastName}
      </div>
    </div>
      `;
    });

    $('#btn-walletfree').on('click', async () => {
      const username = Kyc.getWalletfreeUserId();
      const password = Kyc.getWalletfreePassword();
      const amount = Kyc.getWalletfreeAmount();
      const targetAddress = Kyc.getTargetContract();
      const symbol = 'CHF36';
      const targetAddressType = 'CONTRACT';

      const walletfreeData = {
        amount,
        symbol,
        targetAddressType,
        targetAddress
      };

      const data = await Kyc.walletfreePing(username, password, walletfreeData);

      if (data.error) {
        $(
          '#walletfree-ping-response'
        )[0].innerHTML = `<div>&#9888; ${data.error}</div>`;
        return;
      }

      console.log(data);

      $('#walletfree-ping-response')[0].innerHTML = Object.keys(data)
        .map(key => {
          return `<div class="walletfree__data">
              <div class="smart-contracts__field__label">${key}</div>
              <div class="smart-contracts__field__value">${data[key]}</div>
            </div>`;
        })
        .join(' ');
    });
  },

  getUserStatus: async function(address) {
    let result = {};
    result['address'] = address;
    chf36 = await App.contracts.chf36.deployed();
    result['balanceChf36'] = App.parse(await chf36.balanceOf(address));
    eur36 = await App.contracts.eur36.deployed();
    result['balanceEur36'] = App.parse(await eur36.balanceOf(address));
    compliance = await App.contracts.compliance.deployed();

    result['ATTR_BUY'] = await compliance.hasAttribute(address, 'ATTR_BUY');

    result['ATTR_SEND'] = await compliance.hasAttribute(address, 'ATTR_SEND');
    result['ATTR_RECEIVE'] = await compliance.hasAttribute(
      address,
      'ATTR_RECEIVE'
    );
    result['ATTR_SELL'] = await compliance.hasAttribute(address, 'ATTR_SELL');

    result['isOnBlacklist'] = await compliance.isOnBlacklist(address);
    result['isOnLockedAccounts'] = await compliance.isOnLockedAccounts(address);

    result['limgetUserLimitit'] = await compliance.getUserLimit(address);
    result['checkUserLimit'] = await compliance.checkUserLimit(
      address,
      App.format(App.getAmount()),
      result['balanceEur36']
    );
    result['checkUser'] = await compliance.checkUser(address);
    console.log(' ' + address + ': ' + JSON.stringify(result));
    return result;
  }
}; //App
$(function() {
  $(window).load(function() {
    App.init();
  });
});
