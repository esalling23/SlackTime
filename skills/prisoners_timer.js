const _ = require("underscore");

const milPerMin = 60000;
const minPerDay = 1440;

module.exports = function(controller) {

  // Takes a bot object and team ID
  // Sets the prisoner's dilemma time object for triggering onboarding
  controller.prisoners_time = function(bot, id, started) {

    controller.storage.teams.get(id, function(err, team) {

      // Sanity check
      if (!team.prisoner_time) team.prisoner_time = {};

      // If we aren't starting the game
      // Reset timer
      if (!started) {
        // Grab the start date (now) and end time
        var start = new Date();
        var end = controller.prisoners_initial_dev();
        // Create new prisoner time object
        team.prisoner_time = {
          start: start,
          end: end,
          complete: false
        };
      } else {
        // if we are starting the game
        // empty the timer object and set team prisoner_started boolean
        team.prisoner_time = {};
        team.prisoner_started = true;
      }

      controller.storage.teams.save(team, function(err, saved) {

        console.log("time is started for team " + saved.id, saved.prisoner_time);

        if (saved.prisoner_started)
          controller.prisoners_message(bot, saved.id, "default");

      });
    });

  }

  controller.prisoners_initial = function() {
    var start = new Date();
    var nextDate = new Date(start.getTime() + milPerMin * minPerDay);
    var end = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), process.env.prisoners_initial);

    return end;
  }

  controller.prisoners_initial_dev = function() {
    var start = new Date();

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
