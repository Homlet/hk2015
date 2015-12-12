var irc = require('irc');

var clients = [];

var addClient = function(nick, cb) {
  var client = new irc.Client(server, nick, chans);

  client.addListener('error', function(message) {
    console.log('error: ', message);
  });

  client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    //TODO: push to sms
  });

  clients.push(client);

  cb(clients.length - 1);
};
