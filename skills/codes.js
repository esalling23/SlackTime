

module.exports = function(controller) {
  
  controller.puzzleCodes = {
    random: 'red, red, green, white, white, green, green, red, white',
    safari: 'white, green, green, white, white, red, red, green, red',
    hole: 'white, white, red, red, red, green, white, red, white', 
    glyph: 'white, green, white, white, white, white, white, white, red',
    orb: 'red, green, white, white, white, green, white, red, white'
  }
  
  controller.telegraphKeys = {
    0: [process.env.telegraph_key_1.split(",")[0], process.env.telegraph_key_1.split(",")[1], process.env.telegraph_key_1.split(",")[2]],
    1: [process.env.telegraph_key_2.split(",")[0], process.env.telegraph_key_2.split(",")[1], process.env.telegraph_key_2.split(",")[2]],
    2: [process.env.telegraph_key_3.split(",")[0], process.env.telegraph_key_3.split(",")[1], process.env.telegraph_key_3.split(",")[2]],
    3: [process.env.telegraph_key_4.split(",")[0], process.env.telegraph_key_4.split(",")[1], process.env.telegraph_key_4.split(",")[2]],
    4: [process.env.telegraph_key_5.split(",")[0], process.env.telegraph_key_5.split(",")[1], process.env.telegraph_key_5.split(",")[2]], 
    5: [process.env.telegraph_key_6.split(",")[0], process.env.telegraph_key_6.split(",")[1], process.env.telegraph_key_6.split(",")[2]],
    6: [process.env.telegraph_key_7.split(",")[0], process.env.telegraph_key_7.split(",")[1], process.env.telegraph_key_7.split(",")[2]],
    7: [process.env.telegraph_key_8.split(",")[0], process.env.telegraph_key_8.split(",")[1], process.env.telegraph_key_8.split(",")[2]],
    8: [process.env.telegraph_key_9.split(",")[0], process.env.telegraph_key_9.split(",")[1], process.env.telegraph_key_9.split(",")[2]],
  };
  
  controller.bookCode = {
    0: parseInt(process.env.book), 
    1: parseInt(process.env.page), 
    2: parseInt(process.env.line)
  };

  controller.safeCode = {
    0: process.env.safe_code.split("-")[0],
    1: process.env.safe_code.split("-")[1],
    2: process.env.safe_code.split("-")[2]
  };

  controller.arisCode = {
    0: process.env.aris_code.split("-")[0],
    1: process.env.aris_code.split("-")[1],
    2: process.env.aris_code.split("-")[2]
  };

  controller.keypadCode = {
    0: process.env.keypad_code.split(',')
  };
  
  controller.bookSpecs = {
    snake: process.env.page + " Page", 
    chicken: process.env.book + " Book", 
    lizard: process.env.book + " Book", 
    shrimp: process.env.line + " Line", 
    turtle: process.env.page + " Page"
  }
  
  controller.remoteCodes = {
    '!!!': 'PROCESSOR', 
    '@@@': 'WATSON', 
    '###': 'DEEPBLUE', 
    '$$$': 'COMPRESSION', 
    '%%%': 'BIAS', 
    '^^^': 'INTERMEDIATENODE', 
    '&&&': 'GETBATCH', 
    '***': 'BITCOIN', 
    '~~~': 'ESCAPE'
  }
  
  controller.remoteCombos = {
    0: ['!!!', '@@@', '###'], 
    1: ['@@@', '###', '$$$'], 
    2: ['###', '$$$', '%%%'], 
    3: ['$$$', '%%%', '^^^'], 
    4: ['%%%', '^^^', '&&&'], 
    5: ['^^^', '&&&', '***'], 
    6: ['&&&', '***', '~~~'], 
    7: ['***', '~~~', '!!!']
  }
  
  controller.remoteWords = [
    "WORD", 
    "ANOTHERWORD"
  ]
}