const _ = require("underscore");

const milPerMin = 60000;
const minPerDay = 1440;

module.exports = function(controller) {
  
  controller.addTime = function(bot, id, initial) {
    
    controller.storage.teams.get(id, function(err, team) {
      
      if (!team.prisoner_time) team.prisoner_time = [];
      
      team.prisoner_decisions = [];

      var start = new Date();
      
      var end;
      
      if (initial) {
        end = controller.prisoners_initial();
      } else { 
        end = new Date(start.getTime() + milPerMin * process.env.prisoners_time_limit);
      }
      
      team.prisoner_time = _.map(team.prisoner_time, function(time) {
        time.complete = true;
        return time;
      });
      
      team.prisoner_time.push({
        num: team.prisoner_time.length,
        start: start,
        end: end, 
        complete: false
      });
      
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
  
  
  var getMonth = function(obj, date) {
    if ((date >= 30 && obj.getMonth() == 1) || 
        (date == 31 && [3,5,8,10].includes(obj.getMonth())) ||
         date > 31) {
      return obj.getMonth() + 1;
    } else 
      return obj.getMonth();
  }
  
  
  
}