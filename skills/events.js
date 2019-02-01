const _ = require('underscore');
const request = require('request');

var dataChannel;

const { WebClient } = require('@slack/client');

// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.slackToken;

const web = new WebClient(token);

module.exports = function(controller) {

  controller.on("count_colors", function (bot, event, team) {

    var users = _.filter(team.users, function(user) {
      return !controller.ignoreEmails.includes(user.email)
    });

    var length = (users.length * 6) / 3;
    var ready = false;

    var redCount = 0;
    var greyCount = 0;
    var greenCount = 0;

    _.each(users, function(user) {

      console.log(user.startBtns, redCount);

      if (!user.startBtns || user.startBtns.length < 3) return;

      _.each(user.startBtns, function(btn) {

        if (btn == "danger") {
          redCount++;
        } else if (btn == "primary") {
          greenCount++;
        } else {
          greyCount++;
        }
        console.log("RedCount:" + redCount);
      });

    });

    if(redCount < length && greenCount < length && greyCount < length) return;

    team.entered = true;
    // If any of the button counts are >= to the given length
    // Set the game to be started
    controller.storage.teams.save(team, function(err, saved) {
      var web = new WebClient(bot.config.bot.token);

      web.conversations.list({ types: "im" }).then(function(list) {
        _.each(team.users, function(user) {

          var thisIM = _.findWhere(list.channels, { user: user.userId });
          var channel = thisIM.id;

          web.conversations.history(channel).then(function(ims) {

            var btn_message = ims.messages[0];

            if (!btn_message || !btn_message.attachments) return;
            if (btn_message.attachments[0].callback_id != "three_color_buttons") return;

            btn_message.channel = channel;
            btn_message.user = user.userId;

            controller.makeCard(bot, btn_message, "input_nodes_1", "default", {}, function(card) {
              bot.api.chat.update({
                channel: btn_message.channel,
                ts: btn_message.ts,
                attachments: card.attachments
              }, function(err, updated) {
              });
            });

          }).catch(err => console.log("conversation history error: ", err));

        });

      }).catch(err => console.log("im list error: ", err));
    });

  });

  var downloadPhase = function(file) {

    console.log(file);

    var thisPhase;
    var count = 0;


    const phases = {
      phase_1: ["Stars.png", "directions.png", "CypherWheel.png"],
      phase_4: ["tangramsZipped.zip", "Guide.png"]
    }

    _.each(phases, function(files, phase) {
      console.log(files, phase);
      if (files.includes(file)) {
        console.log("the phase, ", phase);
        thisPhase = phase;
      }
      count++;

    });

    if (count == Object.keys(phases).length) {
      console.log("we should return the phase, ", thisPhase);

      return thisPhase;
    }
  }

}
