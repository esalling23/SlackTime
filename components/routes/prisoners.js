const _ = require('underscore');

module.exports = function(webserver, controller) {
  
  webserver.get('prisoners/:team', function(req, res) {
    console.log('team: ' + req.params.team);
    // Time is up for a team! 
    controller.storage.teams.get(req.params.team, function(err, team) {
      var bot = controller.spawn(team.bot);
      if (team.prisoners_started) {
        var obj = _.findWhere(team.prisoners_time, { complete: false });
        controller.trigger("prisoners_check", [bot, team.id, obj]);
      } else {
        // players that will be kicked due to not responding in time.
        team.times_up = _.filter(function(player) {
          return !team.prisoner_decisions.includes(player);
        });
        
        // players that are still in the game
        team.prisoner_players = _.filter(function(player) {
          return team.prisoner_decisions.includes(player);
        });
        
        controller.storage.teams.save(team, function(err, saved) {
          controller.prisoners_message(bot, saved.id, "default");  
          controller.prisoners_message(bot, saved.id, "times_up");
        });
      }
    });
  });
  
}