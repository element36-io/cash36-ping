Kyc = {
  getAPIUserId: () => {
    return $('#APIId')[0].value;
  },
  getAPIPassword: function() {
    return $('#APIPwd')[0].value;
  },
  getClue: function() {
    return $('#clue')[0].value;
  },
  getWalletfreeUserId: function() {
    return $('#WalletfreeId')[0].value;
  },
  getWalletfreePassword: function() {
    return $('#WalletfreePwd')[0].value;
  },
  getWalletfreeAmount: function() {
    return $('#WalletfreeAmount')[0].value;
  },
  getBaseUrl: function() {
    return 'http://localhost:8089';
  },
  init: async function() {
    console.log('init kyc');
  },
  revealData: async function(username, password, clue) {
    // check if user exists
    let accessToken;

    try {
      const config = {
        body: `username=${username}&password=${password}&grant_type=password`,
        headers: {
          Authorization: 'Basic Y2FzaDM2LWNsaWVudDpjYXNoMzYtc2VjcmV0',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      const response = await fetch(
        `http://localhost:8090/cash36/auth/oauth/token`,
        {
          method: 'POST',
          body: config.body,
          headers: config.headers
        }
      );
      const data = await response.json();
      accessToken = data.access_token;
    } catch (err) {
      console.error(err);
    }

    if (!accessToken)
      return {
        error: 'You have no access rights to this resource'
      };

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      };

      const response = await fetch(
        `http://localhost:8090/cash36/compliance/kyc/reveal/${clue}`,
        {
          method: 'GET',
          headers: config.headers
        }
      );

      const data = await response.json();
      return data;
    } catch (err) {
      return {
        error: err.error
      };
    }
  },
  walletfreePing: async function(username, password, walletfreeData) {
    // check if user exists
    let accessToken;

    try {
      const config = {
        body: `username=${username}&password=${password}&grant_type=password`,
        headers: {
          Authorization: 'Basic Y2FzaDM2LWNsaWVudDpjYXNoMzYtc2VjcmV0',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      const response = await fetch(
        `http://localhost:8090/cash36/auth/oauth/token`,
        {
          method: 'POST',
          body: config.body,
          headers: config.headers
        }
      );
      const data = await response.json();
      accessToken = data.access_token;
    } catch (err) {
      console.error(err);
    }

    if (!accessToken)
      return {
        error: 'You have no access rights to this resource'
      };

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await fetch(
        'http://localhost:8090/cash36/exchange/buy/for/',
        {
          method: 'POST',
          body: JSON.stringify(walletfreeData),
          headers: config.headers
        }
      );

      const data = await response.json();
      return data;
    } catch (err) {
      return {
        error: err.error
      };
    }
  }

  // Kyc Controller

  // GET
  // /compliance/kyc/reveal/{clue}
  // Reveal Kyc data data of a transaction - only the receiver might do this and the receiving wallet must be registered in the kycnetwork with the calling user

  // POST
  // /kyc/send-notification/{toUserEmail}
  // Send a notification to a user into the notification tray - message lenght has maximum of 144 chars
}; //Kyc
$(function() {
  $(window).load(function() {
    Kyc.init();
  });
});
