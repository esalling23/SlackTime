
// Catches or evaluates certain triggers for dev and other purposes
module.exports = function(controller) {

  controller.secretTriggers = function(trigger) {
    var secrets = {
      "input_nodes_1": "iELOMU5N$dPkvbP7x0E$wD$s",
      "prisoner_room": "greedymother"
    };

    return Object.keys(secrets).map(function(key) {
      return secrets[key];
    }).includes(trigger);
  }

  controller.on('direct_message', function(bot, message) {

    if (process.env.environment == 'dev' || controller.secretTriggers(message.text)) {
      controller.studio.runTrigger(bot, message.text, message.user, message.channel, message).catch(function(err) {
       bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + err);
      });
    }

  });
}
