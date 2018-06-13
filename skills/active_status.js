const { RTMClient } = require('@slack/client');
const { WebClient } = require('@slack/client');
const _ = require('underscore');

const usersToSubscribe = [];

module.exports = function(controller) {
  
  console.log('rtm presence');
  
  controller.on("channel_marked", function(bot, message) {
    console.log(message);
  });
  
//   controller.storage.teams.all(function(err, list) {
//     _.each(list, function(team) {
      
//     });
//   });
  
  controller.on("reset_subscription", function() {
    controller.say({
      type: "presence_sub",
      ids: usersToSubscribe
    });
  });
  
  // TEST: 
  
  controller.storage.teams.get("T8MJ05ZPY", function(err, team) {
    var usersToSub = _.pluck(team.users, "userId");
    console.log(usersToSub);
    // var bot = controller.spawn(team.bot);
    // bot.say({
    //   type: "presence_sub",
    //   ids: usersToSub
    // });
  });
  
  controller.on('presence_change', function(bot, event) {
    // `event` contains presence information
    console.log(event);
  });
  
}