const _ = require("underscore");

module.exports = function(controller) {
  
  controller.dataStore = function(event, type, opt) {
    return new Promise((resolve, reject) => {
      var ObjectID = require('bson').ObjectID;

      var dataEvent = {
        id: new ObjectID(),
        team: event.team.id ? event.team.id : event.team, 
        user: event.user,
        channel: event.channel,
        time: new Date()
      }
      
      var dataType = "event";

      // console.log(event, event.raw_message);
      // console.log(event.original_message);

      if (type == "interactive" || type == "code") {
        var value = event.actions[0].value ? event.actions[0].value : event.actions[0].selected_options[0].value;
        var action = event.actions[0].name ? event.actions[0].name : event.actions[0].selected_options[0].name;
        
        var attachment = event.original_message.attachments[event.attachment_id - 1];
        var button;
        
        if (event.actions[0].selected_options)
          button = _.findWhere(_.findWhere(attachment.actions, { name: action }).options, { value: value });
        else 
          button = _.findWhere(attachment.actions, { value: value });

        dataEvent.type = event.actions[0].type;
        dataEvent.action = action;
        dataEvent.btnText = button.text;
        dataEvent.value = value;
        dataEvent.from = event.callback_id;
        if (dataEvent.action == "color") {
          var oldColor = button.style;
          dataEvent.oldColor = oldColor == "" ? "grey" : oldColor == "primary" ? "green" : "red";
          dataEvent.newColor = oldColor == "" ? "red" : oldColor == "primary" ? "grey" : "green";
        } else if (dataEvent.action == "letter") {
          
        }
      } else if (type == "chat") {
        dataEvent.message = event.text;
        dataEvent.type = event.type;
        
        if (event.file) {
          dataEvent.fileName = event.file.title;
          dataEvent.fileUrl = event.file.permalink;
        }
        
        dataType = "chat";
      } else if (type == "code") {
        dataEvent.code = opt.codeObj.code;
        dataEvent.correct = opt.codeObj.correct;
        dataEvent.type = opt.codeType;

        if (dataEvent.correct && opt.codeObj.puzzle) dataEvent.puzzle = opt.codeObj.puzzle;
      } else if (type == "download" || type == "link") {
        dataEvent.type = type;
        dataEvent.url = event.url;
      }

      controller.storage[dataType].save(dataEvent, function(err, saved) {
        console.log(err, saved, "SAVED!!");
        if (err)
          reject(err);
        else
          resolve(saved);
      });
    });
    
  };
  
}