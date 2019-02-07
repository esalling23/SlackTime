const _ = require('underscore')
const {
  WebClient
} = require('@slack/client')
// Catches or evaluates certain triggers for dev and other purposes
module.exports = function (controller) {
  controller.secretTriggers = function (trigger, returnTrigger) {
    const secrets = {
      'input_nodes_1': 'iELOMU5N$dPkvbP7x0E$wD$s',
      'tamagotchi_room': '#tDh7J$VdJW0OgoV3RxtXmfD',
      'aris_room': '&nSyJf@0A45mVB0#^ZAr&6uf',
      'prisoners_room': '$vjOBvBA0Im$d4g!6kE%vrUG'
    }

    if (returnTrigger) {
      return Object.keys(secrets).map(function (key) {
        return secrets[key]
      }).includes(trigger)
    } else {
      return _.invert(secrets)[trigger]
    }
  }

  controller.on('direct_message', function (bot, message) {
    if (process.env.environment === 'dev' || controller.secretTriggers(message.text.split(' ')[0], true)) {
      if (message.text.split(' ')[1] === 'all') {
        const script = controller.secretTriggers(message.text.split(' ')[0], false)

        controller.storage.getTeam(message.team, function (error, team) {
          if (error) return
          const web = new WebClient(team.bot.app_token)

          _.each(team.users, function (user) {
            if (user.userId !== message.user) {
              controller.findRecentMessages(web, user.bot_chat).then(res => {
                res.msg.channel = user.bot_chat
                res.msg.user = user.userId

                controller.makeCard(bot, event, script, 'default', {}, function (card) {
                  bot.api.chat.update({
                    channel: event.channel,
                    ts: event.original_message.ts,
                    attachments: card.attachments
                  }, function (error, updated) {
                    if (error) return
                    console.log('this user was just sent to a place: ', updated)
                  })
                })
              }).catch(error => console.log('error in find recent messages', error))
            } else {
              controller.studio.runTrigger(bot, message.text.split(' ')[0], message.user, message.channel, message).catch(function (error) {
                bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + error)
              })
            }
          })
        })
      } else {
        controller.studio.runTrigger(bot, message.text, message.user, message.channel, message).catch(function (error) {
          bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + error)
        })
      }
    }
  })
}
