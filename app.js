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

//configure the app
app.set('port', process.env.PORT || 3000);
app.use(express.cookieParser('dandroid'));
app.use(express.session({
		secret : 'cookie_secret'
	}));
app.use(bodyParser.urlencoded({
		extended : true
	}));
app.use(passport.initialize());
app.use(passport.session());
app.use(busboy());

//alapertelmezetten a connect 5 kapcsolatot nyit. poolSize-zal lehet szabalyozni
//mongo.Db.connect('mongodb://localhost:27017/testDB', {server: {poolSize: 1}});

//mongoose.connect('mongodb://localhost/MyDatabase');

//host https://mongolab.com
mongoose.connect('mongodb://beesmarter:beesmarter@ds039261.mongolab.com:39261/beesmarterdb');

var Teams = require(path.join(__dirname, './models/team.js'))(mongoose);

var Designers = require(path.join(__dirname, './models/designer.js'))(mongoose);

var Sensors = require(path.join(__dirname, './models/sensors.js'))(mongoose);

var DesignerBID = require(path.join(__dirname, './models/designerbid.js'))(mongoose);

var SensorBID = require(path.join(__dirname, './models/sensorbid.js'))(mongoose);

var PriorityList = require(path.join(__dirname, './models/prioritylist.js'))(mongoose);

//assets
require(path.join(__dirname, './routes/assets.js')).Assest(app);

//authentication in auth.js
require(path.join(__dirname, './auth.js'))(passport, LocalStrategy, Teams);

//routing in routes.js
require(path.join(__dirname, './routes/login.js')).Login(app, passport);
require(path.join(__dirname, './routes/designerbid.js')).DesignerBid(app, io, DesignerBID, Teams, Designers, PriorityList);
require(path.join(__dirname, './routes/sensorbid.js')).SensorBid(app, io, Teams, SensorBID);
require(path.join(__dirname, './routes/profile.js')).Profile(app, io, Teams, PriorityList, DesignerBID);
require(path.join(__dirname, './routes/admin.js')).Admin(app, Teams, io, Designers, Sensors);
require(path.join(__dirname, './routes/upload.js')).Upload(app,Teams, ftpupload, busboy);


//create server
http.listen(app.get('port'), function () {
	console.log('BeeSmarter server listening on localhost:' + app.get('port'));
});
