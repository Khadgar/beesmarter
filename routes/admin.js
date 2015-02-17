var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var errorcontent = fs.readFileSync(path.join(__dirname, '../views/error.html'), 'utf-8');
var errorcompiled = ejs.compile(errorcontent);

var admincontent = fs.readFileSync(path.join(__dirname, '../views/admin.html'), 'utf-8');
var admincompiled = ejs.compile(admincontent);

//id of the running countdown
var interval_id, timeout_id, timeout;

var Admin = function(app, Teams) {
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
};

var globalIO = function(io, Settings) {
    io.on('connection', function(socket) {

        console.log('a user connected, I\'m in admin.js');

        socket.on('starta1', function() {
            console.log('Start Auction 1');

            clearInterval(interval_id);
            clearTimeout(timeout_id);
            //console.log(interval_id)
            Settings.findOne({
                id: '1'
            }, function(error, set) {
                var timeout = getTimeout();
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
            console.log('user disconnected , I\'m in admin.js');
        });
    });
};

var getTimeout = function(){
    return timeout;
};

var setTimeout = function(value) {
    timeout = value;
};


exports.getAdmin = getAdmin;
exports.globalIO = globalIO;
exports.getTimeout = getTimeout;