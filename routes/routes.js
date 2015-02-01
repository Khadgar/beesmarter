var path = require('path');
var ejs = require('ejs');
var fs = require('fs');

var led;

module.exports = function (app, passport, Teams, Designers, Settings, io, interval_id, timeout_id) {

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

	app.post('/signupdesigner', function (req, res) {

		Designers.findOne({
			'name' : req.body.designername
		}, function (err, user) {
			if (user) {
				res.writeHead(200, {
					'Content-Type' : 'text/html'
				});
				res.end(errorcompiled({
						errormsg : 'Designer exists!'
					}));
			} else {

				if (req.body.designername != '') {
					var newdesigner = {
						name : req.body.designername
					};
					var designer = new Designers(newdesigner);

					designer.save(function (error, data) {
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

	//global socket handling
	io.on('connection', function (socket) {

		console.log('a user connected');

		socket.on('starta1', function () {
			console.log('Start Auction 1');

			clearInterval(interval_id);
			clearTimeout(timeout_id)
			//console.log(interval_id)

			Settings.findOne({
				id : '1'
			}, function (error, set) {
				//console.log(set.votetimeout)
				timeout = set.votetimeout;

				interval_id = setInterval(function () {
						timeout--;
						io.emit('timer', {
							countdown : timeout
						});
					}, 1000);

				timeout_id = setTimeout(function () {
						clearInterval(interval_id);
						io.emit('timer', {
							countdown : "Vége"
						});
					}, timeout * 1000);

			});
		});

		socket.on('reset', function () {
			console.log('Reset Auction 1');
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

		io.on('connection', function (socket) {
			console.log('a user connected');
			
			socket.on('message', function (msg) {
				//console.log('message: ' + msg);
				Designers.find({})
				.select('name')
				.exec(function (err, users) {
					//console.log(users);
					//socket.emit csak a kuldonek valaszol. io.emit valaszol mindenkinek.
					socket.emit('users', users)
					delete users;
				});
			});

			socket.on('disconnect', function () {
				console.log('a user disconnected');
			});
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
				//console.log(user.role)
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
	
	app.post('/bidfordesigner', function (req, res) {
		console.log(req.body);
		res.redirect('/personal');
	});
	
	app.post('/bidforsensor', function (req, res) {
		console.log(req.body);
		res.redirect('/personal');
	});

	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});

};
