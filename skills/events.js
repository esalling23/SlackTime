const _ = require('underscore');
const request = require('request');

var dataChannel;

const { WebClient } = require('@slack/client');

// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.slackToken;

const web = new WebClient(token);

module.exports = function(controller) {
  
  
    controller.on("count_colors", function (bot, event, team) {
      
      var users = _.filter(team.users, function(user) {
        return !controller.ignoreEmails.includes(user.email)
      });

      var length = (users.length * 6) / 3;
      var ready = false;

      var redCount = 0;
      var greyCount = 0;
      var greenCount = 0;
      
      _.each(users, function(user) {
        
        if (!user.startBtns || user.startBtns.length < 3) return;
        
        _.each(user.startBtns, function(btn) {
          
          if (btn == "danger") {
            redCount++;
          } else if (btn == "primary") {
            greenCount++;
          } else {
            greyCount++;
          }
             console.log("RedCount:" + redCount);
        });
        
      });
      
      if(redCount < length && greenCount < length && greyCount < length) return;
      
      team.entered = true;
      // If any of the button counts are >= to the given length
      // Set the game to be started
      controller.storage.teams.save(team, function(err, saved) {
        var web = new WebClient(bot.config.bot.token);

        web.conversations.list({ types: "im" }).then(function(list) {
          _.each(team.users, function(user) {

            var thisIM = _.findWhere(list.channels, { user: user.userId });
            var channel = thisIM.id;

            web.conversations.history(channel).then(function(ims) {
              
              var btn_message = ims.messages[0];

              if (!btn_message || !btn_message.attachments) return;
              if (btn_message.attachments[0].callback_id != "three_color_buttons") return;

              btn_message.channel = channel;
              btn_message.user = user.userId;

              controller.makeCard(bot, btn_message, "input_nodes_1", "default", {}, function(card) {
                bot.api.chat.update({
                  channel: btn_message.channel, 
                  ts: btn_message.ts, 
                  attachments: card.attachments
                }, function(err, updated) {
                });
              });

            }).catch(err => console.log("conversation history error: ", err));

          });

        }).catch(err => console.log("im list error: ", err));
      });
      
    });
  
  
  
  
  
    // message sent in the labyrinth channel
    controller.on('ambient', function(bot, message) {
      
      var puzzleChat;
      web.channels.list().then((res) => {
          _.each(res.channels, function(channel) {
            if (channel.name == "labyrinthPuzzle")
              puzzleChat = channel;
          });
      });
      
      if (message.channel == puzzleChat.id) {
        // Message tagging event
        var theBot = bot;
      
        if (message.event.text.includes("#")) {
          // console.log(message.event.text.match(/#[a-z0-9_]+/g));
          controller.trigger('message_tagged', [bot, message, message.event.text.match(/#[a-z0-9_]+/g)]);
        } else {
          // trigger the tagging script in botkit studio
          controller.studio.runTrigger(bot, 'tagging', message.user, message.channel).catch(function(err) {
              bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + err);
          });
          
        }
      }
        

    });
  
    controller.on('garden_channel', function(bot, id) {
      controller.storage.teams.get(id, function(err, team) {
        var web = new WebClient(team.bot.app_token);
        web.groups.create(process.env.garden_channel).then(res => {

          var channelId = res.group.id;
          var data = _.map(team.users, function(user) {
            return [ channelId, user.userId ]
          });

          data.push([ channelId, team.bot.user_id ]);

          var mapPromises = data.map(invite);

          Promise.all(mapPromises).then(() => {
            console.log("invited all");
            
            web.groups.setTopic(channelId, "Channel dedicated to team chat about the ARIS game Cyber Garden puzzle.").then(res => console.log(res)).catch(err => console.log(err));
            web.groups.setPurpose(channelId, "Only use this channel for chat about the ARIS Cyber Garden puzzle.").then(res => console.log(res)).catch(err => console.log(err));
            
            team.garden_channel.id = channelId;
            team.chat_channels.push(channelId);
            controller.storage.teams.save(team, function(err, saved) {
              console.log("saved the garden channel, ", channelId);
            });
          }).catch(err => console.log(err));
          
        }).then(results => {
          console.log(results);
        }).catch(err => console.log(err));

        var invite = function(params) {
          return web.groups.invite(params[0], params[1]).then(res => {
            console.log("invited to garden ", params[1]);
          }).catch(err => console.log(err));
        }

      });
    });
    
    // Tagged a message
    controller.on('message_tagged', function(bot, message, tag) {
      
      // console.log(tag, message);
      
      // console.log(bot, "this bot is listening to taggs");
      // console.log(message, "this message is being tagged");
      var teamId = message.team.id ? message.team.id : message.team_id;
      var thisMessage = message;
      
        controller.storage.teams.get(teamId, function(err,team) {

          if (!team.puzzles) {
             bot.reply(thisMessage, "huh, looks like you haven't started working on that puzzle...are you using the right #tag?"); 
          }
          
          var puzzle = _.where(team.puzzles, { name: tag[0] });
          
          if (!puzzle.discussion) puzzle.discussion = [];
                    
          puzzle.discussion.push(thisMessage);
          
          // console.log(team.puzzles);
          
          console.storage.teams.save(team, function(err, id) {
            // console.log("team updated with tagged message");
          });

          if (err) {
            throw new Error(err);
          }

        });

    });
  
  
  // Map event for sending team the map link
  controller.on("map_event", function(options) {
    
    // bot, message, channel, team
    
    // console.log("map event message: " + JSON.stringify(options.message));
    // Based on the format of "message", set the teamId
    var teamId;

    teamId = (options.team) ? options.team.id : 
      ((options.message.team_id) ? options.message.team_id : 
          ((options.message.team.id) ? options.message.team.id : options.message.team));

    var mapLink = "/" + teamId + "/map";
    // console.log(mapLink, "is the map link for this team" );
    
    if (options.channel) {
      // console.log(options.channel, "is the map channel to post in");
      // Send this message to the specified channel
      options.bot.say({
        'channel': options.channel.id,
        'text': 'Follow this link for the team map',
        'attachments': [
            {
              "title": "Team Map",
              "title_link": process.env.domain + mapLink,
            }
         ]
      });
      
    } else if (options.message) {
    
      // Reply to the user
      options.bot.reply(options.message, {
        'text': 'Follow this link for the team map',
        'attachments': [
            {
              "title": "Team Map",
              "title_link": process.env.domain + mapLink,
            }
         ]
      });
      
    }
    
  });
  
  var downloadPhase = function(file) {
    
    console.log(file);
    
    var thisPhase;
    var count = 0;
    
    
    const phases = {
      phase_1: ["Stars.png", "directions.png", "CypherWheel.png"],
      phase_4: ["tangramsZipped.zip", "Guide.png"]
    }
    
    _.each(phases, function(files, phase) {
      console.log(files, phase);
      if (files.includes(file)) {
        console.log("the phase, ", phase);
        thisPhase = phase;
      }
      count++;

    });
    
    if (count == Object.keys(phases).length) {
      console.log("we should return the phase, ", thisPhase);

      return thisPhase;
    }
  }

  
}
