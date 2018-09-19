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

    var ts = message.ts;

    if (!message.relatedMsgToBeFound) return;

    return controller.storage.chat.all().then(list => {
      return _.findWhere(list, { ts: ts });
    });

  }

}
