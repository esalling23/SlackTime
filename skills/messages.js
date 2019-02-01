const { WebClient } = require("@slack/client")
const _ = require("underscore")

module.exports = function(controller) {

  controller.deleteThisMsg = function(message, token, callback) {

    // console.log(message, "we are deleting this")

    const ts = message.message_ts ? message.message_ts : message.ts

    const web = new WebClient(token)

    web.chat.delete(ts, message.channel).then(res => {
      // console.log(res, "deleted")
      if (callback)
        callback()
    }).catch(err => {
      // console.log("delete error: ", err)
      // console.log("couldn't delete: ", message)
      if (callback)
        callback()
    })
  }

  // Delete all message history of a given channel
  controller.deleteHistory = function(channel, token, cb) {

    const count = 0
    const num = 0
    const web = new WebClient(token)

    web.conversations.history(channel).then(res => {
      _.each(res.messages, function(msg) {
        msg.channel = channel
        setTimeout(function() {
          controller.deleteThisMsg(msg, token, function() {

            count++

            if (count == res.messages.length && cb)
              cb()
          })
        }, 500 * res.messages.indexOf(msg) + 1)

      })
    }).catch(err => console.log("history error: ", err))


  }

  // Delete the most recent message of a
  controller.deleteHistoryRecent = function(channel, token, cb) {

    const count = 0
    const num = 0
    const web = new WebClient(token)

    web.conversations.history(channel).then(res => {
      const msg = res.messages[0]
      msg.channel = channel
      controller.deleteThisMsg(msg, token, function() {
        if (cb)
          cb()
      })

    }).catch(err => console.log("history error: ", err))


  }

  controller.findRecentMessages = function(opt) {
    return new Promise((resolve, reject) => {
      // console.log(opt[1], " is this users bot channel")
      opt[0].conversations.history(opt[1]).then(res => {
        const msg = res.messages[0]

        if (msg)
          resolve({ msg: msg, channel: opt[1] })
        else
          resolve("no message found")

      }).catch(err => console.log("history error in finding messages: ", err))
    })
  }
}
