const _ = require("underscore");
const { WebClient } = require('@slack/client');

module.exports = function(controller) {
  
  // A player responds to the prisoners dilemma
  controller.on('prisoners_selection', function(bot, event) {
    var choice = event.actions[0].value;
    
    controller.storage.teams.get(event.team.id, function(err, team) {
      if (!team.prisoner_success) team.prisoner_success = 0;
      if (!team.prisoner_players) team.prisoner_players = _.where(team.users, { prisoner: true });
            
      var thisUser = _.findWhere(team.users, { userId: event.user });

      // If there's already a choice stored for this player, return
      if (team.prisoner_decisions[thisUser.userId].choice) return;

      team.prisoner_decisions[thisUser.userId].choice = choice;
      
      controller.storage.teams.save(team, function(err, saved) {
        
        var vars = {
          prisoner_decisions: saved.prisoner_decisions
        }
        
        // Follow up message
        controller.makeCard(bot, event, "prisoners_dilemma", "follow_up", vars, function(card) {
          
          bot.api.chat.update({
            channel: event.channel, 
            ts: event.original_message.ts, 
            attachments: card.attachments
          }, function(err, updated) {
            
            // Trigger update message for all players
            controller.prisoners_update(bot, saved, event, "feedback");
            
            var decisions = _.filter(saved.prisoner_decisions, function(d) {
              return d.choice;
            });
            
            // If all players have decided, move on to the check
            if (decisions.length == saved.prisoner_players.length) {
              setTimeout(function() {
                controller.trigger("prisoners_check", [bot, saved.id]);
              }, 1000);
            }
            
          });
          
        });
      });
      
    });
  });
    
  // Check players responses 
  controller.on('prisoners_check', function(bot, id) {
      
    controller.storage.teams.get(id, function(err, team) {
      var web = new WebClient(team.bot.app_token);
      var usersToKick = [];
      var thread = "default";
      // Define the groups of player's choices
      var blockers = _.where(team.prisoner_decisions, { choice: "block" });
      var stealers = _.where(team.prisoner_decisions, { choice: "steal" });
      var sharers = _.where(team.prisoner_decisions, { choice: "share" });

      // If no blockers or stealers, or 100% of players stole
      // Kick out stealers
      if((blockers.length > 0 && stealers.length > 0) || stealers.length == team.prisoner_players.length) {
        thread = "steal_kick";
        _.each(stealers, (b) => {
          usersToKick.push(_.findKey(team.prisoner_decisions, { name: b.name }));
        });
      }

      // If no stealers but someone blocked
      // Kick out blockers
      if(blockers.length > 0 && stealers.length <= 0) {
        thread = "block_kick";
        _.each(blockers, (b) => {
          usersToKick.push(_.findKey(team.prisoner_decisions, { name: b.name }));
        });
      }

      // If anyone stole without being blocked
      // Kick out sharers
      if((blockers.length <= 0 && stealers.length >= 1) && stealers.length < team.prisoner_decisions.length) {
        thread = "share_kick";
        _.each(sharers, (b) => {
          usersToKick.push(_.findKey(team.prisoner_decisions, { name: b.name }));
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
      
      // If any users are being kicked we want to store prisoner_eliminate as true
      // This determines end-of-game video 
      if (usersToKick.length > 0 && !team.prisoner_eliminate) 
        team.prisoner_eliminate = true;
      
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

          }, 5000);
          
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
    
    
    // Reset prisoner players based on players that have been kicked out
    team.prisoner_players = _.filter(team.prisoner_players, function(player) {
      return !_.findWhere(team.just_kicked, { "userId": player.userId });
    }).map(function(player) {
      // reset player ready status for next round
      player.prisoner_ready = false;
      return player;
    });
    
    // Reset choices and store kicked players
    team.prisoner_decisions = _.mapObject(team.prisoner_decisions, function(d, k) {
      d.choice = undefined;
      
      if (_.pluck(team.just_kicked, "userId").includes(k)) d.kicked = true;
      
      return d;
    });
    
    controller.storage.teams.save(team, function(err, saved) {
      
      setTimeout(function() {
        // Kick out players
        if (team.just_kicked.length > 0)
          controller.prisoners_message(bot, saved.id, "kicked");
        
        // Send remaining players to next round 
        if (saved.prisoner_players.length >= 1 && !saved.prisoner_complete) {
          controller.prisoners_message(bot, saved.id, "default");
        }
        
        if (team.prisoner_players.length < 1 || saved.prisoner_complete) {
          setTimeout(function() {
            
            // If prisoners dilemma is over, send final message
            controller.prisoners_message(bot, saved.id, "end");
            
          }, 15000);
        } 
          
                  
        
      }, 5000);
      
      
    });
    
  }
    
 
}

