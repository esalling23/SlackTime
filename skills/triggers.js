
// Catches or evaluates certain triggers for dev and other purposes
module.exports = function(controller) {

  controller.secretTriggers = function(trigger, returnTrigger) {
    var secrets = {
      "input_nodes_1": "iELOMU5N$dPkvbP7x0E$wD$s",
      "prisoners_room": "greedymother"
    };

    return Object.keys(secrets).map(function(key) {
      if (returnTrigger)
        return secrets[key];
      else
        return key;
    }).includes(trigger);
  }

  controller.on('direct_message', function(bot, message) {

    if (process.env.environment == 'dev' || controller.secretTriggers(message.text.split(" ")[0], true))
    {
      if (message.text.split(" ")[1] == "all")
      {
        let script = controller.secretTriggers(message.text.split(" ")[0], false)
        controller.storage.teams.get(message.team, function(err, team) {
          _.each(team.users, function(user) {
            controller.findRecentMessages(web, user.bot_chat).then(res => {
              res.msg.channel = user.bot_chat;
              res.msg.user = user.userId;

              controller.makeCard(bot, event, script, "default", {}, function(card) {

                bot.api.chat.update({
                  channel: event.channel,
                  ts: event.original_message.ts,
                  attachments: card.attachments
                }, function(err, updated) {
                  console.log('this user was just sent to a place: ',  updated);
                });

              });

            }).catch(err => console.log('error in find recent messages', err));
          });
        });
      }
      else
      {
        controller.studio.runTrigger(bot, message.text, message.user, message.channel, message).catch(function(err) {
         bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + err);
        });
      }

    }

  });
}
