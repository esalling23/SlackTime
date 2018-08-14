const _ = require("underscore");
const request = require("request");
const fs = require('fs');
const { WebClient } = require('@slack/client');
const token = process.env.slackToken;
const web = new WebClient(token);

module.exports = function(controller) {

  controller.prisoners_check = function(bot, id, title, allUsers, cb) {
    controller.storage.teams.get(id, function(err, team) {

      console.log(" checking the team with url: ", team.url);

      var token = bot.config.token ? bot.config.token : bot.config.bot.token;
      var web = new WebClient(token);

      var prisoners = [];

      var data = [];

      _.each(team.users, function(u) {
        data.push([web, u.bot_chat]);
      });

      // console.log(data, " is the data");

      var mapPromises = data.map(controller.findRecentMessages);
      var results = Promise.all(mapPromises);

      results.then(newData => {
        console.log(newData, " are the returned messages");

        _.each(newData, function(data) {
          if (data.msg.attachments[0].title == title)
            prisoners.push(data.channel);
        });

        team.users = _.map(team.users, function(user) {
          if (prisoners.includes(user.bot_chat))
            user.prisoner = true;

          return user;
        });

        let leftOut = _.filter(team.users, function(user) {
          return prisoners.includes(user.bot_chat);
        });

        console.log(team.users, " we checked, and we updated");
        if (allUsers)
          cb(team.users);
        else
          cb(leftOut);

      });

    });
  }


  controller.prisoners_leftout = function(users) {

    _.each(users, function(user) {
      controller.findRecentMessages.then(res => {
        res.msg.channel = user.bot_chat;
        res.msg.user = user.userId;

        controller.makeCard(bot, event, "prisoners_dilemma", "default", vars, function(card) {

          bot.api.chat.update({
            channel: event.channel,
            ts: event.original_message.ts,
            attachments: card.attachments
          }, function(err, updated) {
            console.log('this user was leftout so we sent them ',  updated);
          });

        });

      }).catch(err => console.log('error in find recent messages', err));
    });

  }
}
