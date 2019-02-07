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
    controller.store.getTeam(team.id)
      .then(storeTeam => {
        // reset data
        storeTeam.oauth_token = auth.access_token
        storeTeam.gameStarted = false
        storeTeam.entered = false
        storeTeam.currentState = 'default'
        storeTeam.events = []
        storeTeam.codesEntered = []
        // store
        controller.store.teams[team.id] = storeTeam
      })
      .then(web.users.list())
      .then((res) => {
        const storeTeam = controller.store.teams[team.id]
        // console.log(res)
        storeTeam.users = _.map(res.members, function (user) {
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

        controller.store.teams[team.id] = storeTeam
      })
      .catch((error) => console.log(error)) // End users.list call
  })
}
