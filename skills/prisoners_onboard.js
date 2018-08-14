const _ = require("underscore");
const request = require("request");
const fs = require('fs');
const { WebClient } = require('@slack/client');
const token = process.env.slackToken;
const web = new WebClient(token);

module.exports = function(controller) {

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
