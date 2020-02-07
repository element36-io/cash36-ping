Kyc = {
  getAPIUserId: () => {
    return $('#APIId')[0].value;
  },
  getAPIPassword: function() {
    return $('#APIPwd')[0].value;
  },
  getClue: function() {
    return 'abc';
  },
  getBaseUrl: function() {
    return 'http://localhost:8089';
  },

  init: async function() {
    console.log('init kyc');
  },

  login: async function() {}
  // kyc-controller
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
