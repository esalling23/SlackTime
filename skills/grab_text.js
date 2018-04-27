const _ = require("underscore");
const fs = require('fs');

module.exports = function(controller) {
  
  controller.on("grab_text", function(bot, message) {
    var json = [];
    var count = 0;
    controller.studio.getScripts().then(list => {
      
      _.each(list, function(script) {
        var num = 0;
         controller.studio.get(bot, script.name, message.user, message.channel).then(function(convo) {
           _.each(convo.threads, function(thread, v) {
             var attachments = thread[0].attachments;
             if (attachments.length > 0) {
               var content = {
                 script: script.name, 
                 thread: v, 
                 attachments: []
               }
               _.each(attachments, function(att) {
                 if (att.text != "") {
                   content.attachments.push({
                     num: attachments.indexOf(att), 
                     title: att.title, 
                     text: att.text
                   });
                 }
               });
               json.push(content);
             }
             num ++;
           });
           if (num == Object.keys(convo.threads).length) 
             count ++;
           
           if (count == list.length) {
             json = JSON.stringify(json, null, 4);
              fs.writeFile("test.json", json, function(err) {
                  if(err) {
                      return console.log(err);
                  }

                  console.log("The file was saved!");
              }); 
            }
           
         });
        
      });

      
    });
  });
}