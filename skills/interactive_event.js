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
  
  controller.on('interactive_message_callback', function(bot, event) {
    
    // console.log(event, "is the interactive message callback event");
    
    controller.dataStore(event);

    // Choose a menu option
    if (event.actions[0].name.match(/^choose(.*)$/)) {
      // console.log(event.attachment_id);
        var reply = event.original_message;
      
        // Grab the "value" field from the selected option
        var value = event.actions[0].selected_options[0].value;
        var choice;
      
      console.log(value);
      
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
      
      console.log(choice);

        // Take the original message attachment
        var menuAttachment = reply.attachments[0].actions[0];
        // Change the menu text to be the chosen option
        menuAttachment.text = choice;
        // Set the attachment to the altered object
        reply.attachments[0].actions[0] = menuAttachment;

        // If this user does not already have a choice stored
        if (!_.findWhere(choiceSelect, { user: event.user })) {
          
          if (event.actions[0].name.includes("multi")) {
            console.log(event.actions[0].name);
            
            var key = parseInt(event.actions[0].name.match(/\d+/));
            console.log(key);
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
                  console.log(key);

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
        var script;

        controller.storage.teams.get(event.team.id).then((res) => {
          
          // Set the puzzle, answer, and if the answer is correct
          // This data will be sent to the puzzle_attempt event for saving to storage

          controller.studio.get(bot, confirmedChoice.value, event.user, event.channel).then((script) => {
            
            var opt = {
              bot: bot, 
              event: event, 
              team: res, 
              user: _.findWhere(res.users, { userId: event.user }), 
              data: confirmedChoice, 
              script: script
            }
            
            controller.confirmMovement(opt);

          });

        });

     }
    
    if (event.actions[0].name.match(/^tag/)) {
      var confirmedChoice = _.findWhere(choiceSelect, { user: event.user });
      
      // console.log(event);
      // console.log(confirmedChoice);
            
      controller.trigger("image_tag_submit", [{
        bot: bot,
        message: event,
        url: event.original_message.attachments[0].image_url, 
        location: confirmedChoice.value
      }]);
    }

    // user submitted a code
    if (event.actions[0].name.match(/^code(.*)/)) {      
      var reply = event.original_message;
      
      var options = {};
      var code = [];
      
      var type = event.actions[0].name;
            
      _.each(reply.attachments, function(attachment) {
        _.each(attachment.actions, function(action) {

          if (type.includes('safe') || type.includes('aris') || type.includes('keypad') || type.includes('bookshelf') || type.includes('telegraph_key')) {
            console.log("confirming safe/door enter code");
            var confirmedChoice = _.findWhere(choiceSelect, { user: event.user });
            var callback_id = event.callback_id.replace("_code", "").replace("_confirm", "");
            console.log(confirmedChoice, "is the codeType");
            
            options.code = confirmedChoice.choice;
            
            options.codeType = callback_id;
            
          } else if (type.includes('buttons')) {

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
              console.log(code);

            } 
            
            options.codeType = 'buttons';
            options.code = code;
            
          } 
          
          
        });
      });
      
      console.log(options.code, options.codeType);
      
      options.event = event;
      options.user = event.user;
      options.team = event.team.id;
      options.bot = bot;
      
      console.log("code has been entered");
      
      controller.trigger("code_entered", [options]);
      
    }
    
    // button color change
    if (event.actions[0].name.match(/^color/)) {

      console.log(event);
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
            console.log(error, team);
            var thisUser = _.findWhere(team.users, { userId: event.user });
            thisUser.startBtns = [];
            _.each(updated.message.attachments[0].actions, function(btn) {
              thisUser.startBtns.push(btn.style);
            });
                        
            team.users = _.map(team.users, function(user) {
              if (user.userId == thisUser.userId) 
                return thisUser;
              else 
                return user;
            });
            
            controller.storage.teams.save(team, function(err, saved) {
              
              console.log(saved.users, " we saved these users");
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
    
    if (event.actions[0].name.match(/^picture/)) {
      console.log(event);
      var reply = event.original_message;
      var type = event.actions[0].value;
      var url = reply.attachments[0].image_url;
      console.log(reply.attachments[0].image_url);
      
      controller.storage.teams.get(event.team.id, function(err, team) {
        var image = _.findWhere(team.uploadedImages, { url: url });
        var pos = team.uploadedImages.indexOf(image);
        
        if (type == "next") {
          pos++;
          if (!team.uploadedImages[pos])
            pos = 0;
        } else if (type == "back") {
          pos--;
          if (!team.uploadedImages[pos])
            pos = team.uploadedImages.length - 1;
        }
        
        console.log(pos, team.uploadedImages.length);
        
        reply.attachments[0].image_url = team.uploadedImages[pos].url;
        
        reply.attachments[0].actions[0].text = "<";
        reply.attachments[0].actions[2].text = ">";
        
        bot.api.chat.update({
          channel: event.channel, 
          ts: reply.ts, 
          attachments: reply.attachments
        }, function(err, updated) { console.log(err, updated)});
        
      });     
      
    }
    
    if (event.actions[0].name.match(/^guide/)) {

      var reply = event.original_message;
      var type = event.actions[0].value;
      var url = reply.attachments[0].image_url;
      
      var pos = parseInt(reply.attachments[0].image_url.split("Guide-")[1].replace(".pdf", ""));
      var url = "http://res.cloudinary.com/extraludic/image/upload/v1/escape-room/Guide-";

      if (type == "next") {
        pos++;
        if (pos > 3)
          pos = 1;
      } else if (type == "prev") {
        pos--;
        if (pos <= 0)
          pos = 3;
      }

      reply.attachments[0].image_url = url + pos + ".png";

      reply.attachments[0].actions[0].text = "<";
      reply.attachments[0].actions[2].text = ">";

      bot.api.chat.update({
        channel: event.channel, 
        ts: reply.ts, 
        attachments: reply.attachments
      }, function(err, updated) { console.log(err, updated)});

    }
    
    if (event.actions[0].name.match(/^download/)) {
      
      controller.trigger("download", [bot, event]);
      
    }
    
    if (event.actions[0].name.match(/^dilemma/)) {
      
      controller.trigger("prisoners_selection", [bot, event]);
      
    }
    
    
    // user says something
    if (event.actions[0].name.match(/^say/)) {
            
      controller.studio.getScripts().then((list) => {
        
        var script = _.findWhere(list, { name: event.actions[0].value });
              
        controller.storage.teams.get(event.team.id).then((res) => {
                              
          controller.studio.get(bot, script.name, event.user, event.channel).then((currentScript) => {
            var opt = {
              bot: bot, 
              event: event, 
              team: res, 
              user: _.findWhere(res.users, { userId: event.user }), 
              data: event.actions[0], 
              script: currentScript
            }
            
            controller.confirmMovement(opt);
            
          });

        });
        
      });
      
    }
    
    
  });
 
  
}


var determineThread = function(script, team, user) {
  
  
  
}