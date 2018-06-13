const _ = require("underscore");

module.exports = function(controller) {
  
  controller.makeCard = function(bot, context, script_name, thread_name, vars, cb) {
    // console.log(context, "context in make card");
    // console.log(script_name, "script in make card");
    // console.log(vars, "vars in make card");
    // console.log(thread_name, "thread in make card");
      
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
        
        if (vars.recap)
          template.attachments[1] = convo.threads[vars.recap][0].attachments[0];
        
        if (vars.egg) {
          _.each(template.attachments[0].actions, function(btn) {
            console.log(btn);
            if (btn.name == "link_button") {
              console.log(btn.url + '/' + vars.user + '/' + vars.team);
              btn.url += '/' + vars.user + '/' + vars.team;
            }
          });
        }
        
        // if this is a locked channel, add the channel's # to the callbackId
        if (vars.funnyDigits) {
           template.attachments[1].callback_id += "_" + vars.channel.replace(" ", "_").toLowerCase(); 
        }
        
        if (vars.prisoners <= 0 && !vars.started) {
          template.attachments[0].actions.push({
            "type": "button",
            "name": "prisoners",
            "value": "onboard",
            "text": "Begin Dilemma"
          });
        }
        
        if (vars.location)
          template.location = vars.location;
        
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