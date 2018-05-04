const _ = require("underscore");
const request = require("request");
const fs = require('fs');
const { WebClient } = require('@slack/client');
const token = process.env.slackToken;
const web = new WebClient(token);

module.exports = function(controller) {
  
  
  controller.on("prisoners_onboard", function(bot, message) {

    var id = message.team.id ? message.team.id : message.team
    // add everyone to a picture-counting channel 
    controller.storage.teams.get(id, function(err, team) {
      
      var token = team.oauth_token;

      var web = new WebClient(token); 

      team.prisoner_players = team.users;
      team.prisoners_dilemma = [];
      team.prisoners_messages = [];

      team.prisonerSuccess = 0;
      team.prisonerDecisions = 0;
      
      team.sharingUsers = [];
      team.stealingUsers = [];
      team.blockingUsers = [];

      controller.storage.teams.save(team, function(err, saved) {
        
        console.log(err, saved);
        
        controller.addTime(bot, saved.id);

      });
        
    });
  });
  
  
  // controller.on('user_channel_join, user_group_join', function(bot, message) {
  //     choiceTimer = 60;
  //     Timer = setInterval (function () {
  //       if(choiceTimer > 0) {
  //         choiceTimer -= 1;
  //         console.log(choiceTimer);
  //       }
  //       else if(!bannedForTime){
  //       bot.startConversation(message, function(err, convo){
  //         convo.say({
  //           username: "Daedalus",
  //           channel: "C7V493SA3",
  //           ephemeral: true,
  //           text: "Sorry, but you were eliminated from the game. You won't get any prize money."
  //         });
  //       });
  //         bannedForTime = true;
  //         console.log("Done");
  //         clearInterval(Timer);
  //       }
  //     }, 1000);
  // });
  
  
}