const debug = require('debug')('botkit:rtm_manager')
const { RTMClient } = require("@slack/client")

module.exports = function(controller) {

    const managed_bots = {}

    // Capture the rtm:start event and actually start the RTM...
    controller.on('rtm:start', function(config) {
        const bot = controller.spawn(config)
      debug('starting rtm')

        manager.start(bot, config)
    })

    //
    controller.on('rtm_close', function(bot) {
        manager.remove(bot)
    })

    // The manager object exposes some useful tools for managing the RTM
    const manager = {
        start: function(bot, config) {

            if (managed_bots[bot.config.token]) {
                debug('Start RTM: already online')

            } else {

                bot.api.rtm.start({
                  batch_presence_aware: true
                }, function(err, bot) {
                  managed_bots[bot.config.token] = bot.rtm
                })

                bot.startRTM(function(err, bot) {
                    if (err) {
                        debug('Error starting RTM:', err)
                    } else {
                        managed_bots[bot.config.token] = bot.rtm
                        debug('Start RTM: Success')
                    }
                })
            }


        },
        stop: function(bot) {
            if (managed_bots[bot.config.token]) {
                if (managed_bots[bot.config.token].rtm) {
                    debug('Stop RTM: Stopping bot')
                    managed_bots[bot.config.token].closeRTM()
                }
            }
        },
        remove: function(bot) {
            debug('Removing bot from manager')
            delete managed_bots[bot.config.token]
        },
        reconnect: function() {

            debug('Reconnecting all existing bots...')
            controller.storage.teams.all(function(err, list) {

                if (err) {
                    throw new Error('Error: Could not load existing bots:', err)
                } else {
                    for (const l = 0 l < list.length l++) {
                        manager.start(controller.spawn(list[l].bot))
                    }
                }

            })

        }
    }


    return manager

}
