var irc = require('irc');
var messagebird = require('messagebird')('live_keyzEIfbtolazqcT4DOeHbyY7');
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

var originator = '+447860039362';

var clients = [];

var init = function() {
  User.find({}, function(err, users) {
    users.forEach(function(user) {
      addClient(user.server, user.nick, [user.channel], user.number, function(id) {
        user.clientId = id;
        user.save();
      });
    });
  });
}

var addClient = function(server, nick, chans, number, cb) {
  var client = new irc.Client(server, nick, {
    channels: chans
  });

  client.addListener('error', function(message) {
    console.log('error: ', message);
  });

  client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    if(from != nick) {
      var params = {
        'originator': originator,
        'recipients': [
          number
        ],
        'body': from + ': ' + message
      };

      messagebird.messages.create(params, function (err, response) {
        if (err) {
          return console.log(err);
        }
        console.log(response);
      });
    }
  });

  clients.push(client);

  cb(clients.length - 1);
};

app.get('/recieve', function(req, res) {
  console.log(clients.length);
  User.findOne({ number: req.query.originator }, function(err, user) {
    if(user) {
      //check for commands
      if(req.query.message.search(/^\/\w+/) == 0) {
        commands = ['/server', '/channel', '/nick', '/help'];
        matchedCommand = req.query.message.match(/^\/\w+/)[0];
        commands.forEach(function(command) {
          if(command == matchedCommand) {
            if(matchedCommand == '/help') {
              var params = {
                'originator': originator,
                'recipients': [
                  req.query.originator
                ],
                'body': "Commands availible: \n /server [server name] \n /channel [channel name] \n /nick [desired nickname] \n Please note that you can only be connected to one server and channel at a time."
              };
              messagebird.messages.create(params, function (err, response) {
                if (err) {
                  return console.log(err);
                }
                console.log(response);
              });
            } else {
              matchedOption = req.query.message.match(/\s.+/);
              if(matchedOption == null) {
                //send welcome message
                var params = {
                  'originator': originator,
                  'recipients': [
                    req.query.originator
                  ],
                  'body': "Command syntax: " + matchedCommand + " [" + matchedCommand + " name]"
                };
                messagebird.messages.create(params, function (err, response) {
                  if (err) {
                    return console.log(err);
                  }
                  console.log(response);
                });
              } else {
                matchedOption = matchedOption[0].trim();
                //get rid of leading / on matched command
                matchedCommand = matchedCommand.substr(1, matchedCommand.length);
                user[matchedCommand] = matchedOption;
                user.save();
                clients[user.clientId].send('NICK', user.nick);
                console.log(user);
              }
            }
          }
        });
      } else {
        //message not a command - so send it to IRC!
        console.log(user.clientId);
        console.log(clients.length);
        clients[user.clientId].say(user.channel, req.query.message);
      }
      res.sendStatus(200);
    } else {
      //create new client and user
      addClient('chat.freenode.net', ('HackKings' + clients.length), ['#hackkings'], req.query.originator, function(id) {
        var user = new User({
          number: req.query.originator,
          server: 'chat.freenode.net',
          nick: 'HackKings' + id,
          channel: '#hackkings',
          clientId: id
        });
        user.save(function(err) {
          res.sendStatus(200);
        });
        //send welcome message
        var params = {
          'originator': originator,
          'recipients': [
            req.query.originator
          ],
          'body': "Welcome to Zircon! By default, you've been connected to chat.freenode.net #hackkngs and your nickname is " + user.nick + ". Use /nick to change your nickname and reply /help for for info."
        };
        messagebird.messages.create(params, function (err, response) {
          if (err) {
            return console.log(err);
          }
          console.log(response);
        });
      });
    }
  });
});

init();

app.listen(8000);
