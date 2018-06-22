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
      var players = thread == "kicked" ? team.just_kicked : thread == "times_up" ? team.times_up : team.prisoner_players;
      
      var vars = {};
        
      if (thread == "decisions" || thread == "follow_up") {
        vars.decisions = team.prisoner_decisions;
        team.prisoner_decisions = _.map(team.prisoner_decisions, function(d) {
          d.choice = undefined;
          return d;
        });
      }

      if (team.prisoner_players.length == 1 && thread == "default"){
        thread = 'success_alone';
        team.prisoner_complete = true;
      }

      controller.storage.teams.save(team, function(err, saved) {

        _.each(players, function(user) {

          web.conversations.history(user.bot_chat).then(function(ims) {
            
            var message = ims.messages[0];

            if (!message)
              return;

            message.channel = user.bot_chat;
            
            controller.makeCard(bot, message, "prisoners_dilemma", thread, vars, function(card) {

              console.log(message, card);
              
              bot.api.chat.update({
                channel: message.channel, 
                ts: message.ts, 
                attachments: card.attachments
              }, function(err, updated) {
                
                console.log(err, updated);
                
              });

            });

          }).catch(err => console.log("conversation history error: ", err));

        });

      });

    });
  }
  
  controller.prisoner_decisions = function(decisions, type) {
    var fields = [];
    
    _.each(decisions, function(d) {
      var choice = d.choice;
      
      if (type == "follow_up") {
        choice = d.choice ? "Submitted" : "Not Submitted";
      } 
      
      fields.push({
        title: d.name, 
        value: choice
      });
    });
    
    return fields;
  }
  
  
  controller.prisoners_update = function(bot, team, event, type) {
    
    var web = new WebClient(bot.config.bot.token);

    web.conversations.list({ types: "im" }).then(function(list) {
                    
      _.each(_.where(team.users, { prisoner: true }), function(user) {
        if (user.userId != event.user) {
        console.log(user, " updating the prison for this player");

          var vars = {};
          var thisIM = _.findWhere(list.channels, { user: user.userId });
          var channel = thisIM.id;
          var thread = type == "prison" ? "default" : "follow_up";

          web.conversations.history(channel).then(function(ims) {

            var btn_message = ims.messages[0];

            if (!btn_message)
              return;

            btn_message.channel = channel;
            
            if (type == "prison") {
              var vars = {
                prisoners_time: controller.prisoners_initial().toDateString()
              };

              if (_.where(team.users, { prisoner: true }).length == 1 || !team.prisoner_time || team.prisoner_time.length <= 0) {
                setTimeout(function() {
                  controller.addTime(bot, team.id, true);
                }, 2000);
              }
              
              vars.prisoners = process.env.prisoners_players - _.where(team.users, { prisoner: true }).length; 
              vars.prisoners_started = team.prisoner_started;
                         
              if (vars.prisoners < 0) vars.prisoners = 0;

            } else if (type == "feedback") {
              vars.decisions = team.prisoner_decisions;
            }
            
            vars.link = true;
            vars.user = user.userId;
            vars.team = team.id;

            controller.makeCard(bot, btn_message, "prisoners_room", thread, vars, function(card) {
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