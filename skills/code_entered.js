const _ = require("underscore")
const fs = require('fs')
const request = require('request')
const sort = require("sorted-object")

const correctButtonCodes = {
  random: ['red', 'red', 'green', 'grey', 'grey', 'green', 'green', 'red', 'grey'],
  safari: ['grey','green','green', 'grey', 'grey', 'red', 'red', 'green', 'red'],
  hole: ['grey', 'grey', 'red', 'red', 'red', 'green', 'grey', 'red', 'grey'],
  glyph: ['grey', 'green', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'red'],
  orb: ['red', 'green', 'grey', 'grey', 'grey', 'green', 'grey', 'red', 'grey']
}

module.exports = function(controller) {

  controller.on("code_entered", function(params) {

    const bot = params.bot
    controller.storage.teams.get(params.team).then(res => {

      const correctCodes
      const codeObj

      if (['safe', 'bookshelf', 'aris_door', 'remote'].includes(params.codeType)) {
        if (params.codeType == 'safe') {
          correctCodes = controller.safeCode
          params.phaseUnlocked = "phase_2"
        } else if (params.codeType == 'bookshelf') {
          correctCodes = controller.bookCode
          params.phaseUnlocked = "phase_3"
        } else if (params.codeType == 'aris_door') {
          correctCodes = controller.arisCode
          params.phaseUnlocked = "phase_4"
        } else if (params.codeType == 'remote') {
          correctCodes = {}
          _.each(controller.remoteCombos[parseInt(params.channel) - 1], function(item, ind) {
            correctCodes[ind] = controller.remoteCodes[item]
          })

        }

        codeObj = checkCodeObject(params.code, correctCodes)
        codeObj.code = params.codeType

      } else {

        if (params.codeType == "buttons") {
          correctCodes = correctButtonCodes
        }
        else if (params.codeType == 'telegraph_key') {
          correctCodes = controller.telegraphKeys
          params.code = [params.code[0], params.code[1], params.code[2]]
        }
        else if (params.codeType == 'keypad') {
          correctCodes = controller.keypadCode
        }

        codeObj = checkCodeArray(params.code, correctCodes)

      }

      if (params.codeType == "telegraph_key")
        codeObj.puzzle = parseInt(codeObj.puzzle) + 1
      else if (params.codeType == 'remote')
        codeObj.puzzle = parseInt(params.channel)

      // Store data of entered code
      controller.dataStore(bot, params.event, "code", {
        codeObj: codeObj,
        codeType: params.codeType
      }).then(data => console.log("logged: ", data))
        .catch(err => console.log("code loggin error: ", err))

      if (codeObj.correct == true) {

        params.key = codeObj
        params.team = res

        controller.trigger("state_change", [params])

        if (codeObj.puzzle == 'safari')
          controller.trigger("image_counter_onboard", [bot, params.event])

      } else {

         const consts = {
           sameScript: false
         }

        if (params.codeType == 'bookshelf') {

          controller.randomText(function(text) {

            consts.randomText = text

            controller.makeCard(bot, params.event, params.codeType, 'random', consts, function(card) {
                console.log(card, "is the card for the wrong entered code")

                // replace the original button message with a new one
                bot.replyInteractive(params.event, card)

             })

          })
        } else {

         controller.makeCard(bot, params.event, params.codeType, 'wrong', consts, function(card) {
            console.log(card, "is the card for the wrong entered code")

            // replace the original button message with a new one
            bot.replyInteractive(params.event, card)

         })
        }
      }


    })


  }) // End on event

  // Function checks if the entered code matches any of an Array of correct codes
  // Will return 'correct' based on match (true for match)
  // Will return 'puzzle' as the correct code name if there is a match
  // Will return 'code' as the entered code
  const checkCodeArray = function(code, correctCodes) {
    const overall = {}

    // Loop through Array
    for (const key in correctCodes) {

      overall[key] = []

      _.each(correctCodes[key], function(c, i) {
        overall[key].push(c == code[i])
      })

      // Compare correct and entered code
      // If match, return
      if (JSON.stringify(correctCodes[key]) == JSON.stringify(code)) {
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
  const checkCodeObject = function(code, correctCode) {

    const count = 0
    const overall = {}
    code = sort(code)
    correctCode = sort(correctCode)

    // Loop through object keys
    for (const key in correctCode) {

      // Set the overall key to be true or false based on match
      // Will make up an object of true/false results for each button or menu
      overall[key] = correctCode[key] == code[key]

      // If this is a match, count up
      if (overall[key]) {

        count ++
        // If all keys match, return
        if ( count == Object.keys(correctCode).length ) {
           return { correct: true, code: code, overall: overall }
        }

      }

    }
    // If not all keys match, return
    return { correct: false, code: code, overall: overall }

  }

}
