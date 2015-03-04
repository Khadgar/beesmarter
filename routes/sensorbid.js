var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var getCurrentValue = require('./admin.js').getCurrentValue;
var getMinValue = require('./admin.js').getMinValue;
var getBidSubject = require('./admin.js').getBidSubject;
var endAuction = require('./admin.js').endAuction;
var checkBid = require('./admin.js').checkBid;

var sensorContent = fs.readFileSync(path.join(__dirname, '../views/sensorBid.html'), 'utf-8');
var sensorCompiled = ejs.compile(sensorContent);

var sensorAdminContent = fs.readFileSync(path.join(__dirname, '../views/sensorBidAdmin.html'), 'utf-8');
var sensorAdminCompiled = ejs.compile(sensorAdminContent);

Date.prototype.addHours = function(h) {
    this.setHours(this.getHours() + h);
    return this;
};

var getCurrentDate = function() {
    return new Date().toJSON().slice(0, 10);
};

var getCurrentTime = function() {
    return new Date().addHours(1).toTimeString().slice(0, 8);
};

var getCurrentDateTime = function() {
    return getCurrentDate() + ' ' + getCurrentTime();
};


var SensorBid = function(app, io, Teams, SensorBID) {

    io.on('connection', function(socket) {
        socket.on('BIDSensorcheck', function(data) {
            var username = data.username;

            Teams.findOne({
                TeamFullName: username
            }, function(error, team) {
                var value = getCurrentValue();
                var minValue = getMinValue();
                var money = team.money;
                var sensor = getBidSubject();

                var check = checkBid(value, minValue, money);

                if (check.returnValue) {
                    endAuction();
                    var newsensorbid = {
                        name: sensor,
                        osszeg: value,
                        felado: username,
                        datum: getCurrentDateTime()
                    };
                    var sensorbid = new SensorBID(newsensorbid);
                    sensorbid.save();

                    team.money -= value;
                    team.save();

                    io.emit('BIDSensorsuccess', {
                        msg: username + ' has won the bid for ' + sensor + ' for ' + value
                    });
                } else {
                    socket.emit('BIDSensorfail', 'The bid was not recorded. ' + check.message);
                }
            });
        });
        socket.on('disconnect', function() {});
    });

    app.get('/sensor', isAuthenticated, function(req, res, next) {
        Teams.findOne({
            TeamID: req.user.TeamID
        }, function(error, user) {
            writeHead(res);
            if (user.role === 'on') {
                res.end(sensorAdminCompiled({
                    username: user.TeamFullName
                }));
            }
            res.end(sensorCompiled({
                username: user.TeamFullName
            }));
        });
    });
};

exports.SensorBid = SensorBid;