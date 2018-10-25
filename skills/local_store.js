module.exports = function(controller) {

  controller.store = {
    teams: {},
    getTeam: function(teamId) {

      console.log("getting team: ", teamId)
      // console.log("local store says: ", controller.store.teams)

      return new Promise((resolve, reject) => {

        if (!controller.store.teams[teamId]) {

          controller.storage.teams.get(teamId, function(err, team) {
            if (err)
              reject(err)
            else {
              controller.store.teams[teamId] = team
              resolve(team)
            }
          })

        } else {
          resolve(controller.store.teams[teamId])
        }

      })

    }
  }


  setInterval(function() {

    for (let team in controller.store.teams) {

      // console.log(controller.store.teams[team], " we should probably save this team")
      controller.storage.teams.save(controller.store.teams[team], function(err, saved) {
        console.log("we stored team id ", saved.id)
      })
    }

  }, 5000)

}
