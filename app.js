var irc = require('irc');
var messagebird = require('messagebird')('live_c824ASBElBQE46yxKwzeK3e4a');
var express = require('express');
var app = express();
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/zircon');

var User = mongoose.model('User', {
  number: String,
  channel: String,
  server: String,
  nick: String,
  clientId: Number
});

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

app.get('/recieve', function(req, res) {
  User.findOne({ number: req.query.originator }, function(err, user) {
    if(user) {
      clients[user.clientId].say(user.channel, req.query.message);
      res.sendStatus(200);
    } else {
      //create new client and user
      addClient('chat.freenode.net', req.query.originator, ['#hackkings'], function(id) {
        res.sendStatus(200);
      });
    }
  });
});

app.listen(8000);
