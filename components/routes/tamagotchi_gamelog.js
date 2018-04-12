const _ = require("underscore");

module.exports = function(webserver, controller) {
  webserver.post('/tamagotchi_gamelog', function(req, res) {
    
    var user = req.body.user;
    
    var log = {
      team: req.body.team,
      phase: "phase_2", 
      codeType: req.body.codeType,
      puzzle: user.tamagotchi_type,
      player: user.escape_id
    }

    console.log(log.player);

    controller.trigger('gamelog_update', [log]);
    
  });
}