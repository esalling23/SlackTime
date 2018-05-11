

module.exports = function(controller) {
  
  controller.puzzleCodes = {
    random: 'red, red, green, grey, grey, green, green, red, grey',
    safari: 'grey, green, green, grey, grey, red, red, green, red',
    hole: 'grey, grey, red, red, red, green, grey, red, grey', 
    glyph: 'grey, green, grey, grey, grey, grey, grey, grey, grey',
    orb: 'red, green, grey, grey, grey, green, grey, red, grey'
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
    0: process.env.keypad_code.split("-")[0],
    1: process.env.keypad_code.split("-")[1],
    2: process.env.keypad_code.split("-")[2]
  };
  
}