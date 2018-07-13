const _ = require('underscore');

module.exports = function(webserver, controller) {

  webserver.get('/prisoners/:team', function(req, res) {
    console.log('team: ' + req.params.team);
    // Time is up for a team!
    controller.storage.teams.get(req.params.team, function(err, team) {
      console.log(err, team.id, " /n Team info");
      var bot = controller.spawn(team.bot);
      var decisions = _.pluck(team.prisoner_decisions, "user");

      console.log(decisions, team.prisoner_complete, " /n Team complete?");

      if (team.prisoner_complete) return;

      // players that will be kicked due to not responding in time.
      team.times_up = _.filter(team.prisoner_players, function(player) {
        return !decisions.includes(player.userId);
      });

      // players that are still in the game
      team.prisoner_players = _.filter(team.prisoner_players, function(player) {
        return decisions.includes(player.userId);
      });

      // reset prisoner times
      team.prisoner_time = [];

      controller.storage.teams.save(team, function(err, saved) {

        if (saved.prisoner_started) {
          // Send times-up message to any late players
          controller.prisoners_message(bot, saved.id, "times_up");
          // check other responses if game is started
          setTimeout(function() {
            var obj = _.findWhere(saved.prisoner_time, { complete: false });
            controller.trigger("prisoners_check", [bot, saved.id, obj]);
          }, 5000);
        } else {
          console.log("this game hasn't started! let's send that message");
          // if game is not started, start it
          controller.trigger("prisoners_onboard", [bot, team.id]);
        }

      });

    });
  });

  webserver.get('/prisoners_time/:team', function(req, res) {
    console.log('time to set the prisoner time for this team ' + req.params.team);

    // Time is up for a team!
    controller.storage.teams.get(req.params.team, function(err, team) {
      console.log(err, team.id, " /n Team info");
      var bot = controller.spawn(team.bot);

      controller.prisoners_time(bot, team.id, false);

    });
  });

}
