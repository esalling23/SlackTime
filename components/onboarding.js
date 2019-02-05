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
    controller.storage.teams.get(team.id, function (erroror, team) {
      if (erroror) return
      web.users.list().then((res) => {
        team.oauth_token = auth.access_token
        team.gameStarted = false
        team.entered = false
        // reset data
        team.users = []
        team.currentState = 'default'
        team.events = []
        team.codesEntered = []
        // console.log(res)
        _.each(res.members, function (user) {
          const thisUser = _.findWhere(team.users, {
            userId: user.id
          })

          if (isUser(user) && !thisUser) {
            team.users.push({
              userId: user.id,
              name: user.name,
              real_name: user.real_name,
              email: user.profile.email,
              startBtns: ['default', 'primary', 'danger']
            })
          }
        })
      }).catch((error) => console.log(error)) // End users.list call
    })
  })
}

const channelJoin = function channelJoin (params) {
  // console.log(params, 'are the params in this join')
  // Set a timeout for 1 sec each so that we don't exceed our Slack Api limits
  setTimeout(function () {
    const web = params[0]
    const member = params[1].toString()
    const channel = params[2].toString()
    console.log(member, 'is the member that will join ' + channel)

    // check if user is bot before adding
    // TODO check if user is already in channel
    if (member) {
      // const member = member['id']

      web.groups.info(channel).then(channelData => {
        // console.log(channelData)
        if (channelData) {
          // console.log(params[1], isUser(params[1]))
          if (isUser(params[1])) {
            // Invite each user to the labyrinth chat channel
            return web.groups.invite(channel, member)
              .then(res => {
                // console.log(res, 'is the channel res')
                return res
              }).catch((error) => {
                console.log(error)
              })
          }
        }
      }).catch(error => console.log(error))
    }
  }, 100 * (params[3] + 1))
} // End channel Join
