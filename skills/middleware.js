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
    
//         // do something...
        // console.log('RCVD:', message);
      
        if (message.file && message.file.created) {
          
          controller.dataStore(message, "chat").catch(err => console.log(err));
          if (acceptedTypes.indexOf(message.file.filetype) > -1) {
            var messId = message.team.id ? message.team.id : message.team;
            controller.storage.teams.get(messId, function(err, team){
              // console.log(messId, "is the team id");
              // console.log(team, "is the team");
              if(team.image_channel_id == message.channel) {
                controller.trigger("image_counter_upload", [{ bot:bot, message:message }]);
              }
            });
          }
          
        }
      
        
        next();
    
    });
    
    
    controller.middleware.send.use(function(bot, message, next) {
    
        // do something...
        // console.log('SEND:', message);
        
          if (message.type == "dilemma") {
          
            controller.storages.teams.get(bot.config.id, function(err, team) {
              
              var user = _.findWhere(team.prisoner_players, { userId: message.user });
              
              controller.store_prisoners_msg(message, user, team);

            });
          }

      
        if (message.type == "feedback") {
          controller.storage.teams.get(bot.config.id, function(err, team) {
            var token = team.oauth_token;

            var web = new WebClient(token);
            
            if (team.image_feedback) 
              deleteThisMsg(team.image_feedback, team.oauth_token, function() {});

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
      
      if (message.album) {
        controller.storage.teams.get(bot.config.id, function(err, team) {
          var token = team.oauth_token;

          var web = new WebClient(token);
          
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
      
      if (message.pin) {
        controller.storage.teams.get(bot.config.id, function(err, team) {
          var token = team.oauth_token;

          var web = new WebClient(token);
          
          setTimeout(function() {
            web.groups.history(message.channel).then(res => {
              console.log(res.messages);
              var thisMsg = _.filter(res.messages, function(msg) {
                if (msg.attachments) {
                  return msg.attachments[0].title == "Remember:";
                } else 
                  return msg.text == message.text;
              })[0];
              
              bot.api.pins.add({
                channel: message.channel, 
                timestamp: thisMsg.ts
              }, function(err, res) {
                console.log(err, res);
              });
              
            }).catch(err => console.log(err));
          }, 1000);
        });
      } 
      
      if (message.type == "already_complete") {
          controller.storage.teams.get(bot.config.id, function(err, team) {
            var token = team.oauth_token;

            var web = new WebClient(token);
            console.log(message);
            
            setTimeout(function() {
              web.groups.history(message.channel).then(res => {
                // console.log(res.messages);
                var thisMsg = _.findWhere(res.messages, { text: message.text });
                
                thisMsg.channel = message.channel;
                
                bot.api.chat.delete({ts: thisMsg.ts, channel: message.channel}, function(err, res) {
                    console.log(err, res);
                });
              });
            }, 1000);
            
          });
        }
      
      if (message.movement) {
        
        controller.storage.teams.get(bot.config.id, function(err, team) {
          console.log("this team's movements: ", team.movements);
          if (!team.movements) team.movements = [];
          var movement = parseInt(message.movement);
          
          if (team.movements.includes(movement)) return;
            
          team.movements.push(movement);
          
          controller.storage.teams.save(team, function(err, saved) {
          
            var phase = movement <= 3 ? 1 : movement - 2;
            
            if (phase == 3)
              controller.trigger("garden_channel", [bot, team.id]);

            var log = {
              bot: bot, 
              team: bot.config.id,
              phase: "phase_" + phase, 
            }

            controller.trigger('gamelog_update', [log]);
            console.log("saved the movement to node ", movement);
            console.log(saved.movements);
          });
        });
        
      }
      
        next();
    
    });

}
