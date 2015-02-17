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

//alapertelmezetten a connect 5 kapcsolatot nyit. poolSize-zal lehet szabalyozni
//mongo.Db.connect('mongodb://localhost:27017/testDB', {server: {poolSize: 1}});

//mongoose.connect('mongodb://localhost/MyDatabase');

//host https://mongolab.com
mongoose.connect('mongodb://beesmarter:beesmarter@ds039261.mongolab.com:39261/beesmarterdb');

//user model in user.js
var Teams = require(path.join(__dirname, './models/team.js'))(mongoose);

//designer model in designer.js
var Designers = require(path.join(__dirname, './models/designer.js'))(mongoose);

//designer model in designer.js
var DesignerBID = require(path.join(__dirname, './models/designerbid.js'))(mongoose);

//designer model in designer.js
var SensorBID = require(path.join(__dirname, './models/sensorbid.js'))(mongoose);



//authentication in auth.js
require(path.join(__dirname, './auth.js'))(passport, LocalStrategy, Teams);

//routing in routes.js
require(path.join(__dirname, './routes/login.js')).Login(app, passport);
require(path.join(__dirname, './routes/designerbid.js')).DesignerBid(app, io, DesignerBID);
require(path.join(__dirname, './routes/sensorbid.js')).SensorBid(app);
require(path.join(__dirname, './routes/profile.js')).Profile(app, io, Teams, Designers);

require(path.join(__dirname, './routes/admin.js')).globalIO(io);
require(path.join(__dirname, './routes/admin.js')).Admin(app, Teams, io);


//create server
http.listen(app.get('port'), function () {
	console.log('BeeSmarter server listening on localhost:' + app.get('port'));
});
