const _ = require('underscore')
const {
  WebClient
} = require('@slack/client')

let team
let channel
let user

// Script for generation event
// Pulls scripts with a certain tag for team puzzle data
module.exports = function (controller) {
  controller.on('generation_event', function (options) {
    console.log(options.team, 'in the generation')

    if (options.user) user = options.user
    if (options.channel) channel = options.channel
    if (options.team) team = options.team.id

    if (!channel) channel = options.message.channel
    if (!user) user = options.message.user
    if (!team) team = options.message.team

    console.log(team)
    controller.storage.teams.get(team, function (error, teamData) {
      console.log(teamData, 'is the gotten team')

      if (teamData.puzzles) delete teamData.puzzles

      teamData.gameStarted = true
      teamData.entered = false

      teamData.currentState = 'default'
      teamData.events = []
      teamData.movements = [0]
      teamData.codesEntered = []
      teamData.users = []
      teamData.phasesUnlocked = ['phase_1']

      teamData.gamelog = {}

      for (let i = 0; i < 5; i++) {
        const phase = 'phase_' + (i + 1)
        teamData.gamelog[phase] = []
      }

      // add users array
      const web = new WebClient(teamData.bot.app_token)

      web.users.list().then(res => {
        _.each(res.members, function (user) {
          if (controller.isUser(user, false)) {
            teamData.users.push({
              userId: user.id,
              name: user.name,
              email: user.profile.email,
              startBtns: ['default', 'primary', 'danger']
            })
          }
        })

        // Set the team puzzles to the generated puzzles array
        if (error) {
          console.log('There was an error: ', error)
        }

        setTimeout(function () {
          // Check the team to make sure it was updated
          // Team should have a puzzles object now attached
          if (options.forced) {
            options.bot.reply(options.message, {
              'text': 'Nice, you have updated your team\'s puzzles with completely fresh data!'
            })
          }

          const botChannels = {}

          _.each(teamData.users, function (user) {
            console.log(user)

            options.bot.api.im.open({
              user: user.userId
            }, function (error, directMessage) {
              console.log(error, directMessage)
              console.log(directMessage, 'opened the onboarding message')
              if (error) {
                console.log('error sending onboarding message:', error)
              } else {
                botChannels[user.userId] = directMessage.channel.id
                // console.log(user.id)
                controller.studio.get(options.bot, 'onboarding', user.userId, directMessage.channel.id).then(convo => {
                  const template = convo.threads.default[0]
                  template.username = process.env.username
                  template.icon_url = process.env.icon_url

                  convo.setconst('team', teamData.id)
                  convo.setconst('user', user.userId)

                  convo.activate()
                })
              }
            })
          })

          setTimeout(function () {
            // Store bot channel
            teamData.users = _.map(teamData.users, function (user) {
              user.botChat = botChannels[user.userId]
              return user
            })

            controller.storage.teams.save(teamData, function (error, saved) {
              controller.trigger('gamelog_update', [{
                bot: options.bot,
                team: saved
              }])

              console.log(error, saved)
            })
          }, 2000 * teamData.users.length + 1)
        }, 1000)
      })
    }) // End team get
  }) // End on event
}
