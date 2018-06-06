const _ = require("underscore");

module.exports = function(controller) {
  
  controller.addTime = function(bot, id) {
    
    controller.storage.teams.get(id, function(err, team) {
      
      if (!team.prisoners_time) team.prisoners_time = [];
      
      team.prisoner_decisions = [];

      var start = new Date();

      var hours;
      var date;
      var month;
      
      if (start.getHours() + process.env.prisoners_time_limit > 24) {
        hours = (start.getHours() + parseInt(process.env.prisoners_time_limit)) - 24;
        date = start.getDate() + 1;
        month = getMonth(start, date);
      } else {
        hours = start.getHours();
        date = start.getDate();
        month = start.getMonth();
      }

      var end = new Date(start.getFullYear(), month, date, hours, start.getMinutes());
      
      team.prisoners_time.push({
        num: team.prisoners_time.length,
        start: start,
        end: end, 
        complete: false
      });
      
      controller.storage.teams.save(team, function(err, saved) {
        
        console.log("time is started for team " + saved.id, saved.prisoners_time);
                
        if (saved.prisoners_started)
          controller.prisoners_message(bot, saved.id, "default");

      });
    });
    
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