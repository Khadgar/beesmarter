var path = require('path');
var ejs = require('ejs');
var fs = require('fs');

//id of the running countdown
var interval_id, timeout_id, timeout;

var isAuthenticated = function(req, res, next) {
	if (req.isAuthenticated())
		return next();
	res.redirect('/login');
};

var getMax = function(Collection) {
	Collection.findOne({
		field1: 1
	}).sort(last_mod, 1).run(function(err, doc) {
		var max = doc.last_mod;
	});
	return max;
};

var writeHead = function(res) {
	res.writeHead(200, {
		'Content-Type': 'text/html'
	});
};


module.exports = function(app, passport, Teams, Designers, DesignerBID, Settings, io) {

	var profilecontent = fs.readFileSync(path.join(__dirname, '../views/profile.html'), 'utf-8');
	var profilecompiled = ejs.compile(profilecontent);

	var admincontent = fs.readFileSync(path.join(__dirname, '../views/admin.html'), 'utf-8');
	var admincompiled = ejs.compile(admincontent);

	var errorcontent = fs.readFileSync(path.join(__dirname, '../views/error.html'), 'utf-8');
	var errorcompiled = ejs.compile(errorcontent);

	var indexcontent = fs.readFileSync(path.join(__dirname, '../views/index.html'), 'utf-8');
	var indexcompiled = ejs.compile(indexcontent);

	app.post('/signupteam', function(req, res) {

		var userName = req.body.username;

		Teams.findOne({
			'TeamID': userName
		}, function(err, user) {
			if (user) {
				writeHead(res);

				res.end(errorcompiled({
					errormsg: 'Username exists!'
				}));
			} else {

				if (userName !== '' && req.body.password !== '') {
					var newteam = {
						TeamID: userName,
						Password: req.body.password,
						TeamFullName: req.body.fullname,
						role: req.body.role
					};
					var newUser = new Teams(newteam);

					newUser.save(function(error, data) {
						if (error) {
							res.json(error);
						} else {
							res.redirect('/admin');
						}
					});
				} else {
					writeHead(res);
					res.end(errorcompiled({
						errormsg: 'You have to fill username and password fields!'
					}));
				}

			}
		});

	});

	app.post('/signupdesigner', function(req, res) {
		var newDesignerName = req.body.designername;

		Designers.findOne({
			'name': newDesignerName
		}, function(err, user) {
			if (user) {
				writeHead(res);
				res.end(errorcompiled({
					errormsg: 'Designer exists!'
				}));
			} else {
				if (newDesignerName) {
					var designer = new Designers({
						name: newDesignerName
					});

					designer.save(function(error, data) {
						if (error) {
							res.json(error);
						} else {
							res.redirect('/admin');
						}
					});
				} else {
					writeHead(res);
					res.end(errorcompiled({
						errormsg: 'You have to fill the designer name!'
					}));
				}

			}
		});

	});

	//global socket handling
	io.on('connection', function(socket) {

		console.log('a user connected');

		socket.on('starta1', function() {
			console.log('Start Auction 1');

			clearInterval(interval_id);
			clearTimeout(timeout_id);
			//console.log(interval_id)

			Settings.findOne({
				id: '1'
			}, function(error, set) {
				//console.log(set.votetimeout)
				timeout = set.votetimeout;

				interval_id = setInterval(function() {
					timeout--;
					io.emit('timer', {
						countdown: timeout
					});
				}, 1000);

				timeout_id = setTimeout(function() {
					clearInterval(interval_id);
					io.emit('timer', {
						countdown: "Vége"
					});
				}, timeout * 1000);

			});
		});



		socket.on('disconnect', function() {
			console.log('user disconnected');
		});
	});


	app.get('/', isAuthenticated, function(req, res, next) {
		writeHead(res);
		res.end(profilecompiled({
			username: req.user.TeamFullName
		}));
	});

	app.get('/personal', isAuthenticated, function(req, res, next) {

		Teams.findOne({
			TeamID: req.user.TeamID
		}, function(error, user) {

			writeHead(res);
			res.end(profilecompiled({
				username: user.TeamFullName
			}));
		});

		io.on('connection', function(socket) {
			console.log('a user connected');

			socket.on('message', function(msg) {
				//console.log('message: ' + msg);
				Designers.find({})
					.select('name')
					.exec(function(err, users) {
						//console.log(users);
						//socket.emit csak a kuldonek valaszol. io.emit valaszol mindenkinek.
						socket.emit('users', users);
					});
			});

			socket.on('disconnect', function() {
				console.log('a user disconnected');
			});
		});

	});

	app.get('/admin', isAuthenticated, function(req, res, next) {

		process.nextTick(function() {
			Teams.findOne({
				TeamID: req.user.TeamID
			}, function(error, user) {
				writeHead(res);
				if (user.role === 'on') {
					res.end(admincompiled({
						username: user.TeamFullName
					}));
				} else {
					res.end(errorcompiled({
						errormsg: 'You have to log in as admin to see this page!'
					}));
				}
			});
		});

	});

	app.post('/bidfordesigner', function(req, res) {


		io.on('connection', function(socket) {
			socket.on('BIDcheck', function(msg) {
				console.log(msg);
				if (timeout) {
					if (timeout <= 1) {
						socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
					} else {
						socket.emit('BIDsuccess', 'A BID rogzitesre kerult');
					}
				} else {
					socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
				}
			});
			socket.on('disconnect', function() {});
		});

		if (timeout) {
			if (timeout <= 1) {
				//nincs rogzitve a bid
			} else {
				var newdesignerbid = {
					name: req.body.optradio,
					osszeg: req.body.designerosszeg,
					felado: req.user.TeamID
				};
				var designerbid = new DesignerBID(newdesignerbid);
				designerbid.save();
			}
		} else {
			//nincs rogzitve a bid
		}



		res.redirect('/personal');
	});

	app.post('/bidforsensor', function(req, res) {
		console.log(req.body);
		res.redirect('/personal');
	});

};