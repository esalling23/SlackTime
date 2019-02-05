const _ = require('underscore')

module.exports = function (webserver, controller) {
  webserver.get('/download/:file/:team/:user', function (req, res) {
    controller.storage.teams.get(req.params.team, function (error, team) {
      if (error) return
      const bot = controller.spawn(team.bot)
      const user = _.findWhere(team.users, {
        'userId': req.params.user
      })
      const file = req.params.file
      const opt = {
        file: file,
        team: team.id,
        user: user.userId,
        channel: user.bot_chat
      }

      let filePath = 'http://res.cloudinary.com/extraludic/image/upload/v1/fl_attachment/escape-room/' + file

      if (file === 'TangramsFolder.zip') {
        filePath = 'https://res.cloudinary.com/extraludic/raw/upload/v1/escape-room/TangramsFolder.zip'
      } else if (file === 'TV-Guide-Symbols.pdf') {
        filePath = filePath.replace('/fl_attachment', '')
      }

      opt.url = filePath

      controller.dataStore(bot, opt, 'download').then((result) => {
        res.redirect(filePath)
      }).catch(error => console.log('erroror with download storage: ' + error))
    })
  })
}
