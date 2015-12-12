var irc = require('irc');
var messagebird = require('messagebird')('live_c824ASBElBQE46yxKwzeK3e4a');

var clients = [];

var addClient = function(server, nick, chans, cb) {
  var client = new irc.Client(server, nick, {
    channels: chans
  });

  client.addListener('error', function(message) {
    console.log('error: ', message);
  });

  client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    var params = {
      'originator': 'Hackkings',
      'recipients': [
        '+4407895331096'
      ],
      'body': from + ': ' + message
    };

    messagebird.messages.create(params, function (err, response) {
      if (err) {
        return console.log(err);
      }
      console.log(response);
    });
  });

  clients.push(client);

  cb(clients.length - 1);
};

addClient('chat.freenode.net', 'hack156672', ['#hackkings'], function(id) {

});
