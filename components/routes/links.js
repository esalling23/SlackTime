const _ = require('underscore')

module.exports = function(webserver, controller) {

  webserver.get('/link/:link/:team/:user?', function(req, res){

    controller.storage.teams.get(req.params.team, function(err, team) {

      const bot = controller.spawn(team.bot)

      const user = _.findWhere(team.users, { "userId" : req.params.user })

      if (!user) user = { userId: "untrackable", bot_chat: 'gamelog' }

      const url = controller.linkUrls[req.params.link]

      const opt = {
        team: team.id,
        user: user.userId,
        channel: user.bot_chat,
        url: url,
        linkName: req.params.link
      }

      controller.dataStore(bot, opt, "link").then((result) => {

        res.redirect(url)

      }).catch(err => console.log('error with link storage: ' + err))

    })

  })


}
