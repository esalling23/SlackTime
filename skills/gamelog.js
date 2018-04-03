const _ = require('underscore');
const { WebClient } = require('@slack/client');

module.exports = function(controller) {
  
  controller.on('gamelog_update', function(params) {
    
    console.log("LETS UPDATE THE GAME LOG");
    // WHAT KIND OF UPDATE
    var bot = params.bot;
    var team = params.team;
    
    var phase = params.phase;
    var player = params.player;
    var event = params.event;
    
    controller.storage.teams.get(team, function(err, res) {
      var web = new WebClient(res.oauth_token);
      
      var thisUser = _.findWhere(res.users, { userId : player }).name;
      
      web.groups.history(res.gamelog_channel_id).then(group => {
        
        var gamelogMsg = _.filter(group.messages, function(msg) {
          return !msg.subtype;
        })[0];
        
        var newLogMsg = thisUser + " solved the " + params.event + " puzzle\n";
        
        var attachments = gamelogMsg.attachments;
        var stage = parseInt(params.phase);
        var unlockedStages = _.map(team.stagesUnlocked, function(stage) { return parseInt(stage) });
        console.log(attachments, " are the gamelog attachments");
        
        attachments = _.filter(attachments, function(att) {
          if (unlockedStages.includes(stage)) {
            if (att.id == stage+1) {
              if (att.text == 'no puzzles solved') 
                att.text = newLogMsg;
              else 
                att.text += newLogMsg;
            }          
            console.log(att);

            return att;
          }
        });
        
        bot.api.chat.update({
          channel: res.gamelog_channel_id, 
          ts: gamelogMsg.ts, 
          text: "<!channel> someone did something!!",
          attachments: attachments
        }, function(err, updatedMsg) {
          console.log(updatedMsg);
        });
      });

    });
    
  });
  
}