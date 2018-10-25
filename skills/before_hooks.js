const _ = require("underscore");
const { WebClient } = require("@slack/client");
const request = require("request");

const safe_codes = {
  0: [],
  1: [],
  2: []
};

const keypad_codes = {
  0: [],
  1: [],
  2: []
};

const aris_codes = {
  0: [],
  1: [],
  2: []
};

const remote_codes = {
  0: [],
  1: [],
  2: []
}

module.exports = function(controller) {

  controller.studio.before("three_buttons", function(convo, next) {
    const id = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id;

    controller.store.getTeam(id)
      .then(team => {
        team.users = _.map(team.users, function(user) {
          if (!user.startBtns || user.startBtns.length <= 3)
            user.startBtns = ["primary","danger","default"];

          return user;
        });

        controller.store.teams[team.id] = team
        next()
      })
      .catch(err => console.log(err))

  });

  controller.studio.before("bookshelf", function(convo, next) {
    const menus = convo.threads.default[0].attachments[0].actions;

    _.each(menus, function(menu) {
      menu.options = [];

      for (let x = 0; x < 99; x++) {
        menu.options[x] = { text: x+1, value: x };
      }

    });

    next();
  });

  controller.studio.before("safe", function(convo, next) {
    const menus = convo.threads.default[0].attachments[0].actions;
    const safe_code = process.env.safe_code.split("-");

    _.each(menus, function(menu) {

      menu.options = generateCodes(menu, menus, safe_codes, safe_code);

    });

    next();
  });

  controller.studio.before("keypad", function(convo, next) {
    const menus = convo.threads.default[0].attachments[0].actions;
    const keypad_code = process.env.keypad_code.split("-");

    _.each(menus, function(menu) {

      menu.options = generateCodes(menu, menus, keypad_codes, keypad_code);

    });

    next();
  });


  controller.studio.before("aris_door", function(convo, next) {
    const menus = convo.threads.default[0].attachments[0].actions;
    const aris_code = process.env.aris_code.split("-");

    _.each(menus, function(menu) {

      menu.options = generateCodes(menu, menus, aris_codes, aris_code);

    });

    next();
  });

  controller.studio.before("remote", function(convo, next) {
    const menus = _.where(convo.threads.channel_code[0].attachments[0].actions, { type: "select" });
    const remote_words = process.env.remoteCodes;

    _.each(menus, function(menu) {

      menu.options = generateCodes(menu, menus, remote_codes, remote_words, true);

    });

    next();
  });

  controller.studio.before("egg_table", function(convo, next) {

    const team = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id;
    const btns = convo.threads.default[0].attachments[0].actions;

    request.get(process.env.egg_domain + '/check/' + team, function(err, res, body) {
      body = JSON.parse(body);

      _.each(body.grabbed, function(user) {
          let userBtn = _.filter(btns, function(btn) {
            return btn.value == user.type;
          })[0];

          if (userBtn) {
            userBtn.text = "~" + userBtn.text + "~";
            userBtn.name = "taken";
            userBtn.value = "";
            userBtn.style = "danger";
          }
      });

      next();
    });

  });

  controller.studio.before("pictures", function(convo, next) {

    const teamId = convo.context.bot.config.id ? convo.context.bot.config.id : convo.context.bot.config.user_id
    const altered = {
      bpl: "http://res.cloudinary.com/extraludic/image/upload/v1/escape-room/LIBRARY.jpg",
      aquarium: "http://res.cloudinary.com/extraludic/image/upload/v1/escape-room/AQUARIUM.jpg",
      mit: "http://res.cloudinary.com/extraludic/image/upload/v1/escape-room/MIT.jpg"
    }

    controller.store.getTeam(teamId)
      .then(team => {
        if (team.uploadedImages && team.uploadedImages.length > 0) {
          convo.threads.default[0].attachments[0].image_url = team.uploadedImages[0].url

          if (!team.albumImages) {
            team.albumImages = _.groupBy(_.filter(team.uploadedImages, function(i) {
              return i.location != undefined
            }), "location")

            team.albumImages.bpl.push({ url: altered.bpl })
            team.albumImages.mit.push({ url: altered.mit })
            team.albumImages.aquarium.push({ url: altered.aquarium })

            team.uploadedImages = _.flatten(_.values(team.albumImages))
          }

          controller.store.teams[team.id] = team
          next()

        } else
          next()
      })
      .catch(err => console.log(err))

  });

  const generateString = function() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 3; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  const generateCodes = function(menu, menus, codes, answer, word) {
    menu.options = []
    const length = word ? controller.remoteWords.length : 99

    for (let x = 0; x < length; x++) {
      const string = word ? controller.remoteWords[x] : generateString()

      if (!codes[menus.indexOf(menu)][x])
        codes[menus.indexOf(menu)][x] = { text: string, value: string }

      menu.options[x] = codes[menus.indexOf(menu)][x]

    }

    if (word) {
      _.each(controller.remoteCodes, function(code, ind) {
        menu.options.push({ text: code, value: code })
      })
    } else {
      menu.options[100] = {
        text: answer[menus.indexOf(menu)],
        value: answer[menus.indexOf(menu)]
      }
    }

    return _.shuffle(menu.options);
  }

}
