const _ = require('underscore');

module.exports = function(webserver, controller) {
  
  webserver.get('/prisoners/:team', function(req, res) {
    console.log('team: ' + req.params.team);
    // Time is up for a team! 
    controller.storage.teams.get(req.params.team, function(err, team) {
      var bot = controller.spawn(team.bot);
      var decisions = _.pluck(team.prisoner_decisions, "user");
      
      if (team.prisoner_complete) return;
      
      // players that will be kicked due to not responding in time.
      team.times_up = _.filter(team.prisoner_players, function(player) {
        return !decisions.includes(player.userId);
      });

      // players that are still in the game
      team.prisoner_players = _.filter(team.prisoner_players, function(player) {
        return decisions.includes(player.userId);
      });
      
      controller.storage.teams.save(team, function(err, saved) {

        if (saved.prisoner_started) {
          // Send times-up message to any late players
          controller.prisoners_message(bot, saved.id, "times_up");
          // check other responses if game is started
          var obj = _.findWhere(saved.prisoner_time, { complete: false });
          controller.trigger("prisoners_check", [bot, saved.id, obj]);
        } else {
          // if game is not started, start it
          controller.prisoners_message(bot, saved.id, "default");  
        }
        
      });
    });
  });
  
}