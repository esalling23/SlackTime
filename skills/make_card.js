
const _ = require("underscore");

module.exports = function(controller) {
  
  // Gets a script with thread, vars, and logic
  // returns the conversation object
  controller.makeCard = function(bot, context, script_name, thread_name, vars, cb) {
    
    // If this is the decisions thread of the prisoner's dilemma, 
    // set prison to true for logic later on
    if (script_name == "prisoners_dilemma" && thread_name == "decisions") 
      var prison = true;
      
    controller.studio.get(bot, script_name, context.user, context.channel).then(function(convo) {
      // console.log(convo);
      var thread;
      if (vars.sameDoor) {
        thread = convo.thread;
      } else {
        thread = thread_name;
      }

      convo.changeTopic(thread_name);

      if (!convo.threads[thread]) {
        thread = 'default';
      }

      convo.vars = vars;
      var template = convo.cloneMessage(convo.threads[thread][0]);

      if (vars.image_url) 
        convo.threads.default[0].attachments[0].image_url = vars.image_url;

      if (vars.randomText)
        template.attachments[0].text = vars.randomText;

      // Use the recap thread as an attachment in the current template
      if (vars.recap)
        template.attachments[1] = convo.threads[vars.recap][0].attachments[0];

      // Logic for tamagotchi links
      if (vars.egg) {
        _.each(template.attachments[0].actions, function(btn) {
          console.log(btn);
          if (btn.name == "link_button") {
            console.log(btn.url + '/' + vars.user + '/' + vars.team);
            btn.url += '/' + vars.user + '/' + vars.team;
          }
        });
      }

      // if this is a locked tv channel, add the channel's # to the callbackId
      if (vars.funnyDigits) {
         template.attachments[1].callback_id += "_" + vars.channel.replace(" ", "_").toLowerCase(); 
      }

      // Give the template a location to be used in middleware
      if (vars.location)
        template.location = vars.location;
      
      if (vars.prisoners <= 0 && !vars.prisoners_started) {
          template.attachments[0].actions.push({
            "type": "button",
            "name": "prisoners",
            "value": "onboard",
            "text": "Begin Dilemma"
          });
        }
      
      // Prisoner decision variables for response display
      if (vars.prisoner_decisions) {
        template.attachments[0].fields = controller.prisoner_decisions(vars.decisions, thread_name);
      }
      
      // Prisoner's dilemma end message based on users;
      if (vars.prisoner_winners) {
        var message = "";
        
        if (vars.prisoner_winners.length > 2) {
          _.each(_.pluck(vars.prisoner_winners, "name"), (n, i) => {
            message += i == vars.prisoner_winners.length ? " and " + n : n + ",";
          });
          message += " split the pot!";
        } else if (vars.prisoner_winners.length == 1) {
          message += vars.prisoner_winners[0].name;
          message += " won the pot!";
        } else if (vars.prisoner_winners.length == 2) {
          message += vars.prisoner_winners[0].name + " and " + vars.prisoner_winners[1].name;
          message += " split the pot!";
        } else if (vars.prisoner_winners.length == 0) {
          message += "No one won anything!";
        }
        
        convo.setVar("prisoners_end", message);
        
      }

      template.username = process.env.username;
      template.icon_url = process.env.icon_url;

      console.log(template);

      convo.stop('card_only');
      cb(template);

    }).catch(function(err) {
        console.error('makeCard error: ', err);
    });
    
  };
  
}