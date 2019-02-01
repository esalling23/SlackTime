
const _ = require("underscore");

module.exports = function(controller) {

  // Gets a script with thread, vars, and logic
  // returns the conversation object
  controller.makeCard = function(bot, context, script_name, thread_name, vars, cb) {

    // If this is the decisions thread of the prisoner's dilemma,
    // set prison to true for logic later on
    if (script_name == "prisoners_dilemma" && thread_name == "decisions")
      var prison = true;

    // console.log(context, " make card context");

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

      // Use the recap thread as an attachment in the current template
      if (vars.recap)
        template.attachments[1] = convo.threads[vars.recap][0].attachments[0];

      template.username = process.env.username;
      template.icon_url = process.env.icon_url;

      // console.log(template, " make card template");

      convo.stop('card_only');
      cb(template);

    }).catch(function(err) {
        console.error('makeCard error: ', err);
    });

  };

}
