// Holds Link Urls object

// In studio urls should have this format:
// https://daedalusgame/link/LINK_NAME/{{consts.team}}/{{consts.user}}
// where LINK_NAME matches a key in the linkUrls object

// https://daedalusgame/link/prisoners_steal/{{consts.team}}/{{consts.user}}

module.exports = function (controller) {
  controller.linkUrls = {
    'intro_video': 'https://vimeo.com/276042721/05a58f2195',
    'safari_video': 'https://vimeo.com/276042755/df1e47b928'
  }
}
