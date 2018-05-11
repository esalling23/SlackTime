module.exports = function(controller) {
  
  controller.isUser = function(member, includeThisBot) {
    return member.is_bot || (member.name == process.env.botName && !includeThisBot) || member.name == "slackbot" ? false : true;
  }
  
}