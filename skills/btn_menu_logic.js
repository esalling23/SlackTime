const _ = require("underscore");
const request = require("request");

module.exports = function(controller) {
  
  controller.confirmMovement = function(params) {
    
    var thread = controller.determineThread(params.script, params.user);
    var vars = {};

    if (!thread)
      thread = 'default';
    
    console.log(params.user.codesEntered, params.data.value);

    if (params.user.codesEntered) {
      if (params.user.codesEntered.includes(params.data.value)) {
        var repeat = false;
        _.each(params.script.threads, function(t,v) {
          console.log(t,v);
          if (v == "repeat") repeat = true;
        });

        if (repeat)
          thread = "repeat";
      }
    }
    
    
    if (["drawer", "many_dots", "tv_guide", "pick_up_plaque", "few_dots"].includes(params.data.value)) 
      vars.download = true;

    if (["egg_table", "egg_table_dev"].includes(params.data.value) || vars.download) {
      vars.user = params.user.userId;
      vars.team = params.team.id;
    }
        
    vars.egg = params.data.value == "egg_table";
    
    controller.makeCard(params.bot, params.event, params.data.value, thread, vars, function(card) {
        // replace the original button message with a new one
        params.bot.replyInteractive(params.event, card);
    });
  }
  
  controller.determineThread = function(script, user) {

    var thread;

    _.each(script.threads, function(t, v) {

      if (!thread || v.includes("combo")) {
        if (v.split("_").length > 1) {
          
          if (v.includes("combo")) {
            if (user.events) {

              _.each(user.events, function(event) {
                if (v.includes(event) && v.split("_")[2].includes(user.currentState)) 
                  thread = v;
              });

            }

          } else if (v.includes("state")) {
            if (user.currentState != 'default') {
              if (v.split("_")[1].includes(user.currentState)) 
                thread = v;
            }

          } else if (v.includes("event")) {
            
            if (user.events) {

              _.each(user.events, function(event) {
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