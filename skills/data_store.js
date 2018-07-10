const _ = require("underscore");

module.exports = function(controller) {

  controller.dataStore = function(bot, event, type, opt) {
    return new Promise((resolve, reject) => {

      var ObjectID = require('bson').ObjectID;
      var storage = ["chat", "pin", "dnd", "thread"].includes(type) ? "chat" : type == "upload" ? "file_uploads" : "events";
      var relatedMsgTs;

      console.log(type + " data storage with this msg: ", event);

      var dataEvent = {
        id: new ObjectID(),
        team: event.team.id ? event.team.id : event.team,
        user: event.user,
        channel: event.channel,
        time: new Date(),
        ts: event.ts ? event.ts : event.event_ts
      }

      controller.storage.teams.get(dataEvent.team, function(err, team) {

        if (type == "interactive" || type == "code") {

          // Set the type of "button" clicked (ie: select, button)
          dataEvent.type = event.actions[0].type;

          // Event action name tells what the action does
          var action = event.actions[0].name ? event.actions[0].name : event.actions[0].selected_options[0].name;
          // Event action value is the action's type or target
          var value = event.actions[0].value ? event.actions[0].value : event.actions[0].selected_options[0].value;
          // Set the action and value
          dataEvent.action = action;
          dataEvent.value = value;

          // Find the "button" clicked - either button or menu selection
          var attachment = event.original_message.attachments[event.attachment_id - 1];
          var button;
          if (event.actions[0].selected_options)
            button = _.findWhere(_.findWhere(attachment.actions, { name: action }).options, { value: value });
          else
            button = _.findWhere(attachment.actions, { value: value });

          // ****
          // Buttons with changing properties
          // ****
          if (dataEvent.action == "color") {
            // Determine old/new color for color-changing buttons
            var oldColor = button.style;
            dataEvent.oldColor = oldColor == "" ? "grey" : oldColor == "primary" ? "green" : "red";
            dataEvent.newColor = oldColor == "" ? "red" : oldColor == "primary" ? "grey" : "green";
          }
          else if (dataEvent.action == "letter") {
            // Determine old/new letter for letter-changing buttons
            var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
            var reply = event.original_message;

            // Cycle through message attachments to locate current button
            _.each(reply.attachments, function(attachment) {
              _.each(attachment.actions, function(action) {
                if (action.value == event.actions[0].value) {
                  // If this is the button clicked, determine current spot
                  var spot = letters.indexOf(action.text);
                  // Find the next spot in the array of available letters, cycling right
                  // If we are at "I" then move back to "A" and start cycling again
                  var nextSpot = !letters[spot+1] ? letters[0] : letters[spot+1];
                  dataEvent.oldLetter = letters[spot];
                  dataEvent.newLetter = nextSpot;
                }

              });
            });
          }
        }
        else if (["chat", "thread", "upload"].includes(type)) {
          dataEvent.message = event.text;
          dataEvent.type = event.type;

          // Settings for file name and url
          if (event.file) {
            dataEvent.fileName = event.file.title;
            dataEvent.fileUrl = event.url ? event.url : event.file.url_private;

            if (event.file.pretty_type == "Post") {
              dataEvent.fileType = "Slack Post";
            } else if (file.pretty_type == "Plain Text") {
              dataEvent.fileType = "Slack Snippet";
            } else
              dataEvent.fileType = "User Upload";

            if (event.comment && dataEvent.type == "file_comment")
              dataEvent.user = event.comment.user;
          }

          // Settings for reactions
          if (event.type.split('_')[0] == 'reaction') {

            dataEvent.type = event.type;
            dataEvent.channel = event.raw_message.event.item.channel;
            dataEvent.message = event.event.reaction;

            relatedMsgTs = event.raw_message.event.item.ts;
          }

          if (type == "thread") {
            dataEvent.type += " (thread comment)";
            relatedMsgTs = event.thread_ts;
          }

        }
        else if (type == "download" || type == "link") {
          // Download and link type and url
          dataEvent.type = type;
          dataEvent.url = event.url;
        }
        else if (type == "dnd") {
          // Do not disturb settings changes
          dataEvent.type = type;
          dataEvent.dndEnabled = event.event.dnd_status.dnd_enabled;
        }

        if (type == "code") {
          dataEvent.code = opt.codeObj.code;
          dataEvent.overallAnswer = opt.codeObj.overall;
          dataEvent.correct = opt.codeObj.correct;
          dataEvent.type = opt.codeType;

          if (opt.codeObj.puzzle)
            dataEvent.puzzle = opt.codeObj.puzzle;

        }

        // Settings for pinned/unpinned message
        if (type == "pin") {
          dataEvent.type = event.type;
          relatedMsgTs = event.pinned_item.ts;
        }

        var message = {
          channel: dataEvent.channel,
          ts: relatedMsgTs
        }

        controller.findRelatedMsg(bot, message, team.bot.app_token).then(msg => {

          // console.log(msg, " is what the promise returned related message");

          if (msg) {
            dataEvent.relatedMsg = msg.id;
          }

          controller.eventStages(bot, event, type).then(res => {

            // console.log(res, " is what the promise returned");

            dataEvent.place = res;

            controller.storage[storage].save(dataEvent, function(err, saved) {
              // console.log(err, saved, "SAVED!!");
              if (err)
                reject(err);
              else
                resolve(saved);
            });

          }).catch(err => console.log('Event Stages Error ', err));

        }).catch(err => console.log('Find Related Message Error ', err));

      });

    });

  };

}
