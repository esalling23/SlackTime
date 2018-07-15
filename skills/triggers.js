

// Catches or evaluates certain triggers for dev and other purposes
module.exports = function(controller) {

  controller.catch_trigger = function(event) {

    controller.evaluateTrigger((.*), event.user).then(function(script) {
      console.log(script);
      if (process.env.environment != 'dev') return;
      else console.log('ready to trigger');
    }).catch(err => console.log('Trigger evaluation error: ', err));

  }
}
