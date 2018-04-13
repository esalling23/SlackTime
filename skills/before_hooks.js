const _ = require("underscore");
const request = require("request");

var safe_codes = {
  0: [],
  1: [], 
  2: []
};

var keypad_codes = {
  0: [],
  1: [], 
  2: []
};

var aris_codes = {
  0: [],
  1: [], 
  2: []
};

var tamagotchi_codes = {
  0: [],
  1: [], 
  2: []
};

module.exports = function(controller) {
  
  controller.studio.before("bookshelf", function(convo, next) {
    var menus = convo.threads.default[0].attachments[0].actions;
    
    _.each(menus, function(menu) {
      menu.options = [];
      
      for (var x = 0; x < 99; x++) {
        menu.options[x] = { text: x+1, value: x };
      }
                  
    });
    
    next();
  });
  
  controller.studio.before("safe", function(convo, next) {
    var menus = convo.threads.default[0].attachments[0].actions;
    var safe_code = process.env.safe_code.split("-");
    
    _.each(menus, function(menu) {
      
      menu.options = generateCodes(menu, menus, safe_codes, safe_code);
      
    });
    
    next();
  });
  
  controller.studio.before("keypad", function(convo, next) {
    var menus = convo.threads.default[0].attachments[0].actions;
    var keypad_code = process.env.keypad_code.split("-");
    
    _.each(menus, function(menu) {
      
      menu.options = generateCodes(menu, menus, keypad_codes, keypad_code);
      
    });
    
    next();
  });
  
  controller.studio.before("tamagotchi_door", function(convo, next) {
    var menus = convo.threads.default[0].attachments[0].actions;
    var tamagotchi_code = process.env.tamagotchi_code.split("-");
    
    _.each(menus, function(menu) {
      
      menu.options = generateCodes(menu, menus, tamagotchi_codes, tamagotchi_code);
      
    });
    
    next();
  });
  
  controller.studio.before("aris_door", function(convo, next) {
    var menus = convo.threads.default[0].attachments[0].actions;
    var aris_code = process.env.aris_code.split("-");
    
    _.each(menus, function(menu) {
      
      menu.options = generateCodes(menu, menus, aris_codes, aris_code);
      
    });
    
    next();
  });
  
  controller.studio.before("egg_table", function(convo, next) {
    
    var team = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id;

    var btns = convo.threads.default[0].attachments[0].actions;

    request.get('https://tamagotchi-production.glitch.me/check/' + team, function(err, res, body) {
      console.log(body, btns);
      body = JSON.parse(body);
      
      _.each(body.grabbed, function(user) {
          var userBtn = _.filter(btns, function(btn) {
            console.log(btn.url, user.type);
            return btn.url.includes(user.type);
          })[0];
        console.log(userBtn);
        
          if (userBtn) {
            userBtn.text = "~" + userBtn.text + "~";
            userBtn.name = "taken";
            userBtn.url = "";
            userBtn.style = "danger";
          }
          console.log(userBtn);        
      });
      
      next();
    });
    
  });
  
  controller.studio.before("pictures", function(convo, next) {
  
    var team = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id;

    controller.storage.teams.get(team, function(err, res) {
      console.log(res.uploadedImages[0]);
      console.log(convo.threads.default[0].attachments[0]);
      if (res.uploadedImages && res.uploadedImages.length > 0)
        convo.threads.default[0].attachments[0].image_url = res.uploadedImages[0].url;
    });
    
    next();
  });
  
  var generateString = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 3; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
  
  var generateCodes = function(menu, menus, codes, answer) {
    menu.options = [];

    for (var x = 0; x < 99; x++) {
      var string = generateString();

      if (!codes[menus.indexOf(menu)][x]) 
        codes[menus.indexOf(menu)][x] = { text: string, value: string };

      menu.options[x] = codes[menus.indexOf(menu)][x];

    }

    menu.options[100] = { text: answer[menus.indexOf(menu)], value: answer[menus.indexOf(menu)] };

    return _.shuffle(menu.options);
  }
  
}
