var debug = require('debug')('botkit:channel_join');
const _ = require("underscore");
const { WebClient } = require('@slack/client');

module.exports = function(controller) {

    controller.on('team_join', function(bot, message) {

        console.log("a user joined", message);
      
        controller.storage.teams.get(message.team_id, function(err, team) {
          
          team.users.push({
            userId: message.user.id, 
            name: message.user.name
          });
          
          team.users = team.users;
          
          controller.storage.teams.save(team, function(err, saved) {
            console.log(saved, "someone joined so we added them to the users list");
            
            bot.api.im.open({ user: message.user.id }, function(err, direct_message) { 

              if (err) {
                console.log('Error sending onboarding message:', err);
              } else {
                // console.log(user.id);
                controller.studio.runTrigger(bot, 'welcome', message.user.id, direct_message.channel.id, direct_message).catch(function(err) {
                  console.log('Error: encountered an error loading onboarding script from Botkit Studio:', err);
                });
                var web = new WebClient(team.oauth_token);
                
                web.groups.list().then(list => {
                  var channel = _.findWhere(list.groups, { name: process.env.progress_channel }).id;
                  
                  web.groups.invite(channel, message.user.id)
                  .then(res => {
                    console.log(res);
                  }).catch((err) => { console.log(err) });

                }).catch(err => console.log(err));
                
              }

            });
          });
        });
      
    });

}
