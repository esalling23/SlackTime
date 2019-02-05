const _ = require('underscore')
// const gm = require("gm")

module.exports = function (controller) {
  controller.middleware.receive.use(function (bot, message, next) {
    // console.log('RCVD:', message)
    next()
  })

  controller.middleware.send.use(function (bot, message, next) {
    // console.log('SEND:', message)

    // If this message has a movement count
    // Update team's movements
    // Update gamelog
    // Trigger phase-specific logic
    if (message.movement) {
      controller.storage.teams.get(bot.config.id, function (error, team) {
        if (error) next()

        if (!team.movements) team.movements = []
        const movement = parseInt(message.movement)

        if (team.movements.includes(movement)) return

        team.movements.push(movement)

        controller.storage.teams.save(team, function (error, saved) {
          if (error) next()
          // console.log(saved, '-- Team Movement Updated --', 'middleware send line 56')
        })
      })
    }
    next()
  })
}
