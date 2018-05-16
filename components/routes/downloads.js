module.exports = function(webserver, controller) {
  
  webserver.get('/download/:file/:team/:user', function(req, res){

    var file = req.params.file;

    var opt = {
      file: req.params.file, 
      team: req.params.team, 
      user: req.params.user
    }

    controller.trigger("download", [opt]);

    var filePath = "http://res.cloudinary.com/extraludic/image/upload/v1/fl_attachment/escape-room/" + file;

    console.log(filePath, "is the filepath");

    res.redirect(filePath);

  });


}