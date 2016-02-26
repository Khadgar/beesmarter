var express = require('express');
var path = require('path');

var ejs = require('ejs');
var fs = require('fs');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var io = require('socket.io')(http);

var ftpupload = require('ftp');
var busboy = require('connect-busboy');

var cookieParser = require('cookie-parser');
var session = require('express-session');

//configure the app
app.set('port', process.env.PORT || 3000);

app.use(cookieParser('dandroid'));

app.use(express.static('keys'));

app.use(session({
  secret: 'cookie_secret',
    resave: true,
    saveUninitialized: true
}));

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(busboy());

//alapertelmezetten a connect 5 kapcsolatot nyit. poolSize-zal lehet szabalyozni
//mongo.Db.connect('mongodb://localhost:27017/testDB', {server: {poolSize: 1}});

//mongoose.connect('mongodb://localhost/MyDatabase');

//host https://mongolab.com
mongoose.connect('mongodb://beesmarter:beesmarter@ds039261.mongolab.com:39261/beesmarterdb');

var Users = require(path.join(__dirname, './models/user.js'))(mongoose);

var Teams = require(path.join(__dirname, './models/team.js'))(mongoose);

var Designers = require(path.join(__dirname, './models/designer.js'))(mongoose);

var Sensors = require(path.join(__dirname, './models/sensors.js'))(mongoose);

var SensorBID = require(path.join(__dirname, './models/sensorbid.js'))(mongoose);

var DesignerPriorityList = require(path.join(__dirname, './models/designerPrioritylist.js'))(mongoose);

var TeamPriorityList = require(path.join(__dirname, './models/teamPrioritylist.js'))(mongoose);

//assets
require(path.join(__dirname, './routes/assets.js')).Assest(app);

//authentication in auth.js
require(path.join(__dirname, './auth.js'))(passport, LocalStrategy, Users);

//routing in routes.js
require(path.join(__dirname, './routes/login.js')).Login(app, passport);
require(path.join(__dirname, './routes/priorityList.js')).DesignerBid(app, io, Teams, Designers, DesignerPriorityList, TeamPriorityList, Users);
require(path.join(__dirname, './routes/sensorbid.js')).SensorBid(app, io, Teams, SensorBID, Users);
require(path.join(__dirname, './routes/profile.js')).Profile(app, io, Teams, DesignerPriorityList, TeamPriorityList, Designers, SensorBID, Users);
require(path.join(__dirname, './routes/admin.js')).Admin(app, Teams, io, Designers, Sensors, SensorBID, Users);
require(path.join(__dirname, './routes/upload.js')).Upload(app, Teams, ftpupload, Users, busboy);


//create server
http.listen(app.get('port'), function() {
  console.log('BeeSmarter server listening on localhost:' + app.get('port'));
});