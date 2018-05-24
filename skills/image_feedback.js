const _ = require("underscore");

module.exports = function(controller) {
  
  controller.imageFeedback = function(bot, message, channel, team) {
    controller.studio.get(bot, "image_tag", message.user, channel).then(convo => {

      convo.changeTopic("thanks");

      var template = convo.threads["thanks"][0];
      
      template.username = process.env.username;
      template.icon_url = process.env.icon_url;

      convo.vars.mit = _.where(team.uploadedImages, { location: "mit" }).length;
      convo.vars.bpl = _.where(team.uploadedImages, { location: "bpl" }).length;
      convo.vars.aquarium = _.where(team.uploadedImages, { location: "aquarium" }).length;

      _.each(template.attachments, function(a) {
        if (template.attachments.indexOf(a) == 0) {
          a.color = "bcbcbc";
        } else {
          var l = _.where(team.uploadedImages, { location: a.fallback }).length;
          if (l == 0)
            a.color = "ff2600";
          else if (l > 0 && l < 6)
            a.color = "ffb900";
          else 
            a.color = "00f900";
        }
      });

      convo.activate();
      
    });
  }
  
  controller.imageTag = function(bot, message, url) {

    // upon image upload, show menu asking for player to tag the image location
    controller.studio.get(bot, "image_tag", message.user, message.channel).then(convo => {
      
      var template = convo.threads.default[0];

      template.attachments[0].image_url = url;
      template.username = process.env.username;
      template.icon_url = process.env.icon_url;

      convo.activate();

    });
    
  }
  
  controller.imageAlbum = function(bot, message, team) {
    controller.studio.get(bot, "image_tag_album", message.user, message.channel).then(convo => {

      convo.changeTopic('default');
      var template = convo.threads['default'][0];
      
      template.username = process.env.username;
      template.icon_url = process.env.icon_url;
      
      var images = _.filter(team.uploadedImages, function(img) { return img.location });
      var url;
      
      if (images.length > 0) 
        url = images[0].url;
      else 
        url = "http://res.cloudinary.com/extraludic/image/upload/v1525385203/escape-room/No-Image-Placeholder.jpg";
      
      template.attachments[0].image_url = url;
      
      _.each(template.attachments[0].actions, function(btn) {
        if (images.length > 1) 
          btn.name = "picture";
        else 
          btn.name = "";
      });
      
      template.attachments[0].text = "Location: " + images[0].location;

      convo.activate();

    });
  }
}