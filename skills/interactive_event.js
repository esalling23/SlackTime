const _ = require("underscore");
const request = require("request");
const openurl = require('openurl');
// const opn = require('opn');
const { WebClient } = require('@slack/client');

// Delete messages
function deleteMsg(message, channel, bot) {
	bot.api.chat.delete({ts: message, channel: channel}, function(err, message) {
    console.log("deleted: ", message);
  });
}

module.exports = function(controller) {

  // for choose/confirm
  // Temporary storage
  var choiceSelect = [];
	var usersClicking = [];
	var maxWaitTime = 5;

  controller.on('interactive_message_callback', function(bot, event) {

    // console.log(event, "is the interactive message callback event");

    // A user selected a menu option
    if (event.actions[0].name.match(/^choose(.*)$/)) {
      // console.log(event.attachment_id);
        var reply = event.original_message;

        // Grab the "value" field from the selected option
        var value = event.actions[0].selected_options[0].value;
        var choice;

      // console.log(value);

        var actions = reply.attachments[0].actions;

        // for each attachment option
        for (var i = 0; i < actions.length; i ++) {
          // check if the attachment option value equals the selected value
          // NO TWO VALUES CAN BE THE SAME
          if (actions[i].options) {
            for (var j = 0; j < actions[i].options.length; j++) {

              if (actions[i].options[j].value == value) {
                  // set the choice to the text of the matching option
                  choice = actions[i].options[j].text;
              }

            }

          }

        }

      // console.log(choice);

        // Take the original message attachment
        var menuAttachment = reply.attachments[0].actions[0];
        // Change the menu text to be the chosen option
        menuAttachment.text = choice;
        // Set the attachment to the altered object
        reply.attachments[0].actions[0] = menuAttachment;

        // If this user does not already have a choice stored
        if (!_.findWhere(choiceSelect, { user: event.user })) {

          if (event.actions[0].name.includes("multi")) {
            // console.log(event.actions[0].name);

            var key = parseInt(event.actions[0].name.match(/\d+/));
            // console.log(key);
            var val = {};
            var choiceMulti = {};

            val[key] = value;
            choiceMulti[key] = choice;

            choice = choiceMulti;
            value = val;
          }

          // console.log("we are adding this choice");
            // Create object to hold this selection
            // Selection is "valid" or the solution/key if the value is "correct"
            // Any other value will be incorrect
            // NO TWO VALUES CAN BE THE SAME
            choiceSelect.push({
              user: event.user,
              choice: choice,
              value: value,
              callback: event.callback_id
            });

        } else { // User has choice stored

          // console.log("we are updating this choice");
          // Update stored choice with new choice, valid bool, and callback_id
          choiceSelect = _.map(choiceSelect, function(item) {
              if (item.user == event.user) {
                item.callback = event.callback_id;

                if (event.actions[0].name.includes("multi")) {

                  if (typeof item.choice == "string")
                    item.choice = {};

                  if (typeof item.value == "string")
                    item.value = {};

                  var key = parseInt(event.actions[0].name.match(/\d+/));
                  // console.log(key);

                  item.choice[key] = choice;
                  item.value[key] = value;

                } else {
                  item.value = value;
                  item.choice = choice;
                }

                return item;
              }
              else return item;
            });

        }

      console.log(choiceSelect, "is the choice select");

     }

    // Confirm menu choice
    if (event.actions[0].name.match(/^confirm$/)) {

        var reply = event.original_message;
        // data object for puzzle attempt event
        var data = {};

        // Locate the saved choice based on the user key
        var confirmedChoice = _.findWhere(choiceSelect, { user: event.user });

        controller.storage.teams.get(event.team.id).then((res) => {

          var opt = {
            bot: bot,
            event: event,
            team: res,
            data: confirmedChoice
          }

          var scriptName = confirmedChoice.value;

          if (confirmedChoice.value.includes('channel')) {
            opt.thread = 'channel_code';
            scriptName = 'remote'
          }

          // Set the puzzle, answer, and if the answer is correct
          // This data will be sent to the puzzle_attempt event for saving to storage

          controller.studio.get(bot, scriptName, event.user, event.channel).then((script) => {

            opt.user = _.findWhere(res.users, { userId: event.user });
            opt.script = script;

            controller.confirmMovement(opt);

          });

        });

     }

    // user submitted a code
    if (event.actions[0].name.match(/^code(.*)/)) {
      var reply = event.original_message;

      var options = {};
      var code = [];

      var type = event.actions[0].name;

      if (type.includes('safe') || type.includes('aris') || type.includes('bookshelf') || type.includes('telegraph_key') || type.includes('remote')) {
        // console.log("confirming safe/door enter code");

        var confirmedChoice = _.findWhere(choiceSelect, { user: event.user });
        var callback_id = event.callback_id.replace("_code", "").replace("_confirm", "");

        // If this is a remote code, use the callback id as a special channel parameter
        // Also set the codeType to "remote" via callback_id
        if (type.includes('remote')) {
          options.channel = callback_id.split("_")[2];
          callback_id = "remote";
        }

        options.code = confirmedChoice.choice;

        options.codeType = callback_id;

      } else if (type.includes('buttons')) {

        _.each(reply.attachments, function(attachment) {
          _.each(attachment.actions, function(action) {

            if (action.name == "color") {
              var color;
              switch (action.style) {
                case 'danger':
                  color = 'red';
                  break;
                case '':
                case 'default':
                  color = 'grey';
                  break;
                case 'primary':
                  color = 'green';
                  break;
              }
              code.push(color);
            }

          });
        });

        options.codeType = 'buttons';
        options.code = code;

      } else if (type.includes('keypad')) {

         _.each(reply.attachments, function(attachment) {
          _.each(attachment.actions, function(action) {

            if (action.name == "letter") {
              code.push(action.text);
            }

          });
        });

        options.code = code;
        options.codeType = 'keypad';

      }
      console.log(options.code, options.codeType);

      options.event = event;
      options.user = event.user;
      options.team = event.team.id;
      options.bot = bot;

      // console.log("code has been entered");

      controller.trigger("code_entered", [options]);

    }

    // button color change
    if (event.actions[0].name.match(/^color/)) {

      // console.log(event);
      var callback_id = event.callback_id;
      var reply = event.original_message;
      // we need to change this button's color homie
      _.each(reply.attachments, function(attachment) {
        _.map(attachment.actions, function(action) {
          // console.log(action);
          if (action.value == event.actions[0].value) {
            switch (action.style) {
              case 'danger':
                action.style = 'primary';
                break;

              case 'primary':
                action.style = '';
                break;

              case '':
              case 'default':
                action.style = 'danger';
                break;
            }
          }
            return action;
        });
      });

      bot.api.chat.update({
        channel: event.channel,
        ts: reply.ts,
        attachments: reply.attachments
      }, function(err, updated) {

        if (callback_id == "three_color_buttons") {
          // console.log(event.team.id);

          controller.storage.teams.get(event.team.id, function (error, team) {
            // console.log(error, team);
            var thisUser = _.findWhere(team.users, { userId: event.user });
            var startBtns = [];
            _.each(updated.message.attachments[0].actions, function(btn) {
              startBtns.push(btn.style == "" ? "default" : btn.style);
            });

            thisUser.startBtns = startBtns;

            team.users = _.map(team.users, function(user) {
              if (user.userId == thisUser.userId)
                return thisUser;
              else
                return user;
            });

            controller.storage.teams.save(team, function(err, saved) {

              // console.log(saved.users, " we saved these users");
              controller.trigger("count_colors", [bot, event, saved]);
            });

          });
        };
      });


    }

    if (event.actions[0].name.match(/^start/)) {

      var options = {
        bot: bot,
        message: event,
        forced: false,
        team: event.team
      };

      options.player = true;
      controller.trigger('generation_event', [options]);

      controller.studio.runTrigger(bot, 'start', event.user, event.channel, event).catch(function(err) {
          console.log('Error: encountered an error loading onboarding script from Botkit Studio:', err);
      });

    }

    // Move through pictures in a given photo album
    if (event.actions[0].name.match(/^picture(.*)/)) {
      // console.log(event);
      var reply = event.original_message;
      var type = event.actions[0].value;
      var url = reply.attachments[0].image_url;
      // console.log(reply.attachments[0].image_url);

      controller.storage.teams.get(event.team.id, function(err, team) {
        var album = _.filter(team.uploadedImages, function(img) { return img.location != undefined });
        var nxt = 1;
        if (event.actions[0].name.includes("album")) {
          album = _.flatten(_.values(team.albumImages));
          nxt = 2;
        }

        var image = _.findWhere(album, { url: url });
        var pos = album.indexOf(image);

        if (type == "next") {
          pos++;
          if (!album[pos])
            pos = 0;
        } else if (type == "back") {
          pos--;
          if (!album[pos])
            pos = album.length - 1;
        }

        // console.log(pos, album.length);

        reply.attachments[0].image_url = album[pos].url;

        if (nxt == 1)
          reply.attachments[0].text = "Location: " + album[pos].location;

        reply.attachments[0].actions[0].text = "< Back";
        reply.attachments[0].actions[nxt].text = "Next >";

        bot.api.chat.update({
          channel: event.channel,
          ts: reply.ts,
          attachments: reply.attachments
        }, function(err, updated) { console.log(err, updated)});

      });

    }

    // User "say"s something
    if (event.actions[0].name.match(/^say/)) {

      var opt = {
        bot: bot,
        event: event,
        data: event.actions[0]
      }

      controller.storage.teams.get(event.team.id).then((res) => {

        controller.studio.getScripts().then((list) => {

          var name = event.actions[0].value;

          if (event.actions[0].value.includes('channel'))
            name = "remote";
          else if (res.entered && event.actions[0].value == "three_color_buttons") {
            name = "input_nodes_1";
            opt.data.value = "input_nodes_1";
          }

          var script = _.findWhere(list, { command: name });
          var scriptName = script.command;
          var thisUser = _.findWhere(res.users, { userId: event.user });
          console.log(event.actions[0].value);

          controller.studio.get(bot, scriptName, event.user, event.channel).then((currentScript) => {

              controller.storage.teams.save(res).then(saved => {

                opt.team = saved;
                opt.user = _.findWhere(res.users, { userId: event.user }),
                opt.script = currentScript;

                controller.confirmMovement(opt);
                usersClicking.splice(usersClicking.indexOf(event.user), 1);

              });

            });

        });

      });

    }

  });
}
