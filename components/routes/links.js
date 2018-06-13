const _ = require('underscore');

module.exports = function(webserver, controller) {
  
  webserver.get('/link/:link/:team/:user', function(req, res){
    
    controller.storage.teams.get(req.params.team, function(err, team) {
      
      var user = _.findWhere(team.users, { "userId" : req.params.user });
      
      var file = req.params.file;
      
      var opt = {
        file: file, 
        team: team.id, 
        user: user.userId, 
        channel: user.bot_chat, 
        url: req.params.link
      }

      controller.dataStore(opt, "download", function() {

        res.redirect(req.params.url);

      });
      
    });
    
  });


}