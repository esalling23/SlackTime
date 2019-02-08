const _ = require('underscore')
const { WebClient } = require('@slack/client')

module.exports = function (controller) {
  // game start trigger (user sent)
  controller.hears('gladis', 'direct_message', function (bot, message) {
    controller.store.getTeam(message.team)
      .then(team => {
        _.each(team.users, function (user) {
          controller.studio.get(bot, 'the_room', user.userId, user.botChat)
            .then(convo => {
              const template = convo.threads.default[0]
              template.username = process.env.username
              template.icon_url = process.env.icon_url

              convo.activate()
            }).catch(function (error) {
              console.log('error: encountered an error loading onboarding script from Botkit Studio:', error)
              // controller.studio.run(bot, 'fallback', user.userId, directMessage.channel.id)
            })
        })
      }).catch(console.error)
  })

  // onboarding trigger
  controller.hears('flavor_flave', 'direct_message', function (bot, message) {
    const botChannels = {}

    if (message.match[0] !== 'flavor_flave') return

    controller.store.getTeam(message.team)
      .then(team => {
        _.each(team.users, function (user) {
          bot.api.im.open({ user: user.userId }, function (error, directMessage) {
            if (error) return
            botChannels[user.userId] = directMessage.channel.id

            console.log('onboarding this player', user)

            if (error) {
              console.log('error sending onboarding message:', error)
            } else {
              controller.studio.get(bot, 'onboarding', user.userId, directMessage.channel.id)
                .then(convo => {
                  const template = convo.threads.default[0]
                  template.username = process.env.username
                  template.icon_url = process.env.icon_url

                  convo.setVar('team', team.id)
                  convo.setVar('user', user.userId)

                  convo.activate()
                }).catch(function (error) {
                  console.log('error: encountered an error loading onboarding script from Botkit Studio:', error)
                  // controller.studio.run(bot, 'fallback', user.userId, directMessage.channel.id)
                })
            }
          })
        })

        setTimeout(function () {
          team.gameStarted = true

          team.users = _.map(team.users, function (u) {
            u.botChat = botChannels[u.userId]
            u.startBtns = ['danger', 'primary', 'default']
            return u
          })
          controller.storage.teams.save(team, function (error, saved) {
            if (error) return
            console.log(saved)
          })
        }, 1000 * team.users.length)
      })
  })

  // Grab players who have DM open with bot
  controller.hears('chat', 'direct_message', function (bot, message) {
    if (process.env.environment !== 'dev') return
    controller.store.getTeam(message.team)
      .then(team => {
        const web = new WebClient(team.bot.token)

        web.conversations.list({types: 'im'}).then(res => {
          team.users = _.map(res.channels, function (im) {
            console.log(im)
            const user = _.findWhere(team.users, { userId: im.user })
            if (im.is_im && user) {
              user.bot_chat = im.id
              return user
            }
          })

          team.users = _.filter(team.users, function (user) { return user != null })

          controller.storage.teams.save(team, function (error, saved) {
            if (error) return
            console.log(saved, 'saved team')
          })
        }).catch(error => console.log('im list error: ' + error))
      })
  })

  // Clear bot message history
  controller.hears('clear', 'direct_message', function (bot, message) {
    if (process.env.environment !== 'dev') return
    controller.store.getTeam(message.team)
      .then(team => {
        const web = new WebClient(bot.config.bot.token)

        web.conversations.history(message.channel).then(res => {
          _.each(res.messages, function (ms) {
            const web = new WebClient(team.bot.app_token)
            setTimeout(function () {
              web.chat.delete(ms.ts, message.channel).then(res => {
                console.log(res)
              }).catch(error => console.log(error))
            }, 500 * res.messages.indexOf(ms))
          })
        }).catch(error => console.log(error))
      })
  })

  // Generate game data
  controller.hears('^generate (.*)', 'direct_message, direct_mention', function (bot, message) {
    // if (process.env.environment !== 'dev') return
    console.log(message, 'in the hears')
    
    controller.store.getTeam(message.team)
      .then(team => {

        const options = {
          bot: bot,
          message: message,
          team: team,
          forced: true
        }

        // if the message is 'generate player' then generate player data
        if (message.match[0] === 'generate player') {
          options.player = true
          controller.trigger('generation_event', [options])
        } else if (message.match[0] === 'generate dev') {
          options.player = false
          // Otherwise, generate development data for each puzzle
          controller.trigger('generation_event', [options])
        } else {
          bot.reply(message, {
            'text': 'Hmm.. please specify if you want to generate dev or player data!'
          })
        }
      })
  })

//   controller.hears('players_get', 'direct_message', function (bot, message) {
//     if (message.match[0] !== 'players_get') return

//     controller.storage.getTeam(message.team, function (error, team) {
//       if (error) return
//       const web = new WebClient(bot.config.bot.token)
//       const presentUsers = []

//       web.users.list().then(res => {
//         _.each(res.members, function (user) {
//           if (controller.isUser(user, false)) {
//             presentUsers.push({
//               userId: user.id,
//               name: user.name,
//               email: user.profile.email,
//               startBtns: ['default', 'primary', 'danger']
//             })
//           }
//         })

//         team.users = presentUsers

//         controller.storage.teams.save(team, function (error, saved) {
//           if (error) return
//           console.log(saved.users)
//         })
//       })
//     })
//   })
}
