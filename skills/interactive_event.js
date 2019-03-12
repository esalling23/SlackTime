const _ = require('underscore')

module.exports = function (controller) {
  // for choose/confirm
  // Temporary storage
  let choiceSelect = []
  const usersClicking = []

  controller.on('interactive_message_callback', function (bot, event) {
    // console.log(event, 'is the interactive message callback event')
    // A user selected a menu option
    if (event.actions[0].name.match(/^choose(.*)$/)) {
      // console.log(event.attachment_id)
      const reply = event.original_message

      // Grab the 'value' field from the selected option
      let value = event.actions[0].selected_options[0].value
      let choice
      // console.log(value)
      const actions = reply.attachments[0].actions

      // for each attachment option
      for (let i = 0; i < actions.length; i++) {
        // check if the attachment option value equals the selected value
        // NO TWO VALUES CAN BE THE SAME
        if (actions[i].options) {
          for (let j = 0; j < actions[i].options.length; j++) {
            if (actions[i].options[j].value === value) {
              // set the choice to the text of the matching option
              choice = actions[i].options[j].text
            }
          }
        }
      }
      // console.log(choice)

      // Take the original message attachment
      const menuAttachment = reply.attachments[0].actions[0]
      // Change the menu text to be the chosen option
      menuAttachment.text = choice
      // Set the attachment to the altered object
      reply.attachments[0].actions[0] = menuAttachment

      // If this user does not already have a choice stored
      if (!_.findWhere(choiceSelect, { user: event.user })) {
        if (event.actions[0].name.includes('multi')) {
          // console.log(event.actions[0].name)
          const key = parseInt(event.actions[0].name.match(/\d+/))
          // console.log(key)
          const val = {}
          const choiceMulti = {}

          val[key] = value
          choiceMulti[key] = choice

          choice = choiceMulti
          value = val
        }

        // console.log('we are adding this choice')
        // Create object to hold this selection
        // Selection is 'valid' or the solution/key if the value is 'correct'
        // Any other value will be incorrect
        // NO TWO VALUES CAN BE THE SAME
        choiceSelect.push({
          user: event.user,
          choice: choice,
          value: value,
          callback: event.callback_id
        })
      } else {
        // User has choice stored
        // console.log('we are updating this choice')
        // Update stored choice with new choice, valid bool, and callback_id
        choiceSelect = _.map(choiceSelect, function (item) {
          if (item.user === event.user) {
            item.callback = event.callback_id

            if (event.actions[0].name.includes('multi')) {
              if (typeof item.choice === 'string') item.choice = {}
              if (typeof item.value === 'string') item.value = {}
              const key = parseInt(event.actions[0].name.match(/\d+/))
              // console.log(key)
              item.choice[key] = choice
              item.value[key] = value
            } else {
              item.value = value
              item.choice = choice
            }
            return item
          } else return item
        })
      }
      console.log(choiceSelect, 'is the choice select')
    }

    // Confirm menu choice
    if (event.actions[0].name.match(/^confirm$/)) {
      // Locate the saved choice based on the user key
      const confirmedChoice = _.findWhere(choiceSelect, {
        user: event.user
      })

      const opt = {
        bot: bot,
        event: event,
        data: confirmedChoice
      }

      controller.store.getTeam(event.team.id)
        .then((res) => {
          opt.team = res
          const scriptName = confirmedChoice.value
          // Set the puzzle, answer, and if the answer is correct
          // This data will be sent to the puzzle_attempt event for saving to storage
          return controller.studio.get(bot, scriptName, event.user, event.channel)
        })
        .then((script) => {
          opt.user = _.findWhere(opt.team.users, {
            userId: event.user
          })
          opt.script = script
          controller.confirmMovement(opt)
        })
    }

    // user submitted a code
    if (event.actions[0].name.match(/^code(.*)/)) {
      const reply = event.original_message

      const options = {}
      const code = []

      const type = event.actions[0].name

      if (type.includes('safe')) {
        // console.log('confirming safe/door enter code')
        const confirmedChoice = _.findWhere(choiceSelect, {
          user: event.user
        })
        const callbackId = event.callback_id.replace('_code', '').replace('_confirm', '')

        options.code = confirmedChoice.choice
        options.codeType = callbackId
      } else if (type.includes('buttons')) {
        _.each(reply.attachments, function (attachment) {
          _.each(attachment.actions, function (action) {
            if (action.name === 'color') {
              let color
              switch (action.style) {
                case 'danger':
                  color = 'red'
                  break
                case '':
                case 'default':
                  color = 'grey'
                  break
                case 'primary':
                  color = 'green'
                  break
              }
              code.push(color)
            }
          })
        })

        options.codeType = 'buttons'
        options.code = code
      } else if (type.includes('keypad')) {
        _.each(reply.attachments, function (attachment) {
          _.each(attachment.actions, function (action) {
            if (action.name === 'letter') {
              code.push(action.text)
            }
          })
        })

        options.code = code
        options.codeType = 'keypad'
      }
      console.log(options.code, options.codeType)

      options.event = event
      options.user = event.user
      options.team = event.team.id
      options.bot = bot

      // console.log('code has been entered')
      controller.trigger('code_entered', [options])
    }
    
    // download button
//     if (event.actions[0].name.match(/^download(.*)/)) {
//       let filePath = 'http://res.cloudinary.com/extraludic/image/upload/v1/fl_attachment/escape-room/' + req.params.file

//       res.redirect(filePath)
//     }

    // button color change
    if (event.actions[0].name.match(/^color/)) {

      // console.log(event)
      const callbackId = event.callback_id
      const reply = event.original_message
      // we need to change this button's color homie
      _.each(reply.attachments, function (attachment) {
        _.map(attachment.actions, function (action) {
          // console.log(action)
          if (action.value === event.actions[0].value) {
            switch (action.style) {
              case 'danger':
                action.style = 'primary'
                break

              case 'primary':
                action.style = ''
                break

              case '':
              case 'default':
                action.style = 'danger'
                break
            }
          }
          return action
        })
      })

      bot.api.chat.update({
        channel: event.channel,
        ts: reply.ts,
        attachments: reply.attachments
      }, function (error, updated) {
        if (error) return
        if (callbackId === 'three_color_buttons') {
          // console.log(event.team.id)

          controller.store.getTeam(event.team.id)
            .then(team => {
              if (error) return
              const thisUser = _.findWhere(team.users, {
                userId: event.user
              })
              const startBtns = []
              _.each(updated.message.attachments[0].actions, function (btn) {
                startBtns.push(btn.style === '' ? 'default' : btn.style)
              })

              thisUser.startBtns = startBtns

              team.users = _.map(team.users, function (user) {
                if (user.userId === thisUser.userId) return thisUser
                else return user
              })

              controller.store.teams[team.id] = team
              controller.trigger('count_colors', [bot, event, team])
            })
            .catch(console.error)
        }
      })
    }

    if (event.actions[0].name.match(/^start/)) {
      const options = {
        bot: bot,
        message: event,
        forced: false,
        team: event.team
      }

      options.player = true
      controller.trigger('generation_event', [options])

      controller.studio.runTrigger(bot, 'start', event.user, event.channel, event).catch(function(error) {
        console.log('error: encountered an error loading onboarding script from Botkit Studio:', error)
      })
    }

    // Move through pictures in a given photo album
    if (event.actions[0].name.match(/^picture(.*)/)) {
      const reply = event.original_message
      const type = event.actions[0].value
      const url = reply.attachments[0].image_url

      controller.store.getTeam(event.team.id)
        .then(team => {
          const user = _.findWhere(team.users, { userId: event.user })
          const urls = controller.symbolUrls
          
          // Add the cypher wheel image to the end
          // if user has unlocked that state
          if (user.currentState.split('').includes('a')) {
            urls.push(controller.cypherUrls.img)
          }

          if (!team.shownSymbol) team.shownSymbol = 0

          if (type === 'next') {
            team.shownSymbol++
            if (team.shownSymbol > urls.length - 1) team.shownSymbol = 0
          } else if (type === 'prev') {
            team.shownSymbol--
            if (team.shownSymbol < 0) team.shownSymbol = urls.length - 1
          }

          reply.attachments[0].image_url = urls[team.shownSymbol]
          reply.attachments[0].actions[0].text = '< Prev Image'
          reply.attachments[0].actions[1].text = 'Next Image >'
          reply.attachments[0].footer = `\n*Symbol ${team.shownSymbol + 1} *`

          bot.api.chat.update({
            channel: event.channel,
            ts: reply.ts,
            attachments: reply.attachments
          }, function (error, updated) {
            console.log(error, updated)
            controller.store.teams[team.id] = team
          })

        })
        .catch(console.error)

    }

    // User says something
    if (event.actions[0].name.match(/^say/)) {
      const opt = {
        bot: bot,
        event: event,
        data: event.actions[0]
      }

      controller.store.getTeam(event.team.id)
        .then((res) => {
          controller.studio.getScripts().then((list) => {
            let name = event.actions[0].value
            if (res.entered && event.actions[0].value === 'three_color_buttons') {
              name = 'the_room'
              opt.data.value = 'the_room'
            }

            const script = _.findWhere(list, {
              command: name
            })
            const scriptName = script.command

            controller.studio.get(bot, scriptName, event.user, event.channel).then((currentScript) => {
              controller.storage.teams.save(res).then(saved => {
                opt.team = saved
                opt.user = _.findWhere(res.users, {
                  userId: event.user
                })
                opt.script = currentScript

                controller.confirmMovement(opt)
                usersClicking.splice(usersClicking.indexOf(event.user), 1)
              })
            })
          })
        })
        .catch(console.error)
    }
  })
}
