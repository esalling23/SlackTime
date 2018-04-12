const _ = require("underscore");

module.exports = function(controller) {
   
  controller.gamelogMessage = function(bot, context, team) {
    
    var unlockedStages = _.map(team.phasesUnlocked, function(stage) { 
      return parseInt(stage.split("_")[1]);
    });
        
    controller.studio.get(bot, "gamelog", context.user, context.channel).then(function(convo) {
        // console.log(convo);        
      convo.changeTopic("default");

      var template = convo.threads.default[0];
      
      var attachments = _.filter(template.attachments, function(att) {
        var id = template.attachments.indexOf(att);
        
        if (unlockedStages.includes(id)) {
          // do stuff to the text?
          att.text = controller.gamelogRefresh(id, team);
          console.log(att);

          return att;
        } else if (id == 0) 
          return att;
        
      });
      
      template.attachments = attachments;

      convo.activate();

    }).catch(function(err) {
        console.error('gamelog error: ', err);
    });
  }
}