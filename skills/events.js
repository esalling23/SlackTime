const _ = require('underscore')
const { WebClient } = require('@slack/client')

module.exports = function (controller) {
  controller.on('count_colors', function (bot, event, team) {
    const users = _.filter(team.users, function (user) {
      return !controller.ignoreEmails.includes(user.email)
    })

    const length = (users.length * 6) / 3

    let redCount = 0
    let greyCount = 0
    let greenCount = 0

    _.each(users, function (user) {
      console.log(user.startBtns, redCount)

      if (!user.startBtns || user.startBtns.length < 3) return

      _.each(user.startBtns, function (btn) {
        if (btn === 'danger') {
          redCount++
        } else if (btn === 'primary') {
          greenCount++
        } else {
          greyCount++
        }
        console.log('RedCount:' + redCount)
      })
    })

    if (redCount < length && greenCount < length && greyCount < length) return

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

            controller.makeCard(bot, btnMessage, 'input_nodes_1', 'default', {}, function (card) {
              bot.api.chat.update({
                channel: btnMessage.channel,
                ts: btnMessage.ts,
                attachments: card.attachments
              }, function (error, updated) {
                if (error) return
              })
            })
          }).catch(error => console.log('conversation history error: ', error))
        })
      }).catch(error => console.log('im list error: ', error))
    })
  })
}
