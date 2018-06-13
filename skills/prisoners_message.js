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

      team.prisoner_decisions = [];
      if (team.prisoner_players.length == 1) thread = 'success_alone';

      controller.storage.teams.save(team, function(err, saved) {

        _.each(players, function(user) {

          web.conversations.history(user.bot_chat).then(function(ims) {
            console.log(ims);
            console.log(ims.messages);
            var message = ims.messages[0];

            if (!message)
              return;

            message.channel = user.bot_chat;

            controller.makeCard(bot, message, "prisoners_dilemma", thread, {}, function(card) {

              console.log(message, card);
              
              bot.api.chat.update({
                channel: message.channel, 
                ts: message.ts, 
                attachments: card.attachments
              }, function(err, updated) {
                
                console.log(err, updated);

                // controller.store_prisoners_msg(updated, user, team);

              });

            });

          }).catch(err => console.log("conversation history error: ", err));

        });

      });

    });
  }
}