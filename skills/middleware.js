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

      // Store pinning/unpinning messages
      if (message.event) {

        if (message.event.type == "pin_removed" || message.event.type == "pin_added") {
          // console.log("PIN: \n", message);

          var event = {
            team: message.team_id,
            user: message.event.user,
            channel: message.event.channel_id,
            pinned_item: message.event.item.message,
            type: message.event.type,
            ts: message.event_ts
          }

          controller.dataStore(bot, event, "pin").catch(err => console.log('data storage thread comment error: ', err));
        } else if (message.event.files) {

          var comment = message.subtype == 'file_comment' || message.event.files[0].pretty_type == "Post" || message.event.subtype == 'file_comment' || message.event.files[0].pretty_type == "Plain Text";

          // Save a file comments and post uploads as a chat type data object
          if (comment) {
            controller.dataStore(bot, message, "chat").catch(err => console.log('data storage file comment error: ', err));
          } else {
            // If this is a file upload
            var messId = message.team.id ? message.team.id : message.team;
            controller.storage.teams.get(messId, function(err, team){

              // upload it to our cloudinary account
              controller.fileUpload(bot, message, function(err, result) {

                if (err) 
                  console.log("File Upload Error: \n", err);
                else {
                  // Set the message url to the cloudinary url of the uploaded file
                message.url = result.url;

                // If this is the image counter channel, trigger event
                if(team.image_channel_id == message.channel && acceptedTypes.indexOf(message.event.files[0].filetype) > -1) {
                  controller.trigger("image_counter_upload", [{ bot: bot, message: message, result: result }]);
                  message.image_counter_upload = true;
                } else {
                  message.image_counter_upload = false;
                }

                // Store the message as a chat item
                controller.dataStore(bot, message, "upload").catch(err => console.log('File upload data storage error: ', err));
                }

              });
            });
          }

        }



      }

      // Store threads
      if (message.thread_ts) {


        controller.dataStore(bot, message, "thread").catch(err => console.log('data storage thread comment error: ', err));

        // console.log(message, " a thread");
      }

      next();

    });


    controller.middleware.send.use(function(bot, message, next) {

        // do something...
        // console.log('SEND:', message);


        if (message.type == "feedback" && bot.config.id) {
          controller.storage.teams.get(bot.config.id, function(err, team) {
            var token = team.bot.app_token;

            var web = new WebClient(token);

            if (team.image_feedback)
              deleteThisMsg(team.image_feedback, team.bot.app_token, function() {});

            setTimeout(function() {
              web.groups.history(message.channel).then(res => {
                console.log(res.messages);
                var thisMsg = _.findWhere(res.messages, { text: message.text });
                
                if (!thisMsg) return;

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
      if (message.album && bot.config.id) {
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
                console.log(message.text, " is the text of the message we want to pin")
                console.log(msg.attachments, msg.text, " is the message we are checking")
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
