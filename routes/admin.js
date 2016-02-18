var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var canUpload = false;


//id of the running countdown
var maxBidValue,
    minBidValue,
    currentBidValue,
    stepTime,
    step;

var interval_id,
    timeout_id;

var bidSubject,
    priorityListLeader;


var Admin = function(app, Teams, io, Designers, Sensors, PriorityList, SensorBID, Users) {
    app.get('/admin', isAuthenticated, function(req, res, next) {
        var completedUploads = require('./upload.js').completedUploads;
        process.nextTick(function() {
            Users.findOne({
                ID: req.user.ID
            }, function(error, user) {
                writeHead(res);
                if (user.role === "admin") {
                    Sensors.find().exec(function(err, sensors) {
                        PriorityList.find()
                            .exec(function(err, priorityLists) {
                                Teams.find({}, function(err, teams) {
                                    Designers.find({}, function(err, designers) {
                                        var message = "";
                                        if (priorityLists.length === 0) {
                                            message = "The priority lists are empty.";
                                        } else if(priorityLists.length !== designers.length) {
                                            message = "Not all the designers have a priority list yet.";
                                        }
                                        res.render('admin', {
                                            username: user.name,
                                            sensors: sensors,
                                            completedUploads: completedUploads,
                                            teamCount: teams.length,
                                            teams: teams,
                                            designers: designers,
                                            canUpload: canUpload,
                                            path: "/admin",
                                            message: message
                                        });

                                    });
                                });
                            });
                    });

                } else {
                    res.render('error', {
                        errormsg: 'You have to log in as admin to see this page!'
                    });
                }
            });
        });
    });

    app.post('/startSensorAuction', isAuthenticated, function(req, res) {
        maxBidValue = req.body.maxValue;
        currentBidValue = maxBidValue;
        minBidValue = req.body.minValue;
        stepTime = req.body.stepTime;
        bidSubject = req.body.optradio;

        io.on('connection', function(socket) {
            io.emit('sensorAuctionStarted', {
                sensor: bidSubject,
                minBidValue: minBidValue,
                maxBidValue: currentBidValue
            });

            socket.once('disconnect', function() {});
        });

        clearInterval(interval_id);
        clearTimeout(timeout_id);

        step = 1;

        interval_id = setInterval(function() {
            currentBidValue -= step;
            io.emit('timer', {
                value: currentBidValue
            });
        }, 1000 * stepTime);

        timeout_id = setTimeout(function() {
            currentBidValue -= step;
            endAuction();
            io.emit('timer', {
                value: "End"
            });
        }, ((maxBidValue - minBidValue) / step) * 1000 * stepTime);
        res.redirect('/admin');
    });

    app.post('/teamVote', isAuthenticated, function(req, res, next) {
        averageVote = req.body.averageVote;
        teamFullName = req.body.optradio;
        Teams.update({
            TeamFullName: teamFullName
        }, {
            teamVote: averageVote
        }, function(err, des) {
            if (err) {
                console.log(err);
            }
        });

        res.redirect('/admin');
    });

    app.post('/designerVote', isAuthenticated, function(req, res, next) {
        averageVote = req.body.averageVote;
        designerName = req.body.optradio;
        Designers.update({
            name: designerName
        }, {
            designerVote: averageVote
        }, function(err, des) {
            if (err) {
                console.log(err);
            }
        });

        res.redirect('/admin');
    });

    app.post('/applicationVote', isAuthenticated, function(req, res, next) {
        averageVote = req.body.averageVote;
        teamFullName = req.body.optradio;

        Teams.findOne({
            TeamFullName: teamFullName
        }, function(err, team) {
            team.appVote = averageVote;
            team.save();

            Designers.update({
                name: team.designer
            }, {
                appVote: averageVote
            }, function(err, des) {
                if (err) {
                    console.log(err);
                }
            });
        });

        res.redirect('/admin');
    });

    app.post('/startUpload', isAuthenticated, function(req, res, next) {
        canUpload = true;
        exports.canUpload = canUpload;
        res.redirect('/admin');
    });

    app.post('/stopUpload', isAuthenticated, function(req, res, next) {
        canUpload = false;
        exports.canUpload = canUpload;
        res.redirect('/admin');
    });

    app.post('/addUser', isAuthenticated, function(req, res, next) {
        var ID = req.body.ID;
        var name = req.body.fullName;

        var newUser = {
            ID: ID,
            Password: req.body.password,
            name: name,
            role: req.body.roleradio
        };

        if (req.body.roleradio === "team") {

            var newTeam = {
                TeamID: ID,
                TeamFullName: name,
                money: 1000,
                designer: null,
                teamVote: null,
                appVote: null
            };
            var team = new Teams(newTeam);
            team.save();
        } else {

            var newDesigner = {
                DesginerID: ID,
                name: name,
                money: 1000,
                designerVote: null,
                appVote: null
            };
            var designer = new Designers(newDesigner);
            designer.save();
        }

        var user = new Users(newUser);
        user.save();

        res.redirect('/admin');
    });

};


var getCurrentValue = function() {
    return currentBidValue;
};

var getMinValue = function() {
    return minBidValue;
};

var endAuction = function() {
    clearInterval(interval_id);
    clearTimeout(timeout_id);
    currentBidValue = undefined;
    maxBidValue = undefined;
    minBidValue = undefined;
    stepTime = undefined;
    step = undefined;
    bidSubject = undefined;
    priorityListLeader = undefined;
};

var getBidSubject = function() {
    return bidSubject;
};

exports.Admin = Admin;

exports.getCurrentValue = getCurrentValue;
exports.getMinValue = getMinValue;
exports.endAuction = endAuction;
exports.getBidSubject = getBidSubject;

exports.canUpload = canUpload;