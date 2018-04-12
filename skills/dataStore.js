const _ = require("underscore");

module.exports = function(controller) {
  
  controller.dataStore = function(event) {
    
    var ObjectID = require('bson').ObjectID;

    var id  = new ObjectID();
        
    var dataEvent = {
      id: id,
      team: event.team.id ? event.team.id : event.team, 
      user: event.user,
      channel: event.channel,
      btnId: event.callback_id,
      type: event.actions[0].type,
      action: event.actions[0].name, 
      value: event.actions[0].value ? event.actions[0].value : event.actions[0].selected_options[0].value, 
      from: event.callback_id, 
      time: new Date()
    }
    
    console.log(dataEvent);
    
    controller.storage.events.save(dataEvent, function(err, saved) {
      console.log(err, saved, "SAVED!!");
    });
    
  };
  
}