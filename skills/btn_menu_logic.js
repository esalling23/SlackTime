const _ = require("underscore");

module.exports = function(controller) {
  
  controller.confirmMovement = function(params) {
    
    var thread = controller.determineThread(params.script, params.team, params.user);
    var vars = {};

    if (!thread)
      thread = 'default';
    
    console.log(params.team.codesEntered, params.data.value);

    if (params.team.codesEntered.includes(params.data.value)) {
      var repeat = false;
      _.each(params.script.threads, function(t,v) {
        console.log(t,v);
        if (v == "repeat") repeat = true;
      });
      
      if (repeat)
        thread = "repeat";
    }
    
    
    if (["drawer", "many_dots", "tv_guide", "pick_up_plaque", "few_dots"].includes(params.data.value)) 
      vars.download = true;

    if (params.data.value == "egg_table" || vars.download) {
      vars.user = params.user.userId;
      vars.team = params.team.id;
    }
        
    vars.egg = params.data.value == "egg_table";
    
    controller.makeCard(params.bot, params.event, params.data.value, thread, vars, function(card) {
        // replace the original button message with a new one
        params.bot.replyInteractive(params.event, card);
    });
  }
  
  controller.determineThread = function(script, team, user) {

    var thread;

    _.each(script.threads, function(t, v) {

      if (!thread || v.includes("combo")) {
        if (v.split("_").length > 1) {
          
          if (v.includes("combo")) {
            if (team.events) {

              _.each(team.events, function(event) {
                if (v.includes(event) && v.split("_")[2].includes(team.currentState)) 
                  thread = v;
              });

            }

          } else if (v.includes("state")) {
            if (team.currentState != 'default') {
              if (v.split("_")[1].includes(team.currentState)) 
                thread = v;
            }

          } else if (v.includes("event")) {
            
            if (v.includes('orb') && user.hasOrb) {
              thread = v;
            } else if (team.events) {

              _.each(team.events, function(event) {
                if (v.includes(event)) 
                  thread = v;
              });

            }

          }

        }
      }

    });

    return thread;
  }
}