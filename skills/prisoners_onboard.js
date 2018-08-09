const _ = require("underscore");
const request = require("request");
const fs = require('fs');
const { WebClient } = require('@slack/client');
const token = process.env.slackToken;
const web = new WebClient(token);

module.exports = function(controller) {

  controller.prisoners_check = function(bot, id, cb) {
    controller.storage.teams.get(id, function(err, team) {

      console.log(" checking the team with url: ", team.url);

      var token = bot.config.token ? bot.config.token : bot.config.bot.token;
      var web = new WebClient(token);

      var prisoners = [];

      var data = [];

      _.each(team.users, function(u) {
        data.push([web, u.bot_chat]);
      });

      console.log(data, " is the data");

      var mapPromises = data.map(controller.findRecentMessages);
      var results = Promise.all(mapPromises);

      results.then(messages => {
        console.log(messages, " are the returned messages");

        _.each(messages, function(msg) {
          if (msg.attachments[0].title == "Prison")
            prisoners.push(msg.channel);
        });

        team.users = _.map(team.users, function(user) {
          if (prisoners.includes(user.bot_chat))
            user.prisoner = true;

          return user;
        });

        team.prisoner_players = _.where(team.users, { prisoner: true });

        controller.storage.teams.save(team, function(err, saved) {
          console.log(saved.users, " we checked, and we updated");
          cb(saved.users);
        });

      });

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
