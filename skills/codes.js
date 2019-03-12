module.exports = function (controller) {
  controller.puzzleCodes = {
    symbols: 'red, red, green, white, white, green, green, red, white',
    glyph: 'white, green, green, white, white, red, red, green, red',
    stars: 'white, white, red, red, red, green, white, red, white',
    many: 'white, green, white, white, white, white, white, white, red'
  }

  controller.safeCode = {
    0: process.env.safe_code.split('-')[0],
    1: process.env.safe_code.split('-')[1],
    2: process.env.safe_code.split('-')[2]
  }
}
