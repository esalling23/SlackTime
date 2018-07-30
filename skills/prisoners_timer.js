const _ = require("underscore");

const milPerMin = 60000;
const minPerDay = 1440;

module.exports = function(controller) {

  // Takes a bot object and team ID
  // Sets the prisoner's dilemma time object for triggering onboarding
  controller.prisoners_time = function(bot, id, started) {

    controller.storage.teams.get(id, function(err, team) {
      var updated = false;
      // Sanity check
      if (!team.prisoner_time) team.prisoner_time = {};

      // If we aren't starting the game
      // Reset timer
      if (!started) {
        // Grab the start date (now) and end time
        var start = new Date();
        var end = controller.prisoners_initial();
        if (team.prisoner_time.start) updated = true;
        // Create new prisoner time object
        team.prisoner_time = {
          start: start,
          end: end,
          complete: false
        };
        console.log("time is started for team " + team.id, team.prisoner_time);

      } else {
        // if we are starting the game
        // empty the timer object and set team prisoner_started boolean
        team.prisoner_time = {};
        team.prisoner_started = true;
        console.log("game started, time removed " + team.prisoner_time);
      }

      controller.storage.teams.save(team, function(err, saved) {

        if (saved.prisoner_started)
          controller.prisoners_message(bot, saved.id, "default");
        else if (updated) {
          // send updated prison room
          controller.prisoners_message(bot, saved.id, "too_few_players");
        }

      });
    });

  }

  controller.prisoners_initial = function() {
    var start = new Date();
    // Add a full 24 hours
    var nextDate = new Date(start.getTime() + milPerMin * minPerDay);
    // Silly hosting uses the wrong timezone, reset it to use EST
    nextDate = new Date( nextDate.getTime() - 240 * 60000 );

    var end = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), process.env.prisoners_initial);
    console.log('setting the prisoners timer ', end);

    return end;
  }

  controller.prisoners_initial_dev = function() {
    var start = new Date();
    console.log('set prisoner timer for dev');
    return new Date(start.getTime() + process.env.prisoners_initial * milPerMin);
  }

  var getMonth = function(obj, date) {
    if ((date >= 30 && obj.getMonth() == 1) ||
        (date == 31 && [3,5,8,10].includes(obj.getMonth())) ||
         date > 31) {
      return obj.getMonth() + 1;
    } else
      return obj.getMonth();
  }



}
