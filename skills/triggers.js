

// Catches or evaluates certain triggers for dev and other purposes
module.exports = function(controller) {

  controller.on('message_received', function(bot, message) {

    if (process.env.environment == 'dev') {
      controller.studio.runTrigger(bot, message.text, message.address, message.channel).catch(function (err) {
       bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + err);
      });
    }

  });
}
