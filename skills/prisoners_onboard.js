const _ = require("underscore");
const request = require("request");
const fs = require('fs');
const { WebClient } = require('@slack/client');
const token = process.env.slackToken;
const web = new WebClient(token);

module.exports = function(controller) {

  controller.prisoners_check = function(bot, id, cb) {
    controller.storage.teams.get(id, function(err, team) {

      var prisoners = [];

      _.each(team.users, function(user) {

        console.log(user);

        // Find user chat history with bot
        web.conversations.history(user.bot_chat).then(function(ims) {

          var message = ims.messages[0];

          if (!message)
            return;

          console.log(message, " this might be a prisoner message?");

          if (message.attachments[0].title == "Prison") {
            prisoners.push(user.userId);
          }

        }).catch(err => console.log("prisoner check convo history error", err));
      });

      // wait...and save
      setTimeout(function() {
        team.users = _.map(team.users, function(user) {
          if (prisoners.includes(user.userId))
            user.prisoner = true;

          return user;
        });

        controller.storage.teams.save(team, function(err, saved) {
          console.log(saved.users, " we checked, and we updated");
          cb(saved.users);
        });

      }, 10000)
    });
  }

  controller.on("prisoners_onboard", function(bot, id) {

    controller.storage.teams.get(id, function(err, team) {

      // if (team.prisoner_started) return;

      var web = new WebClient(team.bot.app_token);

      // Determine prisoner players and set initial variables
      team.prisoner_players = _.where(team.users, { prisoner: true });
      team.prisoner_complete = false;
      team.prisoner_success = 0;
      // Set base prisoner_decisions object
      team.prisoner_decisions = {};

      _.each(team.prisoner_players, function(p) {
        team.prisoner_decisions[p.userId] = {
          name: p.name,
          choice: undefined
        };
      });

      controller.storage.teams.save(team, function(err, saved) {
        console.log(saved.prisoner_players.length , " are the # of prisoners");
        console.log(saved.prisoner_players.length >= process.env.prisoners_players);

        // If we have enough players
        if (saved.prisoner_players.length >= process.env.prisoners_players) {
          console.log("thats enough ppl, let's reset the timer");
          // If there are enough players, remove the clock
          controller.prisoners_time(bot, saved.id, true);
        } else {
            console.log("thats not enough ppl");
          // If there are too few players, reset the clock
          controller.prisoners_time(bot, saved.id, false);

        }

      });

    });

  });


}
