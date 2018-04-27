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
                 node: findNode(script),
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
               // console.log(content);
             }
             num ++;
           });
           // console.log(num, Object.keys(convo.threads).length);
           if (num == Object.keys(convo.threads).length) 
             count ++;
           
           
         });
        
      });

      
     // console.log(count, list.length);
     setTimeout(function() {
                    // console.log(json);
        json = _.sortBy(json, "node");
              json = JSON.stringify(json, null, 4);

       fs.writeFile("tester.json", json, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file was saved!");
       }); 
     }, 5000)
      
    });
  });
}

var findNode = function(script) {
  
  var phase = _.filter(script.tags, function(tag) {
    return tag.includes('phase');
  })[0];
  
  var node = parseInt(phase.split("_")[1]);
  
  if (node > 1) {
    node = node + 2;
  } else {
    if (script.name.includes("nodes"))
      node = parseInt(script.name.split("_")[2]);
    else if (script.name == "safe")
      node = 2;
    else 
      node = 3;
  }
  
  return node;
  
}