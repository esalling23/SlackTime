const _ = require('underscore');
const { WebClient } = require('@slack/client');

module.exports = function(controller) {
  
  controller.on('gamelog_update', function(params) {
    
    console.log(params, "LETS UPDATE THE GAME LOG");
    // WHAT KIND OF UPDATE
    var bot = params.bot;
    var teamId = params.team;
    var userId = params.player ? params.player : params.event.user;
    console.log(userId);
    
    if (teamId.id) teamId = teamId.id
    
    controller.storage.teams.get(teamId, function(err, res) {
      
      if (!bot)
        bot = controller.spawn(res.bot);
      
      var web = new WebClient(res.oauth_token);
      
      var thisUser = _.findWhere(res.users, { userId: userId });
      
      web.groups.history(res.gamelog_channel_id).then(group => {
        
        var gamelogMsg = _.filter(group.messages, function(msg) {
          return !msg.subtype;
        })[0];
                
        if (params.codeType && params.puzzle) {
          res.gamelog[params.phase].push({
            event: { type: params.codeType, puzzle: params.puzzle },
            unlockedBy: thisUser,
            date: new Date()
          });
        }
        
        bot.api.chat.delete({
          channel: res.gamelog_channel_id, 
          ts: gamelogMsg.ts
        }, function(err, deleted) {
          
          controller.storage.teams.save(res, function(err, saved) {
             controller.gamelogMessage(bot, { user: thisUser.userId, channel: saved.gamelog_channel_id }, saved);
          });
        });
        
      });

    });
    
  });
 
}