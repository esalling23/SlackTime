const debug = require('debug')('botkit:onboarding')
const fs = require("fs")
const _ = require("underscore")

const { WebClient } = require('@slack/client')

const channels = ["gamelog", "theLabyrinth", "map"],
    mapChannel,
    globalChannels = [],
    globalMembers = [],
    creator,
    memberCount

function isUser(member) {
  // console.log(member.name, "is the member being checked")
  return member.is_bot || member.name === process.env.botName || member.name === "slackbot"
}

module.exports = function(controller) {

    controller.on('onboard', function(bot, team, auth) {

      const token = auth.access_token

      const web = new WebClient(token)
      controller.storage.teams.get(team.id, function (error, team) {
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
         creator = bot.config.createdBy

         _.each(res.members, function(user) {

            const thisUser = _.findWhere(team.users, { userId: user.id })

            if (isUser(user) && !thisUser) {
              team.users.push({
                userId: user.id,
                name: user.name,
                real_name: user.real_name,
                email: user.profile.email,
                startBtns: ["default", "primary", "danger"]
              })
            }

         })


         // console.log(saved, " we onboarded this team")
         web.groups.create(process.env.progress_channel).then((channel, err) => {

            const channelId = channel.group.id

            team.gamelog_channel_id = channelId
            team.noChatChannels.push(channelId)

            const data = _.map(team.users, function(user) {
              return [ web, user.userId, channelId, team.users.indexOf(user) ]
            })

            data.push([ web, team.bot.user_id, channelId, 1 ])

            // console.log(data, "is the data we have")

            const mapPromises = data.map(channelJoin)
            // console.log("completed channel joins")

            const results = Promise.all(mapPromises)

            results.then(members => {
              return web.channels.list()
            }).then(res => {
              channel = _.findWhere(res.channels, { name: "general" }).id
              team.general_channel = channel
              team.chat_channels.push(team.general_channel)
              return web.channels.invite(channel, team.bot.user_id)
            }).then(res => {
              console.log("completed promises", res)

              setTimeout(function() {
                controller.storage.teams.save(team, function(err, saved) {
                  console.log("saved in the onboarding: ", saved)
                  controller.gamelogMessage(bot, saved)
                  // controller.trigger('rtm_events', [bot])

                })
              }, 1000 * data.length)
            }).catch(err => console.log(err))

          }).catch(err => console.log(err))

       }).catch((err) => console.log(err) ) // End users.list call

    })

  })

}

const channelJoin = function channelJoin(params) {

  // console.log(params, "are the params in this join")
  // Set a timeout for 1 sec each so that we don't exceed our Slack Api limits
  setTimeout(function() {
    const web = params[0]
    const member = params[1].toString()
    const channel = params[2].toString()
    console.log(member, "is the member that will join " + channel)

    // check if user is bot before adding
    // TODO check if user is already in channel
    if (member) {
      // const member = member["id"]

      web.groups.info(channel).then(channelData => {
        // console.log(channelData)
        if (channelData) {
          // console.log(params[1], isUser(params[1]))

          if (isUser(params[1])) {

            // Invite each user to the labyrinth chat channel
            return web.groups.invite(channel, member)
              .then(res => {
                // console.log(res, "is the channel res")
                return res
              }).catch((err) => { console.log(err) })

          }
        }
      }).catch(err => console.log(err))

    }

  }, 100 * (params[3]+1))

}// End channel Join
