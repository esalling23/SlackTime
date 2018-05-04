const _ = require("underscore");
const { WebClient } = require('@slack/client');

module.exports = function(controller) {
  
  controller.on("prisoners_selection", function(bot, event) {
    var choice = event.actions[0].value;
    
    controller.storage.teams.get(event.team.id, function(err, team) {
      if (!team.sharingUsers) team.sharingUsers = [];
      if (!team.stealingUsers) team.stealingUsers = [];
      if (!team.blockingUsers) team.blockingUsers = [];
      if (!team.prisonerDecisions) team.prisonerDecisions = 0;
      if (!team.prisonerSuccess) team.prisonerSuccess = 0;

      team.prisonerDecisions++;

      if(choice == "share") {
        team.sharingUsers.push(event.user);
      } else if (choice == "steal") {
        team.stealingUsers.push(event.user);
      } else if (choice == "block") {
        team.blockingUsers.push(event.user); 
      }
      
      controller.storage.teams.save(team, function(err, saved) {
        controller.makeCard(bot, event, "prisoners_dilemma", "follow_up", {}, function(card) {
          
          bot.api.chat.update({
            channel: event.channel, 
            ts: event.original_message.ts, 
            attachments: card.attachments
          }, function(err, updated) {
            
            var user = _.findWhere(saved.prisoner_players, { userId: event.user });
            controller.store_prisoners_msg(updated, user, saved);
            
          });

          if (saved.prisonerDecisions == saved.users.length) {
            var obj = _.findWhere(saved.prisoners_dilemma, { complete: false });
            var message = event.original_message;
            message.channel = event.channel;
            setTimeout(function() {
              controller.trigger("prisoners_check", [bot, saved.id, obj, event]);
            }, 1000);
          }
          
        });
      });
      
    });
    
    controller.on("prisoners_check", function(bot, id, timeObj, event) {
      
      controller.storage.teams.get(id, function(err, team) {
        var web = new WebClient(team.oauth_token);
        var usersToKick = [];
        var thread;

        if((team.blockingUsers.length > 0 && team.stealingUsers.length > 0) || team.stealingUsers.length == team.users.length) {
          thread = "steal_kick";
          usersToKick.concat(team.stealingUsers);
        } 

        if(team.blockingUsers.length > 0 && team.stealingUsers.length <= 0) {
          thread = "block_kick";
          usersToKick.concat(team.blockingUsers);
        }

        if(team.blockingUsers.length <= 0 && team.stealingUsers.length > 0) {
          thread = "share_kick";
          usersToKick.concat(team.sharingUsers);
        }


        if(team.blockingUsers.length <= 0 && team.stealingUsers.length <= 0) {
          team.prisonerSuccess++;
          if (team.prisonerSuccess == 0) 
            thread = "default";
          else 
            thread = "success_" + team.prisonerSuccess;
        }

        if (team.prisonerSuccess == 2)
          team.prisonerSuccess = 0;

        team.prisonerDecisions = 0;
        team.sharingUsers = [];
        team.stealingUsers = [];
        team.blockingUsers = [];

        team.prisoners_dilemma = _.map(team.prisoners_dilemma, function(time) {
          if (time.num == timeObj.num)
            time.complete = true;

          return time;

        });

        controller.storage.teams.save(team, function(err, saved) {

          _.each(saved.prisoner_players, function(user) {

            controller.deleteHistory(user.bot_chat, bot.config.bot.token, bot.user_id, function() {

              controller.studio.get(bot, "prisoners_dilemma", user.userId, user.bot_chat).then(convo => {

                convo.changeTopic(thread);

                convo.activate();

              });

            });

          });
          
          setTimeout(function() {
          // kickUsers(usersToKick);
            
            controller.storage.teams.save(saved, function(err, updated) {

              saved.prisoner_players = _.filter(saved.prisoner_players, function(player) {
                return !usersToKick.includes(player.userId);
              });

              controller.prisoners_message(bot, saved.id, "default");
            });

          }, 10000);
          

        });

      });
    });
    
    
  });
  
  var deleteThisMsg = function(message, token, callback) {
    
    console.log(message, "we are deleting this");
    
    var ts = message.message_ts ? message.message_ts : message.ts;
    
    var web = new WebClient(token);
      
    web.chat.delete(ts, message.channel).then(res => {
      // console.log(res, "deleted");
      callback();
    }).catch(err => console.log(err));
  }
 
}

