const _ = require('underscore')
const { WebClient } = require('@slack/client')

module.exports = function (controller) {
  controller.on('count_colors', function (bot, event, team) {
    const users = _.filter(team.users, function (user) {
      return !controller.ignoreEmails.includes(user.email)
    })

    const length = (users.length * 6) / 3
    let buttons = []

    _.each(users, function (user) {
      if (!user.startBtns || user.startBtns.length < 3) return
      buttons = buttons.concat(user.startBtns)
    })

    if (buttons.filter('danger') < length &&
          buttons.filter('primary') < length &&
            buttons.filter('') < length) return

    team.entered = true
    // If any of the button counts are >= to the given length
    // Set the game to be started
    controller.storage.teams.save(team, function (error, saved) {
      if (error) return
      const web = new WebClient(bot.config.bot.token)

      web.conversations.list({ types: 'im' }).then(function (list) {
        _.each(team.users, function (user) {
          const thisIM = _.findWhere(list.channels, { user: user.userId })
          const channel = thisIM.id

          web.conversations.history(channel).then(function (ims) {
            const btnMessage = ims.messages[0]

            if (!btnMessage || !btnMessage.attachments) return
            if (btnMessage.attachments[0].callback_id !== 'three_color_buttons') return

            btnMessage.channel = channel
            btnMessage.user = user.userId

            controller.makeCard(bot, btnMessage, 'the_room', 'default', {}, function (card) {
              bot.api.chat.update({
                channel: btnMessage.channel,
                ts: btnMessage.ts,
                attachments: card.attachments
              }, function (error, updated) {
                if (error) console.log(error)
              })
            })
          }).catch(error => console.log('conversation history error: ', error))
        })
      }).catch(error => console.log('im list error: ', error))
    })
  })
}
