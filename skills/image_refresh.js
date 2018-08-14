const _ = require("underscore");
const request = require("request");
const fs = require('fs');
const { WebClient } = require('@slack/client');

const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.cloudinary_cloud_name,
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret
});


module.exports = function(controller, cb) {

  controller.imageRemove = function(bot, message, channel, team, cb) {

    var web = new WebClient(team.bot.app_token);
    var count = 0;

    web.groups.history(channel).then(res => {
      _.each(res.messages, function(msg) {
        // console.log(res.messages);
        if (!msg.pinned_to && msg.subtype != "pinned_item" && !msg.inviter) {
          msg.channel = team.image_channel_id;
          controller.deleteThisMsg(msg, team.bot.app_token, function() {});
        }
        count++;

        if (count == res.messages.length && cb)
          cb();
      });
    }).catch(err => console.log(err));
  }

  controller.imageRefresh = function(bot, message, channel, team) {

    var web = new WebClient(team.bot.app_token);

    return new Promise((resolve, reject) => {

      controller.imageRemove(bot, message, channel, team, function() {
        controller.imageFeedback(bot, message, channel, team);

        _.each(team.uploadedImages, function(img) {
          if (!img.location) {
            controller.imageTag(bot, message, img.url);
          }
        });

        controller.imageAlbum(bot, message, team);

        setTimeout(function() {
          resolve();
        }, 500);

      });

    });

  }
}
