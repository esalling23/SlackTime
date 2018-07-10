const _ = require("underscore");
const { WebClient } = require("@slack/client");
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

var remote_codes = {
  0: [],
  1: [],
  2: []
}

module.exports = function(controller) {

  controller.studio.before("three_buttons", function(convo, next) {
    var id = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id;
    controller.storage.teams.get(id, function(team, err) {
      team.users = _.map(team.users, function(user) {
        if (!user.startBtns || user.startBtns.length <= 3)
          user.startBtns = ["primary","danger","default"];

        return user;
      });
      controller.storaage.teams.save(team, function(saved) {

        next();

      });
    });

  });

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


  controller.studio.before("aris_door", function(convo, next) {
    var menus = convo.threads.default[0].attachments[0].actions;
    var aris_code = process.env.aris_code.split("-");

    _.each(menus, function(menu) {

      menu.options = generateCodes(menu, menus, aris_codes, aris_code);

    });

    next();
  });

  controller.studio.before("remote", function(convo, next) {
    var menus = _.where(convo.threads.channel_code[0].attachments[0].actions, { type: "select" });
    var remote_words = process.env.remoteCodes;

    _.each(menus, function(menu) {

      menu.options = generateCodes(menu, menus, remote_codes, remote_words, true);

    });

    next();
  });

  controller.studio.before("egg_table", function(convo, next) {

    var team = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id;

    var btns = convo.threads.default[0].attachments[0].actions;

    request.get(process.env.egg_domain + '/check/' + team, function(err, res, body) {
      // console.log(body, btns);
      body = JSON.parse(body);

      _.each(body.grabbed, function(user) {
          var userBtn = _.filter(btns, function(btn) {
            // console.log(btn.url, user.type);
            return btn.value == user.type;
          })[0];
        // console.log(userBtn);

          if (userBtn) {
            userBtn.text = "~" + userBtn.text + "~";
            userBtn.name = "taken";
            userBtn.value = "";
            userBtn.style = "danger";
          }
          // console.log(userBtn);
      });

      next();
    });

  });

  controller.studio.before("pictures", function(convo, next) {

    var team = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id;
    var altered = {
      bpl: "http://res.cloudinary.com/extraludic/image/upload/v1/escape-room/LIBRARY.jpg",
      aquarium: "http://res.cloudinary.com/extraludic/image/upload/v1/escape-room/AQUARIUM.jpg",
      mit: "http://res.cloudinary.com/extraludic/image/upload/v1/escape-room/MIT.jpg"
    }

    controller.storage.teams.get(team, function(err, res) {

      if (res.uploadedImages && res.uploadedImages.length > 0) {
        convo.threads.default[0].attachments[0].image_url = res.uploadedImages[0].url;

        if (!res.albumImages) {
          res.albumImages = _.groupBy(_.filter(res.uploadedImages, function(i) {
            return i.location != undefined
          }), "location");

          res.albumImages.bpl.push({ url: altered.bpl });
          res.albumImages.mit.push({ url: altered.mit });
          res.albumImages.aquarium.push({ url: altered.aquarium });

          res.uploadedImages = _.flatten(_.values(res.albumImages));
        }

        controller.storage.teams.save(res, function(err, saved) {
          // console.log(saved.uploadedImages);
          next();
        });

      } else
        next();
    });

  });

  var generateString = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 3; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  var generateCodes = function(menu, menus, codes, answer, word) {
    menu.options = [];
    var length = word ? controller.remoteWords.length : 99;

    for (var x = 0; x < length; x++) {
      var string;

      if (word)
        string = controller.remoteWords[x];
      else
        string = generateString();

      if (!codes[menus.indexOf(menu)][x])
        codes[menus.indexOf(menu)][x] = { text: string, value: string };

      menu.options[x] = codes[menus.indexOf(menu)][x];

    }

    if (word) {
      _.each(controller.remoteCodes, function(code, ind) {
        menu.options.push({ text: code, value: code });
      });
    } else {
      menu.options[100] = { text: answer[menus.indexOf(menu)], value: answer[menus.indexOf(menu)] };
    }

    return _.shuffle(menu.options);
  }

}
