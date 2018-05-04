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

module.exports = function(controller) {
 
  controller.imageRemove = function(bot, message, channel, team) {
    
    var web = new WebClient(team.oauth_token);
    
    web.groups.history(channel).then(res => {
      _.each(res.messages, function(msg) {
        if (!msg.pinned_to && !msg.subtype) {
          msg.channel = team.image_channel_id;
          controller.deleteThisMsg(msg, team.oauth_token, function() {});
        }
      });
    }).catch(err => console.log(err));
  }
  
  controller.imageRefresh = function(bot, message, channel, team) {
    
    var web = new WebClient(team.oauth_token);
    
    controller.imageRemove(bot, message, channel, team);
    
    setTimeout(function() {
      controller.imageFeedback(bot, message, channel, team);
      
      _.each(team.uploadedImages, function(img) {
        if (!img.location) {
          controller.imageTag(bot, message, img.url);
        }
      });
            
      controller.imageAlbum(bot, message, team);
            
    }, 500);
    
  }
}