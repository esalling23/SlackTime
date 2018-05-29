const _ = require("underscore");

module.exports = function(controller) {
  
  controller.addTime = function(bot, id) {
    
    controller.storage.teams.get(id, function(err, team) {
      
      if (!team.prisoners_dilemma) team.prisoners_dilemma = [];
      
      team.decisionCount = 0;
      team.prisonerSuccess = 0;

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

      var end = new Date(start.getFullYear(), month, date, hours, start.getMinutes() + parseInt(process.env.prisoners_time_limit));
      
      team.prisoners_dilemma.push({
        num: 0,
        start: start,
        end: end, 
        complete: false
      });
      
      controller.storage.teams.save(team, function(err, saved) {
        
        console.log("time is started!", saved.prisoners_dilemma);
                
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