module.exports = function(controller) {
  
  controller.isUser = function(member, includeThisBot) {
    return member.is_bot || (member.name == process.env.botName && !includeThisBot) || member.name == "slackbot" ? false : true;
  }
  
  controller.ignoreEmails = [
    "esalling23@gmail.com", 
    "wadek2@gmail.com", 
    "sam@extraludic.com"
  ]
  
}