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
      
      var web = new WebClient(team.oauth_token); 

      team.prisoner_players = _.where(team.users, { prisoner: true });
      team.prisoners_started = true;

      team.prisoner_success = 0;
      team.prisoner_decisions = [];
      
      controller.storage.teams.save(team, function(err, saved) {
        
        console.log(err, saved);
        
        controller.addTime(bot, saved.id);

      });
        
    });
  });
  
  
}