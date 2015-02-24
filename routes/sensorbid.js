var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var getCurrentValue = require('./admin.js').getCurrentValue;
var getMinValue = require('./admin.js').getMinValue;
var getBidSubject = require('./admin.js').getBidSubject;
var endAuction = require('./admin.js').endAuction;

var sensorContent = fs.readFileSync(path.join(__dirname, '../views/sensorBid.html'), 'utf-8');
var sensorCompiled = ejs.compile(sensorContent);

var SensorBid = function(app, io, Teams, SensorBID) {

    io.on('connection', function(socket) {
        console.log('CONNECTED , sensorbid');
        socket.on('BIDSensorcheck', function(data) {
            var username = data.username;

            Teams.findOne({
                TeamFullName: username
            }, function(error, team) {
                var value = getCurrentValue();
                var minValue = getMinValue();
                var money = team.money;

                var check = checkBid(value, minValue, money);
                if (check) {
                    endAuction();
                    var newsensorbid = {
                        name: getBidSubject(),
                        osszeg: value,
                        felado: username
                    };
                    var sensorbid = new SensorBID(newsensorbid);
                    sensorbid.save();

                    team.money -= value;
                    team.save();

                    io.emit('BIDSensorsuccess', {
                        msg: 'A BIDet ' + username + ' nyerte ' + value + '-ért'
                    });
                } else {
                    socket.emit('BIDSensorfail', 'A BID nem kerult rogzitesre');
                }
            });
        });
        socket.on('disconnect', function() {
            console.log('DISCONNECTED , sensorbid');
        });
    });

    app.get('/sensor', isAuthenticated, function(req, res, next) {
        Teams.findOne({
            TeamID: req.user.TeamID
        }, function(error, user) {
            writeHead(res);
            res.end(sensorCompiled({
                username: user.TeamFullName
            }));
        });
    });
};

var checkBid = function(value, minValue, money) {
    if (value) {
        if (value <= minValue || money < value) {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
};

exports.SensorBid = SensorBid;