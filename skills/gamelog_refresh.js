const _ = require("underscore");

const puzzleNames = {
  random: "Random Few Dots", 
  safari: "Safari Video", 
  glyph: "Abstract Symbols Glyph", 
  orb: "Special Orb",
  hole: "Few Dots Hole",
  bookshelf: "Secret Bookshelf", 
  aris_door: "Door Out of ARIS", 
  keypad: "Super Sneaky Keypad"
}

const eggNames = {
  chicken: "Clucking",
  snake: "Slivery", 
  shrimp: "Squishy", 
  lizard: "Scaly", 
  turtle: "Flipping"
}

const hatchNames = {
  chicken: "Hatched Chick",
  snake: "Snake", 
  shrimp: "Shrimp", 
  lizard: "Lizard", 
  turtle: "Turtle"
}

const evolveNames = {
  chicken: "Chicken",
  snake: "Crocodile", 
  shrimp: "Dragon", 
  lizard: "T-Rex", 
  turtle: "Sauropod"
}

module.exports = function(controller) {
  
  controller.gamelogEvent = function(name, event, date) {
    
    var message = "*" + name + "*";
    
    switch (event.type) {
      case 'buttons': 
        message += " put in a correct button code, solving the " + puzzleNames[event.puzzle] + " puzzle!\n";
        break;
      
      case 'bookshelf': 
        message += " found a special line from the bookshelf! The line turned into a black hole and lead to node 5!\n";
        break;
        
      case 'tamagotchi_complete': 
        message += " satiated the " + evolveNames[event.puzzle] + ", and got a special clue as a reward.\n";
        break;
        
      case 'tamagotchi_evolve': 
        message += " fed and grew the " + hatchNames[event.puzzle] + ", and it evolved into a " + evolveNames[event.puzzle] + "!!\n";
        break;
        
      case 'tamagotchi_hatch':
        message += " hatched the " + eggNames[event.puzzle] + " egg! They now have a " + hatchNames[event.puzzle] + "!\n";
        break;
        
      case 'tamagotchi_egg': 
        message += " picked up the " + eggNames[event.puzzle] + " egg!\n";
        break;
        
      case 'safe': 
        message += " unlocked the safe in node 2, which lead to node 4!\n";
        break;
      
      case 'aris_door':
        message += " unlocked the door out of node 5 and found node 6!\n";
        break;
        
      case 'keypad':
        message += " put in the correct keypad code and made it to the final node!\n";
        break;
     }
    
    message += "Time Completed: " + date + "\n\n";
    
    return message;
  }
   
  controller.gamelogRefresh = function(phase, team) {
          
    var text = "";
    var phaseEvents = team.gamelog["phase_" + phase];

    if (!phaseEvents || phaseEvents.length <= 0)
      return "no puzzles solved";
    
    _.each(phaseEvents, function(item) {

      var newLogMsg = controller.gamelogEvent(item.unlockedBy.name, item.event, item.date);

      text += newLogMsg;

    });

    return text;

  }
  
}