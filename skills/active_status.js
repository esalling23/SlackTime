const { RTMClient } = require('@slack/client');
const { WebClient } = require('@slack/client');

module.exports = function(controller) {
  
  console.log('rtm presence');
  
  controller.on("channel_marked", function(bot, message) {
    console.log(message);
  });
    
//    var RtmClient = require('@slack/client').RtmClient;
//   var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

//   var token = process.env.botToken;

//   var rtm = new RtmClient(token);
//   //var rtm = new RtmClient(token, {logLevel: 'debug'});

//   rtm.on(RTM_EVENTS.PRESENCE_CHANGE, function (event) {

//       //presence changed either by the user or by the client when the user becomes idle
//       console.log(event.user + ': ' + event.presence);
//   });

//   rtm.on(RTM_EVENTS.MANUAL_PRESENCE_CHANGE, function (event) {

//     // presence manually changed by the user
//       console.log('manual presence change: ' + JSON.stringify(event) + ': ' + event.presence);
//   });


//   rtm.on(RTM_EVENTS.CHANNEL_MARKED, function(event) {
//     console.log(event);
//   });

//   rtm.start({
//     batch_presence_aware: true
//   });
  
}