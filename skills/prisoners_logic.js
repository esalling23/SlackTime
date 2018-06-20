const _ = require("underscore");
const { WebClient } = require('@slack/client');

module.exports = function(controller) {
  
  controller.on('prisoners_selection', function(bot, event) {
    var choice = event.actions[0].value;
    
    controller.storage.teams.get(event.team.id, function(err, team) {
      if (!team.prisoner_success) team.prisoner_success = 0;
      if (!team.prisoner_players) team.prisoner_players = _.where(team.users, { prisoner: true });
      
      if (_.pluck(team.prisoner_decisions, "user").includes(event.user)) return;

      team.prisoner_decisions.push({ user: event.user, choice: choice });
      
      controller.storage.teams.save(team, function(err, saved) {
        controller.makeCard(bot, event, "prisoners_dilemma", "follow_up", {}, function(card) {
          
          bot.api.chat.update({
            channel: event.channel, 
            ts: event.original_message.ts, 
            attachments: card.attachments
          }, function(err, updated) {
            
            if (saved.prisoner_decisions.length == saved.prisoner_players.length) {
              var obj = _.findWhere(saved.prisoners_time, { complete: false });
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

      if(blockers.length <= 0 && stealers.length > 0) {
        thread = "share_kick";
        _.each(sharers, b => {
          usersToKick.push(b.user);
        });
      }
      
      if(blockers.length <= 0 && stealers.length <= 0) {
        team.prisoner_success++;
        thread = "success_count";
        
        if (team.prisoner_success == 3) {
          thread = "success";
          team.prisoner_complete = true;
        }
      } else {
        team.prisoner_success = 0;
      }

      team.prisoner_time = _.map(team.prisoner_time, function(time) {
        if (time.num == timeObj.num)
          time.complete = true;

        return time;

      });

      controller.storage.teams.save(team, function(err, saved) {

        _.each(saved.prisoner_players, function(user) {
          
          var token = bot.config.token ? bot.config.token : bot.config.bot.token;

          controller.deleteHistoryRecent(user.bot_chat, token, function() {

            controller.studio.get(bot, "prisoners_dilemma", user.userId, user.bot_chat).then(convo => {

              convo.changeTopic(thread);
              
              if (thread.includes('success'))
                convo.setVar('shares', 3 - parseInt(team.prisoner_success));

              convo.activate();

            });

          });

        });

        saved.just_kicked = _.filter(saved.prisoner_players, function(player) {
          return usersToKick.includes(player.userId);
        });
        
        saved.prisoner_players = _.filter(saved.prisoner_players, function(player) {
          return !usersToKick.includes(player.userId);
        });

        controller.storage.teams.save(saved, function(err, updated) {
          
          if (updated.prisoner_complete) return;

          setTimeout(function() {

            if (updated.just_kicked.length > 0)
              controller.prisoners_message(bot, updated.id, "kicked");

            if (updated.prisoner_players.length >= 1)
              controller.prisoners_message(bot, updated.id, "default");
            
            controller.addTime(bot, updated.id);

          }, 4000);
          
        });
        
      });

    });
    
  });
  
 
}

