const _ = require('underscore')
const sort = require('sorted-object')

const correctButtonCodes = {
  hole: ['red', 'red', 'green', 'grey', 'grey', 'green', 'green', 'red', 'grey'],
  glyph: ['grey', 'green', 'green', 'grey', 'grey', 'red', 'red', 'green', 'red'],
  stars: ['grey', 'grey', 'red', 'red', 'red', 'green', 'grey', 'red', 'grey'],
  many: ['grey', 'green', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'red']
}

module.exports = function (controller) {
  controller.on('code_entered', function (params) {
    const bot = params.bot
    controller.store.getTeam(params.team).then(res => {
      let correctCodes
      let codeObj

      if (['safe'].includes(params.codeType)) {
        if (params.codeType === 'safe') {
          correctCodes = controller.safeCode
          params.phaseUnlocked = 'phase_2'
        }

        codeObj = checkCodeObject(params.code, correctCodes)
        codeObj.code = params.codeType
      } else {
        if (params.codeType === 'buttons') {
          correctCodes = correctButtonCodes
        }

        codeObj = checkCodeArray(params.code, correctCodes)
      }

      if (codeObj.correct === true) {
        params.key = codeObj
        params.team = res

        controller.trigger('state_change', [params])
      } else {
        const consts = {
          sameScript: false
        }
        controller.makeCard(bot, params.event, params.codeType, 'wrong', consts, function (card) {
          console.log(card, 'is the card for the wrong entered code')

          // replace the original button message with a new one
          bot.replyInteractive(params.event, card)
        })
      }
    }).catch(console.error)
  }) // End on event

  // Function checks if the entered code matches any of an Array of correct codes
  // Will return 'correct' based on match (true for match)
  // Will return 'puzzle' as the correct code name if there is a match
  // Will return 'code' as the entered code
  const checkCodeArray = function (code, correctCodes) {
    const overall = {}

    // Loop through Array
    for (const key in correctCodes) {
      overall[key] = []

      _.each(correctCodes[key], function (c, i) {
        overall[key].push(c === code[i])
      })

      // Compare correct and entered code
      // If match, return
      if (JSON.stringify(correctCodes[key]) === JSON.stringify(code)) {
        return { correct: true, puzzle: key, code: code }
      }
    }

    // If no match, return
    return { correct: false, code: code, overall: overall }
  }

  // Checks entered code against a single correct code Object
  // Will return 'correct' based on match (true for match)
  // Will return 'code' as the entered code
  // Will return 'overall' as an object of true/false matches for each entry
  const checkCodeObject = function (code, correctCode) {
    let count = 0
    const overall = {}
    code = sort(code)
    correctCode = sort(correctCode)

    // Loop through object keys
    for (const key in correctCode) {
      // Set the overall key to be true or false based on match
      // Will make up an object of true/false results for each button or menu
      overall[key] = correctCode[key] === code[key]

      // If this is a match, count up
      if (overall[key]) {
        count++
        // If all keys match, return
        if (count === Object.keys(correctCode).length) {
          return { correct: true, code: code, overall: overall }
        }
      }
    }
    // If not all keys match, return
    return { correct: false, code: code, overall: overall }
  }
}
