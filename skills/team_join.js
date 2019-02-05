const _ = require('underscore')
const { WebClient } = require('@slack/client')

module.exports = function (controller) {
  controller.on('team_join', function (bot, message) {
    console.log('a user joined', message)
    if (!controller.isUser(message.user)) return

    controller.storage.teams.get(message.team_id, function (error, team) {
      if (error) return
      if (_.findWhere(team.users, { userId: message.user.id })) return

      const web = new WebClient(team.bot.app_token)

      web.users.list().then(res => {
        const thisUser = _.findWhere(res.members, { id: message.user.id })

        team.users.push({
          userId: message.user.id,
          name: message.user.name,
          real_name: thisUser.real_name,
          startBtns: ['default', 'primary', 'danger'],
          email: thisUser.profile.email
        })

        team.users = team.users

        controller.storage.teams.save(team, function (error, saved) {
          if (error) return
          console.log(saved, 'someone joined so we added them to the users list')

          if (!saved.gameStarted) return

          bot.api.im.open({ user: message.user.id }, function (error, directMessage) {
            if (error) return

            saved.users = _.map(saved.users, function (u) {
              if (u.userId === message.user.id) u.bot_chat = directMessage.channel.id

              return u
            })

            console.log('new user joined with bot channel, ', saved.users)

            controller.storage.teams.save(saved, function (error, updated) {
              if (error) {
                console.log('erroror sending onboarding message:', error)
              } else {
                // console.log(user.id)
                controller.studio.get(bot, 'onboarding', message.user.id, directMessage.channel.id).then(convo => {
                  const template = convo.threads.default[0]
                  template.username = process.env.username
                  template.icon_url = process.env.icon_url

                  convo.setconst('team', team.id)
                  convo.setconst('user', message.user.id)

                  convo.activate()
                })
              }
            })
          })
        })
      }).catch(error => console.log('Team Join User Profile Get erroror: ', error))
    })
  })
}
