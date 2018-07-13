const _ = require("underscore");
const request = require("request");
const fs = require('fs');
const { WebClient } = require('@slack/client');
const token = process.env.slackToken;
const web = new WebClient(token);

module.exports = function(controller) {


  controller.on("prisoners_onboard", function(bot, id) {

    controller.storage.teams.get(id, function(err, team) {

      if (team.prisoner_started) return;

      var web = new WebClient(team.bot.app_token);

      team.prisoner_players = _.where(team.users, { prisoner: true });
      team.prisoner_started = true;
      team.prisoner_complete = false;

      team.prisoner_success = 0;
      team.prisoner_decisions = {};

      _.each(team.prisoner_players, function(p) {
        team.prisoner_decisions[p.userId] = {
          name: p.name,
          choice: undefined
        };
      });

      controller.storage.teams.save(team, function(err, saved) {

        console.log(err, saved);
        if (team.prisoner_players.length >= 3)
          controller.prisoners_message(bot, saved.id, "default");
        else
          controller.prisoners_message(bot, saved.id, "too_few_players")

      });

    });

  });


}
