module.exports = function(webserver, controller) {
  
  webserver.get('/download/:file/:team/:user', function(req, res){

    var file = req.params.file;
    
    var filePath;
    
      var opt = {
        file: req.params.file, 
        team: req.params.team, 
        user: req.params.user
      }

      controller.trigger("download", [opt]);

      if(file == "tangramsZipped.zip") {
        filePath = "http://res.cloudinary.com/extraludic/raw/upload/v1/escape-room/" + file;
      }
      else {
        filePath = "http://res.cloudinary.com/extraludic/image/upload/fl_attachment/v1/escape-room/" + file;
      }

      console.log(filePath, "is the filepath");

      res.redirect(filePath);
      
    });


}