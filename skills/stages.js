const _ = require('underscore')
const fs = require('fs')

module.exports = function(controller) {

  controller.codeStages = {
    "buttons": "Stage 1, Node 3",
    "safe": "Stage 1, Node 2"
  }

  controller.eventStages = function(bot, event, type) {
    const place = {}
    const script

    return controller.studio.getScripts().then(list => {

      _.each(list, function(s) {
        if (s.tags.includes(event.callback_id)) {
          console.log('the script we are looking for is: ' + s.name)
          script = s.name
          place.phase = _.filter(s.tags, function(t) {
            // console.log(t, t.split('_')[0] == 'phase')
            return t.split('_')[0] == 'phase'
          })[0].replace('phase_', '')

          // console.log(place.phase)

          place.node = parseInt(place.phase) + 2

          if (s.name == 'input_nodes_1')
            place.node = 1
          else if (s.name == 'input_nodes_2' || s.name == 'safe')
            place.node = 2
        }
      })

      if (!place.phase || !place.node) return "N/A"

      return "Phase " + place.phase + ", Node " + place.node

    }).catch(err => console.log("stages.js: eventStages getScripts error: ", err))

  }

}
