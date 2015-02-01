var path = require('path');
var ejs = require('ejs');
var fs = require('fs');

var led;

module.exports = function (app, passport, Teams, io) {

	var profilecontent = fs.readFileSync(path.join(__dirname, '../views/profile.html'), 'utf-8');
	var profilecompiled = ejs.compile(profilecontent);

	var admincontent = fs.readFileSync(path.join(__dirname, '../views/admin.html'), 'utf-8');
	var admincompiled = ejs.compile(admincontent);

	var errorcontent = fs.readFileSync(path.join(__dirname, '../views/error.html'), 'utf-8');
	var errorcompiled = ejs.compile(errorcontent);

	var indexcontent = fs.readFileSync(path.join(__dirname, '../views/index.html'), 'utf-8');
	var indexcompiled = ejs.compile(indexcontent);

	app.get('/login', function (req, res) {
		console.log("login.html");

		res.sendfile(path.join(__dirname, '../views/index.html'));

	});

	app.post('/login',
		passport.authenticate('local', {
			successRedirect : '/loginSuccess',
			failureRedirect : '/loginFailure'
		}));

	app.post('/signup', function (req, res) {

		Teams.findOne({
			'TeamID' : req.body.username
		}, function (err, user) {
			if (user) {
				res.writeHead(200, {
					'Content-Type' : 'text/html'
				});
				res.end(errorcompiled({
						errormsg : 'Username exists!'
					}));
			} else {

				if (req.body.username != '' && req.body.password != '') {
					var newteam = {
						TeamID : req.body.username,
						Password : req.body.password,
						TeamFullName : req.body.fullname,
						role : req.body.role
					};
					var user = new Teams(newteam);

					user.save(function (error, data) {
						if (error) {
							res.json(error);
						} else {
							res.redirect('/admin');
						}
					});
				} else {
					res.writeHead(200, {
						'Content-Type' : 'text/html'
					});
					res.end(errorcompiled({
							errormsg : 'You have to fill username and password fields!'
						}));
				}

			}
		});

	});

	io.on('connection', function (socket) {
		console.log('a user connected');

		socket.on('message', function (msg) {
			console.log('message: ' + msg);
		});

		socket.on('disconnect', function () {
			console.log('user disconnected');
		});
	});

	var isAuthenticated = function (req, res, next) {
		if (req.isAuthenticated())
			return next();
		res.redirect('/login');
	}

	app.get('/', isAuthenticated, function (req, res, next) {
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		res.end(profilecompiled({
				username : req.user.TeamFullName
			}));
	});

	app.get('/personal', isAuthenticated, function (req, res, next) {

		Teams.findOne({
			TeamID : req.user.TeamID
		}, function (error, user) {

			res.writeHead(200, {
				'Content-Type' : 'text/html'
			});
			res.end(profilecompiled({
					username : user.TeamFullName
				}));
		});
	});

	app.get('/loginFailure', function (req, res, next) {
		res.redirect('/');
	});

	app.get('/loginSuccess', function (req, res, next) {
		res.redirect('/personal');
	});

	app.get('/admin', isAuthenticated, function (req, res, next) {

		process.nextTick(function () {
			Teams.findOne({
				TeamID : req.user.TeamID
			}, function (error, user) {
				console.log(user.role)
				//json string double quoted
				if (user.role == "on") {
					res.writeHead(200, {
						'Content-Type' : 'text/html'
					});
					res.end(admincompiled({
							username : user.TeamFullName
						}));
				} else {
					res.writeHead(200, {
						'Content-Type' : 'text/html'
					});
					res.end(errorcompiled({
							errormsg : 'You have to log in as admin to see this page!'
						}));
				}
			});
		});

	});

	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});
};
