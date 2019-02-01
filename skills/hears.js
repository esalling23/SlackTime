

/*

WHAT IS THIS?

This module demonstrates simple uses of Botkit's `hears` handler functions.

In these examples, Botkit is configured to listen for certain phrases, and then
respond immediately with a single line response.

*/

const wordfilter = require('wordfilter')
const _ = require("underscore")
const dataChannel
const fs = require('fs')

const { WebClient, RTMClient } = require('@slack/client')

// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.slackToken


module.exports = function(controller) {

  controller.hears('flavor_flave', 'direct_message', function(bot, message) {

    const botChannels = {}

    if (message.match[0] != "flavor_flave") return

    controller.storage.teams.get(message.team, function(err, team) {

       _.each(team.users, function(user) {

          bot.api.im.open({ user: user.userId }, function(err, direct_message) {

            botChannels[user.userId] = direct_message.channel.id

            console.log("onboarding this player", user)

            if (err) {
              console.log('Error sending onboarding message:', err)
            } else {
              controller.studio.get(bot, 'onboarding', user.userId, direct_message.channel.id).then(convo => {

                const template = convo.threads.default[0]
                template.username = process.env.username
                template.icon_url = process.env.icon_url

                convo.setconst("team", team.id)
                convo.setconst("user", user.userId)

                convo.activate()

              }).catch(function(err) {
                console.log('Error: encountered an error loading onboarding script from Botkit Studio:', err)
              })

            }

          })

       })

       setTimeout(function() {
         team.gameStarted = true

         team.users = _.map(team.users, function(u) {

           u.bot_chat = botChannels[u.userId]
           u.startBtns = ["danger", "primary", "default"]
           return u

         })

         controller.storage.teams.save(team, function(err, saved) {
            console.log(saved)
        })


       }, 1000 * team.users.length)

    })

  })

  // Grab players who have DM open with bot
  controller.hears('chat', 'direct_message', function(bot,message) {
    if (process.env.environment != 'dev') return
    controller.storage.teams.get(message.team, function(err, team) {
      const web = new WebClient(team.bot.token)

      web.conversations.list({types: "im"}).then(res => {
        team.users = _.map(res.channels, function(im) {
          console.log(im)
          const user = _.findWhere(team.users, { userId: im.user })
          if (im.is_im && user) {
            user.bot_chat = im.id
            return user
          }
        })

        team.users = _.filter(team.users, function(user) { return user != null })

        controller.storage.teams.save(team, function(err, saved) {
          console.log(saved, "saved team")
        })

      }).catch(err => console.log('im list error: ' + err))

    })

  })

  // Clear bot message history
  controller.hears('clear', 'direct_message', function(bot,message) {
    if (process.env.environment != 'dev') return
    controller.storage.teams.get(message.team, function(err, team) {
      const web = new WebClient(bot.config.bot.token)

      web.conversations.history(message.channel).then(res => {
        _.each(res.messages, function(ms) {
          const web = new WebClient(team.bot.app_token)
          setTimeout(function() {
            web.chat.delete(ms.ts, message.channel).then(res => {
              console.log(res)
            }).catch(err => console.log(err))
          }, 500 * res.messages.indexOf(ms))
        })
      }).catch(err => console.log(err))

    })


  })

  // Generate game data
  controller.hears("^generate (.*)", 'direct_message,direct_mention', function(bot, message) {

    if (process.env.environment != 'dev') return
    console.log(message, "in the hears")
    const options = {
      bot: bot,
      message: message,
      forced: true
    }

    // if the message is "generate player" then generate player data
    if (message.match[0] == "generate player") {
      options.player = true
      controller.trigger('generation_event', [options])
    } else if (message.match[0] == "generate dev") {
      options.player = false
      // Otherwise, generate development data for each puzzle
      controller.trigger('generation_event', [options])
    } else {
      bot.reply(message, {
        'text': "Hmm.. please specify if you want to generate dev or player data!"
      })
    }

  })

  controller.hears("players_get", 'direct_message', function(bot, message) {
    if (message.match[0] != "players_get") return

    controller.storage.teams.get(message.team, function(err, team) {
      const web = new WebClient(bot.config.bot.token)
      const presentUsers = []

      web.users.list().then(res => {
        _.each(res.members, function(user) {
          if (controller.isUser(user, false)) {
            presentUsers.push({
              userId: user.id,
              name: user.name,
              email: user.profile.email,
              startBtns: ["default", "primary", "danger"]
            })
          }
        })

        team.users = presentUsers

        controller.storage.teams.save(team, function(err, saved) {
          console.log(saved.users)
        })
      })
    })
  })

  const deleteThisMsg = function(message, token) {
    const web = new WebClient(token)

    web.chat.delete(message.ts, message.channel).then(res => {
      console.log(res)
    }).catch(err => console.log(err))

  }

  const botReply = function(params) {

    console.log(params[0], params[1])

  }

}
