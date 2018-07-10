var debug = require('debug')('botkit:channel_join');
const _ = require("underscore");
const { WebClient } = require('@slack/client');

module.exports = function(controller) {

    controller.on('team_join', function(bot, message) {

        console.log("a user joined", message);
        if (!controller.isUser(message.user)) return;
      
        controller.storage.teams.get(message.team_id, function(err, team) {
          
          if (_.findWhere(team.users, { userId: message.user.id })) return;
          
          var web = new WebClient(team.bot.app_token);

          web.users.list().then(res => {
            
            var thisUser = _.findWhere(res.members, { id: message.user.id });
            
            team.users.push({
              userId: message.user.id, 
              name: message.user.name, 
              startBtns: ["default", "primary", "danger"], 
              email: thisUser.profile.email
            });

            team.users = team.users;

            controller.storage.teams.save(team, function(err, saved) {
              console.log(saved, "someone joined so we added them to the users list");

              web = new WebClient(team.bot.app_token);
              web.groups.list().then(list => {
                var channel = _.findWhere(list.groups, { name: process.env.progress_channel }).id;

                web.groups.invite(channel, message.user.id)
                .then(res => {

                  var image = _.findWhere(list.groups, { name: process.env.image_counter_channel });
                  if (image) {
                     web.groups.invite(image.id, message.user.id)
                    .then(res => {
                      console.log(res);
                    }).catch((err) => { console.log(err) });
                  }

                  var garden = _.findWhere(list.groups, { name: process.env.garden_channel });
                  if (garden) {
                     web.groups.invite(garden.id, message.user.id)
                    .then(res => {
                      console.log(res);
                    }).catch((err) => { console.log(err) });
                  }

                }).catch((err) => { console.log(err) });

              }).catch(err => console.log(err));

              if (!saved.gameStarted) return;

              bot.api.im.open({ user: message.user.id }, function(err, direct_message) { 

                saved.users = _.map(saved.users, function(u) {
                  if (u.userId == message.user.id) 
                    u.bot_chat == direct_message.channel.id;
                  
                  return u;
                });
                
                controller.storage.teams.save(saved, function(err, updated) {
                  
                  if (err) {
                    console.log('Error sending onboarding message:', err);
                  } else {
                    // console.log(user.id);
                    controller.studio.get(bot, 'onboarding', message.user.id, direct_message.channel.id).then(convo => {

                      var template = convo.threads.default[0];
                      template.username = process.env.username;
                      template.icon_url = process.env.icon_url;

                      convo.setVar("team", team.id);
                      convo.setVar("user", message.user.id);

                      convo.activate();

                    });
                  }
                  
                });

              });
            });
          }).catch(err => console.log("Team Join User Profile Get Error: ", err));
          
        });
      
    });

}
