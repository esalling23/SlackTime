var debug = require('debug')('botkit:channel_join');

module.exports = function(controller) {

    controller.on('team_join', function(bot, message) {

        console.log("a user joined", message);
      
    });

}
