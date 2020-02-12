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
  getBaseUrl: function() {
    return 'http://localhost:8089';
  },

  init: async function() {
    console.log('init kyc');
  },
  revealData: async function(username, password) {
    var headers = new Headers({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic Y2FzaDM2LWNsaWVudDpjYXNoMzYtc2VjcmV0'
    });

    try {
      // check if user exists
      const response = await fetch(`http://localhost:8090/auth/oauth/token`, {
        method: 'POST',
        body: {
          data: `username=${username}&password=${password}&grant_type=password`
        },
        headers
      });

      console.log(response);
      // if it doesn't, return error

      // if it exists, log the user in and return the token

      // use the token to reveal data calling /reveal/{clue}
    } catch (err) {
      console.log(err);
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
