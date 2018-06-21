const _ = require("underscore");
const { WebClient } = require('@slack/client');

module.exports = function(controller) {
  
  controller.on('prisoners_selection', function(bot, event) {
    var choice = event.actions[0].value;
    
    controller.storage.teams.get(event.team.id, function(err, team) {
      if (!team.prisoner_success) team.prisoner_success = 0;
      if (!team.prisoner_players) team.prisoner_players = _.where(team.users, { prisoner: true });
      
      if (_.pluck(team.prisoner_decisions, "user").includes(event.user)) return;
      
      var thisUser = _.findWhere(team.users, { userId: event.user });

      team.prisoner_decisions.push({ 
        user: thisUser.userId, 
        name: thisUser.name,
        choice: choice 
      });
      
      controller.storage.teams.save(team, function(err, saved) {
        controller.makeCard(bot, event, "prisoners_dilemma", "follow_up", {}, function(card) {
          
          bot.api.chat.update({
            channel: event.channel, 
            ts: event.original_message.ts, 
            attachments: card.attachments
          }, function(err, updated) {
            
            if (saved.prisoner_decisions.length == saved.prisoner_players.length) {
              var obj = _.findWhere(saved.prisoner_time, { complete: false });
              setTimeout(function() {
                controller.trigger("prisoners_check", [bot, saved.id, obj]);
              }, 1000);
            }
            
          });
          
        });
      });
      
    });
  });
    
  controller.on('prisoners_check', function(bot, id, timeObj) {
      
    controller.storage.teams.get(id, function(err, team) {
      var web = new WebClient(team.bot.app_token);
      var usersToKick = [];
      var thread = "default";
      var blockers = _.where(team.prisoner_decisions, { choice: "block" });
      var stealers = _.where(team.prisoner_decisions, { choice: "steal" });
      var sharers = _.where(team.prisoner_decisions, { choice: "share" });

      if((blockers.length > 0 && stealers.length > 0) || stealers.length == team.prisoner_players.length) {
        thread = "steal_kick";
        _.each(stealers, b => {
          usersToKick.push(b.user);
        });
      }

      if(blockers.length > 0 && stealers.length <= 0) {
        thread = "block_kick";
        _.each(blockers, b => {
          usersToKick.push(b.user);
        });
      }

      // Kick out sharers if anyone stole without being blocked
      if(blockers.length <= 0 && stealers.length >= 1) {
        thread = "share_kick";
        _.each(sharers, b => {
          usersToKick.push(b.user);
        });
      }
      
      // If everyone shared, count up for success
      if(blockers.length <= 0 && stealers.length <= 0) {
        team.prisoner_success++;
        thread = "success_count";
        
        // If players have shared 3 times in a row, send them to the finish 
        if (team.prisoner_success == 3) {
          thread = "success";
          team.prisoner_complete = true;
        }
      } else {
        // Reset prisoner success if not everyone shared
        team.prisoner_success = 0;
      }

      // Set this time object to be complete
      team.prisoner_time = _.map(team.prisoner_time, function(time) {
        if (time.num == timeObj.num)
          time.complete = true;

        return time;

      });
      
      // Save the determined thread for after players review responses
      team.prisoner_thread = thread;

      controller.storage.teams.save(team, function(err, saved) {

        // Determine and define players to kick out
        saved.just_kicked = _.filter(saved.prisoner_players, function(player) {
          return usersToKick.includes(player.userId);
        });

        controller.storage.teams.save(saved, function(err, updated) {
                    
          // Send feedback message with player responses
          setTimeout(function() {
            
            controller.prisoners_message(bot, updated.id, "decisions");

          }, 10000);
          
        });
        
      });

    });
    
  });
  
  // Keep track of which players are ready to move on 
  controller.prisoners_next = function(bot, event, team) {
    
    var attachments = event.original_message.attachments;
    // Remove "Got it!" button and replace with text
    delete attachments[1].actions;
    attachments[1].title = "Cool! Now just waiting for the other players...";

    // Set this player to be ready to move on
    team.prisoner_players = _.map(team.prisoner_players, function(u) {
      if (u.userId == event.user) 
        u.prisoner_ready = true;
      
      return u;
    });
    
    controller.storage.teams.save(team, function(err, saved) {
      
      bot.api.chat.update({
        channel: event.channel, 
        ts: event.original_message.ts, 
        attachments: event.original_message.attachments
      }, function(err, updated) { console.log(err, updated) });

      // If all players are ready, continue the game
      if (_.where(saved.prisoner_players, { "prisoner_ready": true }).length == saved.prisoner_players.length) {
        controller.prisoners_continue(bot, saved);
      }
    });
    
  };
  
  // Send along the prisoners to the next stage
  controller.prisoners_continue = function(bot, team) {
    
    // Reset prisoner players based on players that have been kicked out
    team.prisoner_players = _.filter(team.prisoner_players, function(player) {
      return !_.findWhere(team.just_kicked, { "userId": player.userId });
    });
    
    // Send the global response to all players based on saved thread
    _.each(team.prisoner_players, function(user) {
          
      var token = bot.config.token ? bot.config.token : bot.config.bot.token;

      // Delete most recent message
      controller.deleteHistoryRecent(user.bot_chat, token, function() {

        controller.studio.get(bot, "prisoners_dilemma", user.userId, user.bot_chat).then(convo => {

          // Send players to saved thread
          convo.changeTopic(team.prisoner_thread);

          // If this is a success thread
          // tell players how many more times they need to all share
          if (team.prisoner_thread.includes('success'))
            convo.setVar('shares', 3 - parseInt(team.prisoner_success));

          convo.activate();

        });

      });

    });
    
    controller.storage.teams.save(team, function(err, saved) {
      
      setTimeout(function() {
        // Kick out players
        if (team.just_kicked.length > 0)
          controller.prisoners_message(bot, team.id, "kicked");
        
        if (saved.prisoner_complete) return;
        // Only if prisoners dilemma is not complete

        // Send remaining players to next round 
        if (team.prisoner_players.length >= 1) {
          controller.prisoners_message(bot, team.id, "default");
          controller.addTime(bot, team.id);
        }
        
        
      }, 5000);
      
      
    });
    
  }
    
 
}

