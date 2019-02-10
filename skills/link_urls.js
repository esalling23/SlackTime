// Holds Link Urls object

// In studio urls should have this format:
// https://slacktime.glitch.me/link/LINK_NAME
// where LINK_NAME matches a key in the linkUrls object

// https://slacktime.glitch.me/link/intro_video

module.exports = function (controller) {
  controller.linkUrls = {
    'intro_video': 'https://vimeo.com/276042721/05a58f2195',
    'safari_video': 'https://vimeo.com/276042755/df1e47b928'
  }
    
  controller.symbolUrls = {
    0: 'https://res.cloudinary.com/extraludic/image/upload/v1523986449/escape-room/Flamingo.png',
    1: 'https://res.cloudinary.com/extraludic/image/upload/v1523986449/escape-room/ElephantG.png',
    2: 'https://res.cloudinary.com/extraludic/image/upload/v1523986449/escape-room/Croc.png', 
    3: 'https://res.cloudinary.com/extraludic/image/upload/v1523986449/escape-room/Iguana.png', 
    4: 'https://res.cloudinary.com/extraludic/image/upload/v1523986449/escape-room/Rhino.png', 
    5: 'https://res.cloudinary.com/extraludic/image/upload/v1523986449/escape-room/ElephantR.png', 
    6: 'https://res.cloudinary.com/extraludic/image/upload/v1523986454/escape-room/Parrot.png',
    7: 'https://res.cloudinary.com/extraludic/image/upload/v1523986449/escape-room/Croc.png',
    8: 'https://res.cloudinary.com/extraludic/image/upload/v1523986449/escape-room/Rhino.png'
  }
}
