const _ = require("underscore")
const fs = require('fs')
const request = require('request')
const { WebClient } = require('@slack/client')

// Script for generation event
// Pulls scripts with a certain tag for team puzzle data

const team,
    user,
    channel

module.exports = function(controller) {

  controller.on("generation_event", function(options) {

    console.log(options.team, "in the generation")

    if (options.user) user = options.user
    if (options.channel) channel = options.channel
    if (options.team) team = options.team.id

    if (!channel) channel = options.message.channel
    if (!user) user = options.message.user
    if (!team) team = options.message.team

    console.log(team)
    controller.storage.teams.get(team, function(err, teamData) {

      console.log(teamData, "is the gotten team" )

      if (teamData.puzzles) delete teamData.puzzles

      teamData.gameStarted = true
      teamData.entered = false

      teamData.currentState = 'default'
      teamData.events = []
      teamData.movements = [0]
      teamData.codesEntered = []
      teamData.users = []
      teamData.phasesUnlocked = ["phase_1"]

      teamData.gamelog = {}

      for (const i = 0; i < 5; i++) {
        const phase = "phase_" + (i+1)
        teamData.gamelog[phase] = []
      }

      // add users array
      const web = new WebClient(teamData.bot.app_token)

        web.users.list().then(res => {
          _.each(res.members, function(user) {
            if (controller.isUser(user, false)) {
              teamData.users.push({
                userId: user.id,
                name: user.name,
                email: user.profile.email,
                startBtns: ["default", "primary", "danger"]
              })
            }
          })

          // Set the team puzzles to the generated puzzles array
          if (err) {
            console.log("There was an error: ", err)
          }

          setTimeout(function() {
            // Check the team to make sure it was updated
            // Team should have a puzzles object now attached

              if (options.forced) {
                options.bot.reply(options.message, {
                  'text': "Nice, you have updated your team's puzzles with completely fresh data!"
                })
              }

            const bot_channels = {}

             _.each(teamData.users, function(user) {

               console.log(user)

                options.bot.api.im.open({ user: user.userId }, function(err, direct_message) {

                  console.log(err, direct_message)
                  console.log(direct_message, "opened the onboarding message")

                  if (err) {
                    console.log('Error sending onboarding message:', err)
                  } else {
                    bot_channels[user.userId] = direct_message.channel.id

                    // console.log(user.id)
                    controller.studio.get(options.bot, 'onboarding', user.userId, direct_message.channel.id).then(convo => {

                      const template = convo.threads.default[0]
                      template.username = process.env.username
                      template.icon_url = process.env.icon_url

                      convo.setconst("team", teamData.id)
                      convo.setconst("user", user.userId)

                      convo.activate()

                    })

                  }

                })

              })


              setTimeout(function() {

                // Store bot channel
                teamData.users = _.map(teamData.users, function(user) {

                  user.bot_chat = bot_channels[user.userId]

                  return user
                })

                controller.storage.teams.save(teamData, function(err, saved) {

                  controller.trigger('gamelog_update', [{bot: options.bot, team: saved}])

                  console.log(err, saved)

                })

              }, 2000 * teamData.users.length + 1)

          }, 1000)

      })
    }) // End team get
  }) // End on event
}
