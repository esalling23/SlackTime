const createSlackEventAdapter = require("@slack/events-api")
  .createSlackEventAdapter;

module.exports = function(controller) {
  
  const slackEvents = createSlackEventAdapter(process.env.slackToken);

  
  controller.on('file_created', function(res) {
    console.log("created!");
  });
  
  controller.on('file_public', function(res) {
    console.log("public!");
  });
  
  controller.on('file_shared', function(res) {
    console.log("shared!!");
  });
}