const _ = require('underscore');
const { WebClient } = require('@slack/client');

module.exports = function(controller) {
  
  controller.on('gamelog_update', function(params) {
    
    // console.log(params, "LETS UPDATE THE GAME LOG");
    // WHAT KIND OF UPDATE
    var bot = params.bot;
    var teamId = params.team;
    
    if (teamId.id) teamId = teamId.id
    
    controller.storage.teams.get(teamId, function(err, res) {
      
      if (!bot)
        bot = controller.spawn(res.bot);
      
      var web = new WebClient(res.oauth_token);
            
      web.groups.history(res.gamelog_channel_id).then(group => {
        
        if (group.messages.length > 1) {
          controller.deleteHistory(res.gamelog_channel_id, res.bot.app_token);
        }
        var gamelogMsg = group.messages[0];
                
        if (params.codeType && params.puzzle) {
          if (!res.gamelog[params.phase]) res.gamelog[params.phase] = [];
          if (!res.phasesUnlocked.includes(params.phase)) res.phasesUnlocked.push(params.phase);
          
          var userId = params.player ? params.player : params.event.user;
          var thisUser = _.findWhere(res.users, { userId: userId });

          console.log(userId);
          var event = { 
              type: params.codeType, 
              puzzle: params.puzzle,
              code: params.code
          }
          var repeat;
          _.each(res.gamelog[params.phase], function(log) {
            if (log.event.type == event.type && log.event.puzzle == event.puzzle)
              repeat = log;
          });
          
          if (!repeat) {
            res.gamelog[params.phase].push({
              event: event,
              unlockedBy: thisUser,
              date: new Date()
            });
          } else return;
        
          
        }
        
        if (!gamelogMsg) {
          controller.storage.teams.save(res, function(err, saved) {
             controller.gamelogMessage(bot, saved);
          });
        } else {
          bot.api.chat.delete({
            channel: res.gamelog_channel_id, 
            ts: gamelogMsg.ts
          }, function(err, deleted) {

            controller.storage.teams.save(res, function(err, saved) {
               controller.gamelogMessage(bot, saved);
            });
          });
        }
        
      });

    });
    
  });
 
}