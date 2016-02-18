var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var getCurrentValue = require('./admin.js').getCurrentValue;
var getMinValue = require('./admin.js').getMinValue;
var getBidSubject = require('./admin.js').getBidSubject;
var endAuction = require('./admin.js').endAuction;

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


var SensorBid = function(app, io, Teams, SensorBID, Users) {

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
        Users.findOne({
            ID: req.user.ID
        }, function(error, user) {
            writeHead(res);
            if (user.role === "admin") {
                res.render('sensorBidAdmin', {
                    username: user.name,
                    path: "/sensor"
                });
            } else {
                res.render('sensorBid', {
                    username: user.name,
                    path: "/sensor"
                });
            }
        });
    });
};

var checkBid = function(value, minValue, money) {
    if (value) {
        if (money < value) {
            return {
                returnValue: false,
                message: 'You don\'t have enough money'
            };
        } else {
            return {
                returnValue: true
            };
        }
    } else {
        return {
            returnValue: false,
            message: 'There is no bidding currently!'
        };
    }
};

exports.SensorBid = SensorBid;