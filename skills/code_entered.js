const _ = require("underscore");
const fs = require('fs');
const request = require('request');
var sort = require("sorted-object");

const correctButtonCodes = {
  random: ['red', 'red', 'green', 'grey', 'grey', 'green', 'green', 'red', 'grey'],
  safari: ['grey','green','green', 'grey', 'grey', 'red', 'red', 'green', 'red'],
  hole: ['grey', 'grey', 'red', 'red', 'red', 'green', 'grey', 'red', 'grey'], 
  glyph: ['grey', 'green', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'red'],
  orb: ['red', 'green', 'grey', 'grey', 'grey', 'green', 'grey', 'red', 'grey']
}

module.exports = function(controller) {
  
  controller.on("code_entered", function(params) {
    
    var bot = params.bot;
    controller.storage.teams.get(params.team).then(res => {
      
      var correctCodes;
      var codeObj;
            
      if (['safe', 'bookshelf', 'aris_door'].includes(params.codeType)) {
        if (params.codeType == 'safe') {
          correctCodes = controller.safeCode;
          params.phaseUnlocked = "phase_2";
        } else if (params.codeType == 'bookshelf') {
          correctCodes = controller.bookCode;
          params.phaseUnlocked = "phase_3";
        } else if (params.codeType == 'aris_door') {
          correctCodes = controller.arisCode;
          params.phaseUnlocked = "phase_4";
        }
        
        codeObj = checkCodeObject(params.code, correctCodes);
        codeObj.code = params.codeType;
        
      } else {
        
        if (params.codeType == "buttons") {
          correctCodes = correctButtonCodes;
        } 
        else if (params.codeType == 'telegraph_key') {
          correctCodes = controller.telegraphKeys;
          params.code = [params.code[0], params.code[1], params.code[2]];
        } 
        else if (params.codeType == 'keypad') {
          correctCodes = controller.keypadCode;
        }
        
        codeObj = checkCodeArray(params.code, correctCodes);

      }
      
      // Store data of entered code
      controller.dataStore(params.event, "code", { codeObj: codeObj, codeType: params.codeType })
        .then(data => console.log("logged: ", data))
        .catch(err => console.log("code loggin error: ", err));
            
      if (codeObj.correct == true) {
        
        if (params.codeType == "telegraph_key")
          codeObj.puzzle = parseInt(codeObj.puzzle) + 1;
        
        params.key = codeObj;
        params.team = res;
        
        controller.trigger("state_change", [params]);

        if (codeObj.puzzle == 'safari')
          controller.trigger("image_counter_onboard", [bot, params.event]);

      } else {
                    
         var vars = {
           sameScript: false
         };
        
        if (params.codeType == 'bookshelf') {
          
          controller.randomText(function(text) {
            
            vars.randomText = text;
            
            controller.makeCard(bot, params.event, params.codeType, 'random', vars, function(card) {
                console.log(card, "is the card for the wrong entered code");

                // replace the original button message with a new one
                bot.replyInteractive(params.event, card);

             });
            
          });
        } else {
          
         controller.makeCard(bot, params.event, params.codeType, 'wrong', vars, function(card) {
            console.log(card, "is the card for the wrong entered code");

            // replace the original button message with a new one
            bot.replyInteractive(params.event, card);

         });
        }
      }
            
      
    });
  
    
  }); // End on event
  
  // Function checks if the entered code matches any of an Array of correct codes
  // Will return 'correct' based on match (true for match)
  // Will return 'puzzle' as the correct code name if there is a match
  // Will return 'code' as the entered code
  var checkCodeArray = function(code, correctCodes) {
    // Loop through Array
    for (var key in correctCodes) {
      // Compare correct and entered code
      // If match, return
      if (JSON.stringify(correctCodes[key]) == JSON.stringify(code)) {
          return { correct: true, puzzle: key, code: code };
      } 

    }

    // If no match, return
    return { correct: false, code: code };

  }
  
  // Checks entered code against a single correct code Object
  // Will return 'correct' based on match (true for match)
  // WIll return 'code' as the entered code
  var checkCodeObject = function(code, correctCode) {
    
    var count = 0;
    code = sort(code);
    correctCode = sort(correctCode);
    
    // Loop through object keys
    for (var key in correctCode) {
      // Compare correct value with entered value
      if (correctCode[key] == code[key]) {

        count ++;
        // If all keys match, return 
        if ( count == Object.keys(correctCode).length ) {
           return { correct: true, code: code };
        }

      }

    }
    // If not all keys match, return 
    return { correct: false, code: code };
    
  }
  
}