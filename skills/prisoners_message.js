const _ = require("underscore");
const { WebClient } = require('@slack/client');

module.exports = function(controller) {
  
  controller.store_prisoners_msg = function(message, user, team) {
    var exists = _.findWhere(team.prisoners_messages, { user: user.userId });
    var channel = user.bot_chat;
    if (exists) {
      team.prisoners_messages = _.map(team.prisoners_messages, function(msg) {
        if (msg.user == user.userId) {
          msg = message;
          msg.channel = channel;
          msg.user =  user.userId;
          msg.team_id = team.id;
        } 

        return msg;
      });
    } else {
      var msg = message;
      msg.channel = channel;
      msg.user = user.userId;
      msg.team_id = team.id;
      team.prisoners_messages.push(msg);
    }

    controller.storage.teams.save(team, function(err, saved) {
      console.log("saved a prisoner message: ", saved.prisoners_messages);
    });
  }
  
  
  
  controller.prisoners_message = function(bot, id, thread) {
      
    controller.storage.teams.get(id, function(err, team) {
      var token = bot.config.token ? bot.config.token : bot.config.bot.token;
      var web = new WebClient(token);
      
      // Determine which players object to use based on thread
      var players = ((thread) => { 
        switch(thread) {
          case 'kicked':
            return team.just_kicked;
          case 'times_up': 
            return team.times_up;
          case 'end': 
            return _.where(team.users, { prisoner: true });
          default:
            return team.prisoner_players;
        }})(thread);
      
      var vars = {};
        
      // If this is the decisions or follow_up thread
      // Set decisions object on card vars
      if (thread == "decisions" || thread == "follow_up") {
        vars.prisoner_decisions = team.prisoner_decisions;
      }
      
      // If this is supposed to be a new round but only one player remains
      // Set thread to success_alone and prisoners_complete to true
      if (team.prisoner_players.length == 1 && thread == "default"){
        thread = 'success_alone';
        team.prisoner_complete = true;
      }
      
      // If this is the end thread, set winner variables
      if (thread == "end") {
        vars.prisoners_winners = team.prisoner_players;
        vars.prisoners_link = "https://escape-room-production.glitch.me/link/";
        
        if (team.prisoner_eliminate)
          vars.prisoners_link += "prisoners_eliminate";
        else 
          vars.prisoners_link += "prisoners_share";
      }

      controller.storage.teams.save(team, function(err, saved) {

        _.each(players, function(user) {
          
          if (vars.prisoners_link) {
            vars.user = user.userId;
            vars.team = saved.id;
          }

          // Find user chat history with bot
          web.conversations.history(user.bot_chat).then(function(ims) {
            
            var message = ims.messages[0];

            if (!message)
              return;

            // Set message channel to user's set bot_chat
            message.channel = user.bot_chat;
            
            // Make the prisoners_dilemma card
            controller.makeCard(bot, message, "prisoners_dilemma", thread, vars, function(card) {
              
              bot.api.chat.update({
                channel: message.channel, 
                ts: message.ts, 
                attachments: card.attachments
              }, function(err, updated) {
                console.log(err, updated);
                
                // Send end message in the case of last one standing
                if (thread == "success_alone"){
                  setTimeout(function() {
                                      
                    controller.prisoners_message(bot, saved.id, "end");

                  }, 8000);
                }
              });

            });

          }).catch(err => console.log("conversation history error: ", err));

        });

      });

    });
  }
  
  // Determine submissions to display for prisoners dilemma
  // RETURNS fields Array
  controller.prisoner_fields = function(players, type) {
    var fields = [];
    
    _.each(players, function(d) {
      // Set the value to be the players choice or the state of the prisoner
      var value = d.choice ? d.choice : d.prisoner;
      
      // If this is the follow_up thread
      // Set the value to be whether the player has made a choice
      if (type == "follow_up") {
        value = d.choice ? "Submitted" : "Not Submitted";
      } else if (type == "prison") {
        value = d.prisoner ? "Present" : "Not Present";
      }
            
      // If player was kicked, display that
      if (d.kicked) value = "Kicked";

      // Add the player name and defined value
      fields.push({
        title: d.name, 
        value: value
      });
    });
    
    return fields;
  }
  
  
  controller.prisoners_update = function(bot, team, event, type) {
    
    var web = new WebClient(bot.config.bot.token);

    web.conversations.list({ types: "im" }).then(function(list) {
      
      var players = team.prisoner_players;
      
      if (type == "feedback") {
        players = _.filter(team.prisoner_players, function(p) {
          return team.prisoner_decisions[p.userId].choice;
        });
      }
                    
      _.each(players, function(user) {
        
        if (user.userId != event.user) {
          console.log(user, " updating the prison for this player");

          var thisIM = _.findWhere(list.channels, { user: user.userId });
          var channel = thisIM.id;
          var thread = type == "prison" ? "default" : "follow_up";
          var script = type == "prison" ? "prisoners_room" : "prisoners_dilemma";

          web.conversations.history(channel).then(function(ims) {

            var btn_message = ims.messages[0];
            var vars = {};
            
            if (!btn_message)
              return;

            btn_message.channel = channel;

            if (type == "prison") {
              vars.prisoners_time = controller.prisoners_initial().toDateString();
              
              vars.prisoners_length = process.env.prisoners_players - _.where(team.users, { prisoner: true }).length; 
              vars.prisoners_users = team.users;
              vars.prisoners_started = team.prisoner_started;
                         
              if (vars.prisoners_length < 0) vars.prisoners_length = 0;

              if (vars.prisoners_length == 2 || !team.prisoner_time || team.prisoner_time.length <= 0) {
                setTimeout(function() {
                  controller.addTime(bot, team.id, true);
                }, 2000);
              }

            } else if (type == "feedback") {
              vars.prisoner_decisions = team.prisoner_decisions;
            }
            
            vars.link = true;
            vars.user = user.userId;
            vars.team = team.id;

            controller.makeCard(bot, btn_message, script, thread, vars, function(card) {
              bot.api.chat.update({
                channel: btn_message.channel, 
                ts: btn_message.ts, 
                attachments: card.attachments
              }, function(err, updated) {
                
              });
            });

          }).catch(err => console.log('history convo error: ', err));
        }

      });

    }).catch(err => console.log('convo list error: ', err));
  }
}