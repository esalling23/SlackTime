const _ = require('underscore')

const {
  WebClient
} = require('@slack/client')

function isUser (member) {
  // console.log(member.name, 'is the member being checked')
  return member.is_bot || member.name === process.env.botName || member.name === 'slackbot'
}

module.exports = function (controller) {
  controller.on('onboard', function (bot, team, auth) {
    const web = new WebClient(auth.access_token)
    controller.store.teams.get(team.id, function (error, team) {
      if (error) return
      web.users.list().then((res) => {
        team.oauth_token = auth.access_token
        team.gameStarted = false
        team.entered = false
        // reset data
        team.currentState = 'default'
        team.events = []
        team.codesEntered = []
        // console.log(res)
        team.users = _.map(res.members, function (user) {
          if (isUser(user)) {
            const newUser = {
              userId: user.id,
              name: user.name,
              real_name: user.real_name,
              email: user.profile.email,
              startBtns: ['default', 'primary', 'danger']
            }
            return newUser
          }
        })

        controller.store.teams[team.id] = team
      }).catch((error) => console.log(error)) // End users.list call
    })
  })
}
