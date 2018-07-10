const _ = require('underscore');
const fs = require('fs');

module.exports = function(controller) {

  var data = JSON.parse(fs.readFileSync('./scripts.json', 'utf8'));
  var replace = {
    "escape-room-production.glitch.me": process.env.domain,
    "tamagotchi-production.glitch.me": process.env.egg_domain
  };

  data = _.map(data, function(d) {
    _.each(d.script, function(s) {
      _.each(s.script, function(x) {
        if (x.attachments) {
          _.each(x.attachments, function(a) {
            if (a.actions) {
              _.each(a.actions, function(btn) {
                console.log(btn, " is a button object");
                if (btn.name == "link_button") {
                  console.log("this button is a link!!");
                  btn.url = btn.url.replace("escape-room-production.glitch.me", process.env.domain);
                  btn.url = btn.url.replace(/tamagotchi-production.glitch.me|tamagotchi-dev.glitch.me/g, process.env.egg_domain);
                  console.log(btn.url);
                }
              });
            }
          });
        }
      });
    });


    return d;
  });

  var json = JSON.stringify(data);
  fs.writeFile('./newscripts.json', json, 'utf8', function() {
    console.log('done');
  });


  controller.codeStages = {
    "buttons": "Stage 1, Node 3",
    "safe": "Stage 1, Node 2",
    "bookshelf": "Stage 2, Node 4",
    "aris_door": "Stage 3, Node 5",
    "telegraph_key": "Stage 4, Node 6",
    "keypad": "Stage 4, Node 6",
    "remote": "Stage 4, Node 6"
  }

  controller.eventStages = function(bot, event) {
    var place = {};
    var script;

    return controller.studio.getScripts(bot).then(list => {

      _.each(list, function(s) {
        if (s.tags.includes(event.callback_id)) {
          console.log('the script we are looking for is: ' + s.name);
          script = s.name;
          place.phase = _.filter(s.tags, function(t) {
            console.log(t, t.split('_')[0] == 'phase');
            return t.split('_')[0] == 'phase';
          })[0].replace('phase_', '');

          console.log(place.phase);

          place.node = parseInt(place.phase) + 2;

          if (s.name == 'input_nodes_1')
            place.node = 1;
          else if (s.name == 'input_nodes_2' || s.name == 'safe')
            place.node = 2;
        }
      });

      if (!place.phase || !place.node) return "N/A";

      return "Phase " + place.phase + ", Node " + place.node;

    }).catch(err => console.log("eventStages getScripts error: ", err));

  }

}
