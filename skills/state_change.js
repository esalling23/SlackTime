const _ = require('underscore')
// Script for generation event
// Pulls scripts with a certain tag for team puzzle data

module.exports = function (controller) {
  controller.on('state_change', function (options) {
    console.log(options.key, 'in the state change')
    const res = options.team
    const code = options.key.puzzle
    let thisUser = _.findWhere(res.users, {
      userId: options.user
    })

    // safety check
    if (!thisUser.events) thisUser.events = []
    if (!thisUser.codesEntered) thisUser.codesEntered = []
    if (!res.codesEntered) res.codesEntered = []
    // safety check
    if (!thisUser.currentState) {
      thisUser.currentState = 'default'
    }

    let thread = 'correct'
    const consts = {}

    if (['telegraph_key', 'buttons', 'remote'].includes(options.codeType)) thread += '_' + code

    // Has the player already entered this code?
    if (thisUser.codesEntered.includes(code) && !['bookshelf', 'telegraph_key', 'keypad'].includes(options.codeType)) {
      if (options.codeType === 'buttons' || options.codeType === 'remote') consts.recap = thread
      controller.makeCard(options.bot, options.event, options.codeType, 'repeat', consts, function (card) {
        // replace the original button message with a new one
        options.bot.replyInteractive(options.event, card)
      })
    } else {
      if (options.phaseUnlocked) {
        if (!res.phasesUnlocked) res.phasesUnlocked = ['phase_1']
        if (!res.phasesUnlocked.includes(options.phaseUnlocked)) {
          res.phasesUnlocked.push(options.phaseUnlocked)
        }

        // sanity check
        res.phasesUnlocked = _.filter(res.phasesUnlocked, function (phase) {
          return phase != null
        })
      }

      if (['random', 'safe', 'orb'].includes(code)) {
        if (!thisUser.events.includes(code)) thisUser.events.push(code)
      } else {
        thisUser.currentState = changeState(thisUser.currentState, code)
      }

      res.users = _.map(res.users, function (user) {
        if (user.userId === thisUser.userId) {
          return thisUser
        } else {
          return user
        }
      })

      controller.storage.teams.save(res).then((updated) => {
        controller.studio.getScripts().then(scripts => {
          controller.makeCard(options.bot, options.event, options.codeType, thread, consts, function (card) {
            // console.log(card, 'is the card from the state change')
            // replace the original button message with a new one
            options.bot.replyInteractive(options.event, card)
          })

          thisUser = _.findWhere(updated.users, {
            userId: options.user
          })

          if (thisUser.codesEntered.includes(code)) return

          if (options.codeType !== 'bookshelf') {
            thisUser.codesEntered.push(code)
            updated.codesEntered.push(code)
          }

          controller.store.teams[updated.id] = updated
        })
      })
    }
  }) // End on event
}

const changeState = function (currentState, event) {
  let newState
  switch (event) {
    case 'hole':
      // hole state
      newState = 'a'
      break

    case 'glyph':
      // glyph state
      newState = 'b'
      break

    case 'stars':
      // stars state
      newState = 'c'
      break

    case 'safe':
      // safe state
      newState = 'c'
      break
  }
  currentState = currentState += newState
  return currentState
}

const findState = function (currentState, event) {
  let newState

  switch (currentState.toLowerCase()) {
    // everything is normal
    case 'default':

      switch (event) {
        case 'hole':

          // safari video state
          newState = 'a'

          break

        case 'hole':

          // hole state
          newState = 'b'
          console.log(newState)
          break

        case 'glyph':

          // abstract painting glyph state
          newState = 'c'

          break

        default:
          newState = currentState.toLowerCase()
          break
      }
      break

      // video
    case 'a':

      switch (event) {
        case 'hole':

          newState = 'e'

          break

        case 'glyph':

          newState = 'd'

          break

        default:
          newState = currentState.toLowerCase()
          break
      }

      break

      // hole
    case 'b':

      switch (event) {
        case 'safari':
          // hole and video
          newState = 'e'

          break

        case 'glyph':
          // hole and glyph
          newState = 'f'

          break

        default:
          newState = currentState.toLowerCase()
          break
      }

      break

      // glyph
    case 'c':

      switch (event) {
        case 'safari':

          newState = 'd'

          break

        case 'hole':

          newState = 'f'

          break

        default:
          newState = currentState.toLowerCase()
          break
      }

      break

      // video and glyph
    case 'd':

      switch (event) {
        case 'hole':
          // everything
          newState = 'g'

          break

        default:
          newState = currentState.toLowerCase()
          break
      }

      break

      // hole and video
    case 'e':

      switch (event) {
        case 'glyph':
          // everything
          newState = 'g'

          break

        default:
          newState = currentState.toLowerCase()
          break
      }

      break

      // hole and glyph
    case 'f':

      switch (event) {
        case 'safari':

          // everything
          newState = 'g'

          break

        default:
          newState = currentState.toLowerCase()
          break
      }

      break
  }

  return newState
}
