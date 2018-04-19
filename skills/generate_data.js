const _ = require("underscore");
const fs = require('fs');
const request = require('request');
const { WebClient } = require('@slack/client');

// Script for generation event
// Pulls scripts with a certain tag for team puzzle data 
    
var team, 
    user, 
    channel;

function isUser(member) {
  console.log(member.name, "is the member being checked");
  if (member.is_bot || member.name == process.env.botName || member.name == "slackbot")
    return false;
  else
    return true;
}

module.exports = function(controller) {
  
  controller.on("generation_event", function(options) {
    
    console.log(options.team, "in the generation");
            
    if (options.user) user = options.user;
    if (options.channel) channel = options.channel;
    if (options.team) team = options.team.id;
    
    if (!channel) channel = options.message.channel;
    if (!user) user = options.message.user;
    if (!team) team = options.message.team;
    
    console.log(team);
    controller.storage.teams.get(team, function(err, teamData) {
      
      console.log(teamData, "is the gotten team" );

      if (teamData.puzzles) delete teamData.puzzles;

      teamData.currentState = 'default';
      teamData.events = [];
      teamData.codesEntered = [];
      teamData.users = [];
      teamData.uploadedImages = [];
      teamData.albumImages = undefined;
      teamData.imagesComplete = false;
      teamData.image_channel_id = "";
      teamData.image_feedback = "";
      teamData.phasesUnlocked = ["phase_1"];
      
      teamData.noChatChannels = [teamData.gamelog_channel_id];
      
      teamData.gamelog = {};
      
      for (var i = 0; i < 5; i++) {
        var phase = "phase_" + (i+1);
        teamData.gamelog[phase] = [];
      }
      
      // controller.

      // teamData.gamelogChannel
      // add users array
      var web = new WebClient(teamData.oauth_token);
      
//       web.groups.history(res.gamelog_channel_id).then(group => {
        
//         var gamelogMsg = _.filter(group.messages, function(msg) {
//           return !msg.subtype;
//         })[0];
      
        web.users.list().then(res => {
          _.each(res.members, function(user) {
            if (isUser(user))
              teamData.users.push({ userId: user.id, name: user.name });
          });

          // Set the team puzzles to the generated puzzles array
          controller.storage.teams.save(teamData, function(err, teamSaved) {
            if (err) {
              console.log("There was an error: ", err);
            }
            
            var message = { user: teamData.bot.createdBy, channel: teamData.gamelog_channel_id };
  
            controller.trigger('gamelog_update', [{bot: options.bot, event: message, team: teamSaved}]);
              

            // Check the team to make sure it was updated
            // Team should have a puzzles object now attached
            controller.storage.teams.get(teamSaved.id, function(err, teamUpdated) {
              console.log("updated: ", teamUpdated);

              if (options.forced) {
                options.bot.reply(options.message, {
                  'text': "Nice, you have updated your team's puzzles with completely fresh data!"
                });
              }

            });

          });
          
        // });

      });

    }); // End team get
  }); // End on event
}