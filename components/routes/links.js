const _ = require('underscore');

module.exports = function(webserver, controller) {
  
  webserver.get('/link/:link/:team/:user', function(req, res){
    
    controller.storage.teams.get(req.params.team, function(err, team) {
      
      var user = _.findWhere(team.users, { "userId" : req.params.user });
      
      var url = controller.linkUrls[req.params.link];
            
      var opt = {
        team: team.id, 
        user: user.userId, 
        channel: user.bot_chat, 
        url: url, 
        linkName: req.params.link
      }

      controller.dataStore(opt, "link").then((result) => {

        res.redirect(url);

      }).catch(err => console.log('error with link storage: ' + err));;
      
    });
    
  });


}