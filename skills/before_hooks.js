const _ = require("underscore");
const { WebClient } = require("@slack/client");
const request = require("request");

const safe_codes = {
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

  controller.studio.before("safe", function(convo, next) {
    var menus = convo.threads.default[0].attachments[0].actions;
    var safe_code = process.env.safe_code.split("-");

    _.each(menus, function(menu) {

      menu.options = generateCodes(menu, menus, safe_codes, safe_code);

    });

    next();
  });

  const generateString = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 3; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  const generateCodes = function(menu, menus, codes, answer, word) {
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
