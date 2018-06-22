 const _ = require("underscore");
// const gm = require("gm");
const http = require('http');
const fs = require('fs');
const request = require('request');
const { WebClient } = require('@slack/client');

var acceptedTypes = ['jpg', 'jpeg', 'png'];

module.exports = function(controller) {
  
  var deleteThisMsg = function(message, token, callback) {
    
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

      // If this is a file object, upload it to our cloudinary account
      if (message.file && message.file.created) {
        
        var messId = message.team.id ? message.team.id : message.team;
        controller.storage.teams.get(messId, function(err, team){
          // console.log(messId, "is the team id");
          // console.log(team, "is the team");
          
          controller.fileUpload(bot, message, function(result) {
            // Set the message url to the cloudinary url of the uploaded file 
            message.url = result.url;
            
            if(team.image_channel_id == message.channel && acceptedTypes.indexOf(message.file.filetype) > -1) {
              controller.trigger("image_counter_upload", [{ bot: bot, message: message, result: result }]);
              message.image_counter_upload = true;
            } else {
              message.image_counter_upload = false; 
            }

            controller.dataStore(message, "chat").catch(err => console.log(err));

          });
        });

      }


      next();

    });
    
    
    controller.middleware.send.use(function(bot, message, next) {
    
        // do something...
        // console.log('SEND:', message);
        
          if (message.type == "dilemma") {
          
            controller.storages.teams.get(bot.config.id, function(err, team) {
              
              var user = _.findWhere(team.prisoner_players, { userId: message.user });
              
              // controller.store_prisoners_msg(message, user, team);

            });
          }

      
        if (message.type == "feedback") {
          controller.storage.teams.get(bot.config.id, function(err, team) {
            var token = team.bot.app_token;

            var web = new WebClient(token);
            
            if (team.image_feedback) 
              deleteThisMsg(team.image_feedback, team.bot.app_token, function() {});

            setTimeout(function() {
              web.groups.history(message.channel).then(res => {
                console.log(res.messages);
                var thisMsg = _.findWhere(res.messages, { text: message.text });

                thisMsg.channel = message.channel;
                
                if (!team.image_channel_id) 
                  team.image_channel_id = thisMsg.channel;
                
                if (!team.noChatChannels.includes(team.image_channel_id)) 
                  team.noChatChannels.push(team.image_channel_id);

                team.image_feedback = thisMsg;
                
                controller.storage.teams.save(team, function(err, saved) { 
                  console.log(saved, "saved") 
                });
              });
            }, 1000);
          });
        } 
      
      // 
      if (message.album) {
        controller.storage.teams.get(bot.config.id, function(err, team) {
          var web = new WebClient(team.bot.app_token);
          
          setTimeout(function() {
            web.groups.history(message.channel).then(res => {
              console.log(res.messages);
              var thisMsg = _.filter(res.messages, function(msg) {
                if (msg.attachments) {
                  return msg.attachments[0].title == "Uploaded Images:";
                }
              })[0];
              
              team.image_album = thisMsg;
              
              controller.storage.teams.save(team, function(err, saved) {
                console.log(err, saved.image_album);
              });
              
            }).catch(err => console.log(err));
          }, 1000);
        });
        
      } 
      
      // Catch for messages marked for pinning (permanent)
      if (message.pin) {
        // Get team information for auth
        controller.storage.teams.get(bot.config.id, function(err, team) {
          var web = new WebClient(team.bot.app_token);
          
          setTimeout(function() { // wait for message to post
            web.groups.history(message.channel).then(res => {

              // Find the message through filtering matching text
              var thisMsg = _.filter(res.messages, function(msg) {
                if (msg.attachments) {
                  return msg.attachments[0].title == "Remember:";
                } else 
                  return msg.text == message.text;
              })[0];
              
              // Pin it to the channel
              bot.api.pins.add({
                channel: message.channel, 
                timestamp: thisMsg.ts
              }, function(err, res) {
                // console.log(err, res);
              });
              
            }).catch(err => console.log(err));
          }, 1000);
        });
      } 
      
      // Catch for image counter feedback messages
      if (message.type == "already_complete") {
      // Get the team information
        controller.storage.teams.get(bot.config.id, function(err, team) {
          var web = new WebClient(team.bot.app_token);

          setTimeout(function() { // wait long enough for the message to post
            
            web.groups.history(message.channel).then(res => {

              // Find the feedback message, and set its channel
              var thisMsg = _.findWhere(res.messages, { text: message.text });
              thisMsg.channel = message.channel;

              // Delete it
              bot.api.chat.delete({
                ts: thisMsg.ts, 
                channel: message.channel
              }, function(err, res) {
                  // console.log(err, res);
              });
            });
          }, 1000);

        });
      }
      
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
          
            // Since phase1 has 3 nodes and all other have 1, shift phase count
            var phase = movement <= 3 ? 1 : movement - 2;
            
            if (phase == 3) // phase 3 triggers the garden channel for aris chat
              controller.trigger("garden_channel", [bot, team.id]);

            var log = {
              bot: bot, 
              team: bot.config.id,
              phase: "phase_" + phase, 
            }

            controller.trigger('gamelog_update', [log]);
            
          });
        });
        
      }
      
        next();
    
    });

}
