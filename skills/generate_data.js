const _ = require("underscore");
const fs = require('fs');
const request = require('request');
const { WebClient } = require('@slack/client');

// Script for generation event
// Pulls scripts with a certain tag for team puzzle data 
    
var team, 
    user, 
    channel;

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
      teamData.movements = [0];
      teamData.codesEntered = [];
      teamData.users = [];
      teamData.uploadedImages = [];
      teamData.albumImages = undefined;
      teamData.imagesComplete = false;
      
      teamData.image_channel_id = "";
      teamData.image_feedback = "";
      teamData.phasesUnlocked = ["phase_1"];
      
      teamData.prisoner_players = [];
      teamData.prisoner_started = false;
      teamData.prisoner_time = [];
      teamData.prisoner_decisions = [];
      teamData.prisoner_success = 0;
      teamData.prisoner_complete = false;
      
      teamData.noChatChannels = [teamData.gamelog_channel_id];
      
      teamData.gamelog = {};
      
      for (var i = 0; i < 5; i++) {
        var phase = "phase_" + (i+1);
        teamData.gamelog[phase] = [];
      }
      
      // add users array
      var web = new WebClient(teamData.oauth_token);
      
        web.users.list().then(res => {
          _.each(res.members, function(user) {
            if (controller.isUser(user, false)) 
              teamData.users.push({ userId: user.id, name: user.name });
          });

          // Set the team puzzles to the generated puzzles array
          if (err) {
            console.log("There was an error: ", err);
          }

          setTimeout(function() {
            // Check the team to make sure it was updated
            // Team should have a puzzles object now attached

              if (options.forced) {
                options.bot.reply(options.message, {
                  'text': "Nice, you have updated your team's puzzles with completely fresh data!"
                });
              }
            
             _.each(teamData.users, function(user) {

                options.bot.api.im.open({ user: user.userId }, function(err, direct_message) { 
                  console.log(err, direct_message);
                  console.log(direct_message, "opened the onboarding message");
                  user.bot_chat = direct_message.channel.id;
                                    
                  if (err) {
                    console.log('Error sending onboarding message:', err);
                  } else {
                    // console.log(user.id);
                    controller.studio.runTrigger(options.bot, 'welcome', user.userId, direct_message.channel.id, direct_message).catch(function(err) {
                      console.log('Error: encountered an error loading onboarding script from Botkit Studio:', err);
                    });

                  }

                });

              });
            
              setTimeout(function() {

                controller.storage.teams.save(teamData, function(err, saved) {

                  controller.trigger('gamelog_update', [{bot: options.bot, team: saved}]);

                  console.log(err, saved);

                });
              }, 2000 * teamData.users.length + 1);
              


          }, 1000);

      });
    }); // End team get
  }); // End on event
}