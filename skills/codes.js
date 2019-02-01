

module.exports = function(controller) {

  controller.puzzleCodes = {
    random: 'red, red, green, white, white, green, green, red, white',
    safari: 'white, green, green, white, white, red, red, green, red',
    hole: 'white, white, red, red, red, green, white, red, white',
    glyph: 'white, green, white, white, white, white, white, white, red',
    orb: 'red, green, white, white, white, green, white, red, white'
  }

  controller.safeCode = {
    0: process.env.safe_code.split("-")[0],
    1: process.env.safe_code.split("-")[1],
    2: process.env.safe_code.split("-")[2]
  };
}
