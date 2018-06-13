const _ = require("underscore");
const fs = require('fs');
const request = require('request');


// Script for generation event
// Pulls scripts with a certain tag for team puzzle data 
    
var team, 
    user, 
    channel;

module.exports = function(controller) {
  
  controller.on("state_change", function(options) {
    
    console.log(options.key, "in the state change");
    var res = options.team;
    var code = options.key.puzzle;
    var thisUser = _.findWhere(res.users, { userId: options.user });

    // safety check
    if (!thisUser.events) thisUser.events = [];
    if (!thisUser.codesEntered) thisUser.codesEntered = [];
    if (!res.codesEntered) res.codesEntered = [];
    // safety check
    if (!thisUser.currentState) {
      thisUser.currentState = "default";
    }
    
    var thread = 'correct';
    
    if (["telegraph_key", "buttons", "remote"].includes(options.codeType))
      thread += '_' + code;
    
    console.log(thread, "is the thread");
    
    // Has the player already entered this code?
    if (thisUser.codesEntered.includes(code) && !['bookshelf', 'telegraph_key', 'keypad'].includes(options.codeType)) {
      var vars = {};
      
      if (options.codeType == 'buttons' || options.codeType == 'remote') vars.recap = thread;
      
      controller.makeCard(options.bot, options.event, options.codeType, 'repeat', vars, function(card) {
        // replace the original button message with a new one
        options.bot.replyInteractive(options.event, card);

      });
      
    } else {
      
      if (options.phaseUnlocked) {
        if (!res.phasesUnlocked) res.phasesUnlocked = ["phase_1"];
        if (!res.phasesUnlocked.includes(options.phaseUnlocked)) 
          res.phasesUnlocked.push(options.phaseUnlocked);
        
        // sanity check
        res.phasesUnlocked = _.filter(res.phasesUnlocked, function(phase) {
          return phase != null;
        });
      }
      
      if (['random', 'safe', 'orb'].includes(code)) {
        
        if (!thisUser.events.includes(code))
            thisUser.events.push(code);
        
      } else {
        thisUser.currentState = findState(thisUser.currentState, code);
      }
      
      res.users = _.map(res.users, function(user) {
        if (user.userId == thisUser.userId)
          return thisUser;
        else 
          return user;
      });

      controller.storage.teams.save(res).then((updated) => {

        controller.studio.getScripts().then(scripts => {
          // console.log("We saved this new team state", updated);
          var vars = {};
          
          var thisScript = _.findWhere(scripts, { name: options.codeType });

          var thisPhase = _.filter(thisScript.tags, function(tag) {
            return tag.includes('phase');
          })[0];
          
          controller.makeCard(options.bot, options.event, options.codeType, thread, vars, function(card) {
            // console.log(card, "is the card from the state change");
            // replace the original button message with a new one
            options.bot.replyInteractive(options.event, card);

          });
          
          thisUser = _.findWhere(updated.users, { userId: options.user });
          
          if (thisUser.codesEntered.includes(code)) return;
          
          if (options.codeType != "bookshelf") {
            thisUser.codesEntered.push(code);
            updated.codesEntered.push(code);
          }
          
          controller.storage.teams.save(updated).then((saved) => {

            var log = {
              bot: options.bot, 
              team: options.event.team.id ? options.event.team.id : options.event.team,
              phase: thisPhase, 
              event: options.event,
              codeType: options.codeType,
              player: options.event.user, 
              code: options.key.code
            }

            if (log.codeType == "buttons" || log.codeType == "telegraph_key")
              log.puzzle = code;
            else if (["bookshelf", "safe", "aris_door", "keypad"].includes(log.codeType))
              log.puzzle = log.codeType;

            console.log(log.codeType, log.puzzle);

            controller.trigger('gamelog_update', [log]);
          
          });

        });
        

      }); 
    }

    
  }); // End on event
}


var findState = function(currentState, event) {
      var newState;
  
      switch(currentState.toLowerCase()) {

        // everything is normal
        case 'default':
          
          switch(event) {
                
            case 'safari':
              
              // safari video state
              newState = "a"
              
              break;
              
            case 'hole':
              
              // hole state
              newState = "b"
              console.log(newState);
              break;
            
            case 'glyph':
              
              // abstract painting glyph state
              newState = "c"
              
              break;
              
            default: 
              newState = currentState.toLowerCase();
              break;
              
          }

          break;

        // video
        case 'a':
          
          switch(event) {
              
            case 'hole':
              
              newState = "e"
              
              break;
              
            case 'glyph':
              
              newState = "d"
              
              break;
              
            default: 
              newState = currentState.toLowerCase();
              break;
              
          }

          break;
          
        // hole
        case 'b':
          
          switch(event) {
              
            case 'safari':
              // hole and video
              newState = "e"
              
              break;
              
            case 'glyph':
              // hole and glyph
              newState = "f"
              
              break;
              
            default: 
              newState = currentState.toLowerCase();
              break;
              
          }

          break;
        
        // glyph
        case 'c':
          
          switch(event) {
              
            case 'safari':
              
              newState = "d"
              
              break;
              
            case 'hole':
              
              newState = "f"
              
              break;
              
            default: 
              newState = currentState.toLowerCase();
              break;
              
          }

          break;
          
        // video and glyph
        case 'd':
          
          switch(event) {
              
            case 'hole':
              // everything
              newState = "g"
              
              break;
              
            default: 
              newState = currentState.toLowerCase();
              break;
              
          }

          break;
          
        // hole and video
        case 'e':
          
          switch(event) {
              
            case 'glyph':
              // everything
              newState = "g"
              
              break;
              
            default: 
              newState = currentState.toLowerCase();
              break;
              
          }

          break;
          
        // hole and glyph
        case 'f':
          
          switch(event) {
              
            case 'safari':
              
              // everything
              newState = "g"
              
              break;
              
            default: 
              newState = currentState.toLowerCase();
              break;
              
          }

          break;

      }
  
  return newState;
  
}