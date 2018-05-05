const _ = require("underscore");

module.exports = function(controller) {
   
  controller.gamelogMessage = function(bot, team) {
    
    var user = bot.config.createdBy;
    
    var unlockedStages = _.map(team.phasesUnlocked, function(stage) { 
      return parseInt(stage.split("_")[1]);
    });
        
    controller.studio.get(bot, "gamelog", user, team.gamelog_channel_id).then(function(convo) {
        // console.log(convo);        
      convo.changeTopic("default");

      var template = convo.threads.default[0];
      
      var attachments = _.filter(template.attachments, function(att) {
        var id = template.attachments.indexOf(att);
        
        if (id == 0) {
          var url = "http://res.cloudinary.com/extraludic/image/upload/v1/node-maps/nodemap_";
          
          var nodestep = team.movements.length == 0 ? 0 : _.max(team.movements, function(node){ return node; });
          
          url += nodestep;
          
          if (nodestep > 0)
            url += ".1.png";
          else 
            url += ".png";
          
          att.image_url = url;
          return att;
        } else if (id == 1) {
          console.log("video channel");
          return att;
        } else if (unlockedStages.includes(id - 1)) {
          // do stuff to the text?
          att.text = controller.gamelogRefresh(id - 1, team);
          console.log(att);
          return att;

        } 
        
        
      });
      
      template.attachments = attachments;

      convo.activate();

    }).catch(function(err) {
        console.error('gamelog error: ', err);
    });
  }
}