const _ = require("underscore");

module.exports = function(controller) {
  
  controller.addTime = function(id) {
    
    controller.storage.teams.get(id, function(err, team) {
      
      if (!team.prisoners_dilemma) team.prisoners_dilemma = [];
      
      team.decisionCount = 0;

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
        
        console.log("time is started!");

      });
    });
    
  }
  
  setInterval(function() {
    controller.storage.teams.all().then(list => {
      _.each(list, function(team) {
        
        if (team.prisoners_dilemma) {
          
          _.each(team.prisoners_dilemma, function(obj) {
            
            var current = new Date();
            var end = new Date(obj.end.getFullYear(), obj.end.getMonth(), obj.end.getDate(), obj.end.getHours(), obj.end.getMinutes());
            var now = new Date(current.getFullYear(), current.getMonth(), current.getDate(), current.getHours(), current.getMinutes());
            if (end == now && !obj.complete) {
              // trigger event for this team
              var bot = controller.spawn(team.bot);
              controller.trigger('prisoners_check', [bot, team, obj]);
            }
            
          }); 
        }
      });
    });
  }, 60000);
  
  var getMonth = function(obj, date) {
    if ((date >= 30 && obj.getMonth() == 1) || 
        (date == 31 && [3,5,8,10].includes(obj.getMonth())) ||
         date > 31) {
      return obj.getMonth() + 1;
    } else 
      return obj.getMonth();

  }
  
}