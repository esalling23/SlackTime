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
    
    console.log(params.codeType, "is the code type in the code_entered");
    var bot = params.bot;
    controller.storage.teams.get(params.team).then(res => {
      
      var correctCodes;
      var code;
      
      // console.log(params.codeType, params.code);
      
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
        
        code = checkCodeObject(params.code, correctCodes);
        code.code = params.codeType;
        
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
        
        code = checkCodeArray(params.code, correctCodes);

      }
      
      controller.dataStore(params.event, "code", { code: code, codeType: params.codeType })
        .then(data => console.log("logged: ", data))
        .catch(err => console.log("code loggin error: ", err));
      
      // console.log(code, "is the code");
      
      if (code.correct == true) {
        
        if (params.codeType == "telegraph_key")
          code.puzzle = parseInt(code.puzzle) + 1;
        
        params.key = code;
        params.team = res;
        
        controller.trigger("state_change", [params]);

        if (code.puzzle == 'safari')
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
  
  
  var checkCodeArray = function(code, correctCodes) {
    // check if correct
    for (var key in correctCodes) {
      console.log(correctCodes[key], code);
      console.log(JSON.stringify(correctCodes[key]), JSON.stringify(code));

      if (JSON.stringify(correctCodes[key]) == JSON.stringify(code)) {

          console.log("correct");
          console.log(correctCodes[key], key);

          return { correct: true, puzzle: key, code: code };
      } 

    }

    return { correct: false, code: code };

  }
  
  
  var checkCodeObject = function(code, correctCode) {
    
    var count = 0;
    
    code = sort(code);
    correctCode = sort(correctCode);
    
    // check if correct
    for (var key in correctCode) {
      console.log("Correct key: " + key + ", value: " + correctCode[key]);
      console.log("Entered key: " + key + ", value: " + code[key]);

      if (correctCode[key] == code[key]) {

        count ++;
        console.log("correct");
        
        if ( count == Object.keys(correctCode).length ) {
           return { correct: true, code: code };
        }

      }

    }
    
    return { correct: false, code: code };
    
  }
  
}