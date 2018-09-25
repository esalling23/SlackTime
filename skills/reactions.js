const _ = require('underscore');
const { WebClient } = require('@slack/client');

module.exports = function(controller) {


  controller.on('reaction_added', function(bot, event) {
    console.log(event);
    controller.dataStore(bot, event, "chat").catch(err => console.log("reaction added data store error: ", err));
  });

  controller.on('reaction_removed', function(bot, event) {
    console.log(event);
    controller.dataStore(bot, event, "chat").catch(err => console.log("reaction removed data store error: ", err));
  });

  controller.on('dnd_updated_user', function(bot, event) {
    console.log(event);
    controller.dataStore(bot, event, "dnd").catch(err => console.log("reaction removed data store error: ", err));
  });

  controller.findRelatedMsg = function(bot, message, token) {

    // early exit if the message is null
    if (!message.ts) return new Promise((resolve, reject) => { resolve(undefined); });
    
    var ts = message.ts;
    return controller.storage.chat.find({ ts: ts }).then(m => {
      return m ? m[0] : undefined;
    });
  }
}
