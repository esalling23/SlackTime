const _ = require('underscore');

module.exports = function(webserver, controller) {

  webserver.get('/prisoners/:team', function(req, res) {
    // Time is up for a team!
    controller.storage.teams.get(req.params.team, function(err, team) {
      console.log(team.id, " /n Team info");
      var bot = controller.spawn(team.bot);

      if (team.prisoner_complete) return;

      controller.prisoners_check(bot, team.id, function(users) {

        console.log(users, " are this prisoners users");

        // reset prisoner times
        team.prisoner_time.complete = true;

        controller.storage.teams.save(team, function(err, saved) {

          console.log("time to start the game!!!! :)");
          // if game is not started, start it
          controller.trigger("prisoners_onboard", [bot, saved.id]);

        });
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
