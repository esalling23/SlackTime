const { WebClient } = require("@slack/client");
const _ = require("underscore");


module.exports = function(controller) {
  
  controller.deleteThisMsg = function(message, token, callback) {
    
    console.log(message, "we are deleting this");
    
    var ts = message.message_ts ? message.message_ts : message.ts;
    
    var web = new WebClient(token);
      
    web.chat.delete(ts, message.channel).then(res => {
      console.log(res, "deleted");
      if (callback)
        callback();
    }).catch(err => {
      console.log("delete error: ", err); 
      console.log("couldn't delete: ", message);
      if (callback)
        callback();
    });
  }
  
  controller.deleteHistory = function(channel, token, cb) {
    
    var count = 0;
    var num = 0;
    var web = new WebClient(token);
    
    web.conversations.history(channel).then(res => {
      _.each(res.messages, function(msg) {
        msg.channel = channel;
        setTimeout(function() {
          controller.deleteThisMsg(msg, token, function() {

            count++;

            if (count == res.messages.length && cb) 
              cb();
          });
        }, 500 * res.messages.indexOf(msg) + 1);
          
      });
    }).catch(err => console.log("history error: ", err));

    
  }
}