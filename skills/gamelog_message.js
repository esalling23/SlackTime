const _ = require("underscore");

module.exports = function(controller) {

  controller.gamelogMessage = function(bot, team) {

    var user = bot.config.createdBy;

    var unlockedStages = _.filter(team.phasesUnlocked, function(stage) {
      return stage != null;
    });

    unlockedStages = _.map(unlockedStages, function(stage) {
      return parseInt(stage.split("_")[1]);
    });

    controller.studio.get(bot, "gamelog", user, team.gamelog_channel_id).then(function(convo) {
        // console.log(convo);
      convo.changeTopic("default");

      var template = convo.threads.default[0];

      convo.setVar("team", team.id);

      template.username = process.env.username;
      template.icon_url = process.env.icon_url;

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
          // Return as-is
          return att;
        } else if (unlockedStages.includes(id - 1)) {
          // do stuff to the text?
          att.text = controller.gamelogRefresh(id - 1, team);
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
