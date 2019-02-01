const _ = require("underscore");
// const gm = require("gm");
const http = require('http');
const fs = require('fs');
const request = require('request');
const { WebClient } = require('@slack/client');

const acceptedTypes = ['jpg', 'jpeg', 'png'];

module.exports = function(controller) {

  const deleteThisMsg = function(message, token, callback) {

    // console.log(message, "we are deleting this");

    var ts = message.message_ts ? message.message_ts : message.ts;

    var web = new WebClient(token);

    web.chat.delete(ts, message.channel).then(res => {
      // console.log(res, "deleted");
      callback();
    }).catch(err => console.log(err));
  }

    controller.middleware.receive.use(function(bot, message, next) {

      // console.log('RCVD:', message);

      next();

    });


    controller.middleware.send.use(function(bot, message, next) {

      // console.log('SEND:', message);

      // If this message has a movement count
      // Update team's movements
      // Update gamelog
      // Trigger phase-specific logic
      if (message.movement) {

        controller.storage.teams.get(bot.config.id, function(err, team) {

          if (!team.movements) team.movements = [];
          var movement = parseInt(message.movement);

          if (team.movements.includes(movement)) return;

          team.movements.push(movement);

          controller.storage.teams.save(team, function(err, saved) {

            // console.log(saved, '-- Team Movement Updated --', 'middleware send line 56')

          });
        });

      }

      next();

    });

}
