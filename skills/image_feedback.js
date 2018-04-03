const _ = require("underscore");

module.exports = function(controller) {
  
  controller.imageFeedback = function(bot, message, channel, team) {
    controller.studio.get(bot, "image_tag", message.user, channel).then(convo => {

      convo.changeTopic("thanks");

      var template = convo.threads["thanks"][0];

      convo.vars.mit = _.where(team.uploadedImages, { location: "mit" }).length;
      convo.vars.bpl = _.where(team.uploadedImages, { location: "bpl" }).length;
      convo.vars.aquarium = _.where(team.uploadedImages, { location: "aquarium" }).length;

      _.each(template.attachments, function(a) {
        if (template.attachments.indexOf(a) == 0) {
          a.color = "bcbcbc"
        } else {
          var l = _.where(team.uploadedImages, { location: a.fallback }).length;
          if (l == 0)
            a.color = "ff2600";
          else if (l > 0 && l < 6)
            a.color = "fffb00";
          else 
            a.color = "00f900";
        }
      });

      convo.activate();
      

    });
  }
}