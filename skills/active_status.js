const { RTMClient } = require("@slack/client");


module.exports = function(controller) {
  
  
//   const rtm = new RTMClient(bot.config.token);
//   rtm.start();
  controller.on('rtm_events', function(bot) {
    console.log('rtm eventing');
    
    var rtm = new RTMClient(bot.config.token);
    rtm.start();
    
    rtm.on('channel_marked', (event) => {
      console.log(event);
    });
  });
  
  // controller.on('channel_marked', (err, res) => {
  //   console.log(err, res);
  // });
}