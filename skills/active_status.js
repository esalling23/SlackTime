module.exports = function(controller) {
  
  controller.on('presence_change', (err, res) => {
    console.log(err, res);
  });
}