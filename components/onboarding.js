var debug = require('debug')('botkit:onboarding');
var fs = require("fs");
var _ = require("underscore");

const { WebClient } = require('@slack/client');

var channels = ["gamelog", "theLabyrinth", "map"], 
    mapChannel,
    globalChannels = [], 
    globalMembers = [],
    creator,
    memberCount;

function isUser(member) {
  // console.log(member.name, "is the member being checked");
  if (member.is_bot || member.name == process.env.botName || member.name == "slackbot")
    return false;
  else
    return true;
}

module.exports = function(controller) {
  
    controller.on('onboard', function(bot, team, auth) {
            
      const token = auth.access_token;

      var web = new WebClient(token);
      controller.storage.teams.get(team.id, function (error, team) {
       web.users.list().then((res) => {
                
         // reset data
         team.users = [];
         team.currentState = 'default';
         team.events = [];
         team.codesEntered = [];
         team.uploadedImages = [];
         team.image_channel_id = "";
         team.image_feedback = undefined;
         
          // console.log(res);
         creator = bot.config.createdBy;

         _.each(res.members, function(user) {
            var thisUser = _.findWhere(team.users, { userId: user.id });
            if (isUser(user) && !thisUser) 
              team.users.push({ userId: user.id, name: user.name });
                                      
         });
         
         _.each(team.users, function(user) {
            
            bot.api.im.open({ user: user.userId }, function(err, direct_message) { 
              console.log(err, direct_message);
              console.log(direct_message, "opened the onboarding message");

              if (err) {
                debug('Error sending onboarding message:', err);
              } else {
                // console.log(user.id);
                controller.studio.runTrigger(bot, 'welcome', user.userId, direct_message.channel.id, direct_message).catch(function(err) {
                  debug('Error: encountered an error loading onboarding script from Botkit Studio:', err);
                });
                
              }

            });

         });
         
         team.oauth_token = auth.access_token;
         
         // console.log(saved, " we onboarded this team");              
          web.groups.create("game_log").then((channel, err) => {

            var channelId = channel.group.id;
            
            team.gamelog_channel_id = channelId;

            var data = _.map(team.users, function(user) {
              return [ web, user.userId, channelId, team.users.indexOf(user) ]
            });

            data.push([ web, team.bot.user_id, channelId, 1 ]);

            // console.log(data, "is the data we have");

            var mapPromises = data.map(channelJoin);
            // console.log("completed channel joins");

            var results = Promise.all(mapPromises);

            results.then(members => {
              console.log("completed promises");

              setTimeout(function() {
                controller.studio.get(bot, 'gamelog', creator, channelId).then(convo => {
                  convo.activate();
                }).catch(function(err) {
                  debug('Error: encountered an error loading onboarding script from Botkit Studio:', err);
                });
                controller.storage.teams.save(team, function(err, saved) {
                  console.log("saved in the onboarding: ", saved);
                });
              }, 100 * data.length);
            });

          }).catch(err => console.log(err));

            
                   
       }).catch((err) => { console.log(err) }); // End users.list call

    
    });
  
  });

}
      
var channelJoin = function channelJoin(params) {

  // console.log(params, "are the params in this join");
  // Set a timeout for 1 sec each so that we don't exceed our Slack Api limits
  setTimeout(function() {
    var web = params[0];
    var member = params[1].toString();
    var channel = params[2].toString();
    console.log(member, "is the member that will join " + channel);

    // check if user is bot before adding
    // TODO check if user is already in channel
    if (member) {
      // var member = member["id"];

      web.groups.info(channel).then(channelData => {
        // console.log(channelData);
        if (channelData) {
          // console.log(params[1], isUser(params[1]));

          if (isUser(params[1])) {

            // Invite each user to the labyrinth chat channel
            return web.groups.invite(channel, member)
              .then(res => {
                // console.log(res, "is the channel res");
                return res;
              }).catch((err) => { console.log(err) });

          }
        }
      }).catch(err => console.log(err));

    }

  }, 100 * (params[3]+1));

};// End channel Join

      
