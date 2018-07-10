var request = require('request');
var fs = require('fs');

module.exports = function(controller) {
  
  controller.randomText = function(callback) {
    
    // find text etc.
    fs.readFile('./tmp/randomText.txt', 'utf8', function(err, data) { 
      if (err) 
        throw err;
      else {
        var randSent = (Math.floor(Math.random() * 50888));
        var falseString = data.substring(data.indexOf("[New Line]", randSent) + 12, data.indexOf("[New Line]", (data.indexOf("[New Line]", randSent) + 20)));
        falseString.replace(/[^\x00-\x7F]/g, "");
        console.log(falseString);
        callback(falseString);
      }
    });

    
  }
  
};