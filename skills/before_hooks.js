const _ = require('underscore')
const safeCodes = {
  0: [],
  1: [],
  2: []
}

module.exports = function (controller) {
  controller.studio.before('three_buttons', function(convo, next) {
    const id = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id

    controller.store.getTeam(id)
      .then(team => {
        team.users = _.map(team.users, function(user) {
          if (!user.startBtns || user.startBtns.length <= 3)
            user.startBtns = ['primary','danger','default']

          return user
        })

        controller.store.teams[team.id] = team
        next()
      })
      .catch(console.error)
  })

  controller.studio.before('safe', function(convo, next) {
    const menus = convo.threads.default[0].attachments[0].actions
    const code = process.env.safe_code.split('-')

    _.each(menus, function(menu) {
      menu.options = generateCodes(menu, menus, safeCodes, code)
    })

    next()
  })
  
  controller.studio.before('strange_symbols', function(convo, next) {
    const id = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id
    controller.store.getTeam(id)
      .then(team => {
        team.shownSymbol = 0
        next()
      })
      .catch(console.error)

  })

  const generateString = function () {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for (let i = 0; i < 3; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return text
  }

  const generateCodes = function(menu, menus, codes, answer, word) {
    menu.options = []
    const length = word ? controller.remoteWords.length : 99

    for (let x = 0; x < length; x++) {
      const string = word ? controller.remoteWords[x] : generateString()

      if (!codes[menus.indexOf(menu)][x])
        codes[menus.indexOf(menu)][x] = { text: string, value: string }

      menu.options[x] = codes[menus.indexOf(menu)][x]
    }

    if (word) {
      _.each(controller.remoteCodes, function(code, ind) {
        menu.options.push({ text: code, value: code })
      })
    } else {
      menu.options[100] = {
        text: answer[menus.indexOf(menu)],
        value: answer[menus.indexOf(menu)]
      }
    }

    return _.shuffle(menu.options)
  }
}
