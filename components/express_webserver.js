
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const querystring = require('querystring')
const debug = require('debug')('botkit:webserver')
const http = require('http')
const hbs = require('express-hbs')

module.exports = function(controller) {

    const webserver = express()
    webserver.use(cookieParser())
    webserver.use(bodyParser.json())
    webserver.use(bodyParser.urlencoded({ extended: true }))

    // set up handlebars ready for tabs
    webserver.engine('hbs', hbs.express4({partialsDir: __dirname + '/../views/partials'}))
    webserver.set('view engine', 'hbs')
    webserver.set('views', __dirname + '/../views/')

    hbs.registerHelper('jsonPrint', function(obj) {
      return JSON.stringify(obj, null, 2)
    })

    // import express middlewares that are present in /components/express_middleware
    const normalizedPath = require("path").join(__dirname, "express_middleware")
    require("fs").readdirSync(normalizedPath).forEach(function(file) {
        require("./express_middleware/" + file)(webserver, controller)
    })

    webserver.use(express.static('public'))

    const server = http.createServer(webserver)
    // const io = require('socket.io')(server)

    server.listen(process.env.PORT || 3000, null, function() {

        console.log('Express webserver configured and listening at http://localhost:' + process.env.PORT || 3000)

    })

    // import all the pre-defined routes that are present in /components/routes
    const normalizedPath = require("path").join(__dirname, "routes")
    require("fs").readdirSync(normalizedPath).forEach(function(file) {
      require("./routes/" + file)(webserver, controller)
    })

    controller.webserver = webserver
    controller.httpserver = server

    return webserver

}
