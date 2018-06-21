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

function isUser(member) {
  // console.log(member.name, "is the member being checked");
  // console.log(member.is_bot, member.name == "slackbot");
  if ( (member.is_bot && member.name != process.env.botName) || member.name == "slackbot")
    return false;
  else
    return true;
}

module.exports = function(controller) {
  
  controller.on("image_counter_onboard", function(bot, message) {

    var id = message.team.id ? message.team.id : message.team
    // add everyone to a picture-counting channel 
    controller.storage.teams.get(id, function(err, team) {
      
      var token = team.bot.app_token;

      var web = new WebClient(token); 
      
      // Create the image counter channel with the name in the .env file
      web.groups.create(process.env.image_counter_channel).then((response) => {

        var channel = response.group;
        var channelId = channel.id;
        
        // Save the channel Id and add it to the list of no-chat channels
        team.image_channel_id = channelId;
        team.noChatChannels.push(channelId);
        
        controller.storage.teams.save(team, function(err, savedTeam) {
          
          // invite all team users
          var data = _.map(team.users, function(user) {
            return [ web, user.userId, channelId, savedTeam.users.indexOf(user) ]
          });

          // invite the bot
          data.push([ web, savedTeam.bot.user_id, channelId, 1 ])

          var mapPromises = data.map(channelJoin);

          var results = Promise.all(mapPromises);

          results.then(members => {
   
            // Set the channel topic and purpose
            web.groups.setTopic(channelId, "Upload images from Critical Safari here. Only upload images one at a time.").then(res => console.log(res)).catch(err => console.log(err));
            web.groups.setPurpose(channelId, "Please upload images one at a time. Uploading multiple files at once will confuse the system.").then(res => console.log(res)).catch(err => console.log(err));
            
            setTimeout(function() {
              // initial feedback message
              controller.imageFeedback(bot, message, channelId, savedTeam);
              // image-less image album
              controller.imageAlbum(bot, message, channelId, savedTeam);
              
              // send out the rules message
              controller.studio.get(bot, "image_tag_rules", message.user, channelId).then(convo => {
                convo.activate();
              });

            }, 100 * data.length);
            
          });

        });

        
      });
    });
  });
  
  // An image has been uploaded
  controller.on("image_counter_upload", function(params) {
    console.log(params.message.file.title);

    controller.storage.teams.get(params.message.team, function(err, team) {
      // if the team has uploaded all images, delete the image uploaded
      // and send them to the all_complete thread
      if (team.imagesComplete) {

        controller.deleteThisMsg(params.message, team.bot.app_token, function() { 
          controller.studio.get(params.bot, "image_tag", params.message.user, params.message.channel).then(convo => {
            convo.changeTopic("all_complete");

            convo.activate();
          });
        });
        
        return;

      }

      // Delete the image uploaded
      controller.deleteThisMsg(params.message, team.bot.app_token, function() { 

        if (!team.uploadedImages) team.uploadedImages = [];

        // Add this image data to the team's uploadedImages object
        team.uploadedImages.push({
          user_uploaded: params.message.user, 
          url: params.result.url, 
          date_uploaded: Date.now()
        });

        controller.storage.teams.save(team, function(err, saved) {

          // set the image url and the user
          var vars = {
            image_url: params.result.url, 
            user: params.message.user
          };

          // upon image upload, show menu asking for player to tag the image location
          controller.studio.get(params.bot, "image_tag", params.message.user, params.message.channel).then(convo => {

            convo.threads.default[0].attachments[0].image_url = vars.image_url;

            convo.activate();

          });

        });


      });
      
    });
    
  });
  
  controller.on("image_tag_submit", function(params) {
    
    controller.storage.teams.get(params.message.team.id, function(err, team) {
      
      var thread;
      var vars = {
        location: params.location
      };
      
      // If the location is full, tell the player it's full
      if(_.where(team.uploadedImages, { location: params.location }).length >= 6) {
        controller.makeCard(params.bot, params.message, 'image_tag', "already_complete", vars, function(card) {
          params.bot.replyInteractive(params.message, card);
        });
      } else {
        
        // Update the uploadedImages object to add the tagged location
        var userUploaded;
        team.uploadedImages = _.map(team.uploadedImages, function(image) {
          if (image.url == params.url) {
            image.location = params.location;
            userUploaded = image.user_uploaded;
          }
          return image;
        });
        
        // grab the tagged images
        var taggedImages = _.filter(team.uploadedImages, function(image) {
          return image.location !== undefined;
        });
        
        // if the number of tagged images is at the limit
        // set imagesComplete to true
        if (taggedImages.length >= process.env.images_limit * process.env.images_locations.split("-").length) 
          team.imagesComplete = true;          
                
        controller.storage.teams.save(team, function(err, saved) {
          // console.log("saved team: ", saved);
          controller.imageRefresh(params.bot, params.message, saved.image_channel_id, saved).then(res => {
            
            if(saved.imagesComplete) {
              var message = { user: userUploaded, channel: saved.gamelog_channel_id };

              console.log(message);

              controller.trigger('gamelog_update', [{
                bot: params.bot, 
                event: message, 
                team: saved, 
                codeType: 'image_complete', 
                phase: "phase_1",
                puzzle: 'image_counter'
              }]);

              vars.code = process.env.safe_code.replace(/-/g, "").toString();
              controller.makeCard(params.bot, params.message, 'image_tag', "complete", vars, function(card) {
                params.bot.replyInteractive(params.message, card);            
              });
            }
            
          }).catch(err => console.log(err));

        });

      }
    });
  });
  

  var channelJoin = function channelJoin(params) {

    if (!params) return;
   // Set a timeout for 1 sec each so that we don't exceed our Slack Api limits

    setTimeout(function() {
      var member = params[1].toString();
      var channel = params[2].toString();
      var web = params[0];
      // console.log(member["userId"].toString(), "is the member that will join " + channel);

      // check if user is bot before adding
      // TODO check if user is already in channel
      if (member) {

        web.groups.info(channel).then(channelData => {
          // console.log(channelData.channel, "are the members in this current channel");
          
          if (channelData && channelData.group.members.indexOf(member) < 0) {
            // Invite each user to the labyrinth chat channel
            return web.groups.invite(channel, member)
              .then(res => {
                // console.log(res, "is the channel res");
                return member;
              }).catch((err) => { console.log(err) });

          } else {
            return "filled";
          }
        }).catch(err => console.log(err));


      }

    }, 100 * (params[3]+1));

  };// End channel Join
  
}