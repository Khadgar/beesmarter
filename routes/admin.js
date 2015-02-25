var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var sortPriorityList = require('./profile.js').sortPriorityList;
var compareBids = require('./profile.js').compareBids;

var errorcontent = fs.readFileSync(path.join(__dirname, '../views/error.html'), 'utf-8');
var errorcompiled = ejs.compile(errorcontent);

var admincontent = fs.readFileSync(path.join(__dirname, '../views/admin.html'), 'utf-8');
var admincompiled = ejs.compile(admincontent);

var canUpload = true;

var teamCount = 3;


//id of the running countdown
var maxBidValue,
    minBidValue,
    currentBidValue,
    stepTime,
    step = 10;

var interval_id,
    timeout_id;

var bidSubject,
    priorityListLeader;


var Admin = function(app, Teams, io, Designers, Sensors, PriorityList, DesignerBID) {
    app.get('/admin', isAuthenticated, function(req, res, next) {
        process.nextTick(function() {
            Teams.findOne({
                TeamID: req.user.TeamID
            }, function(error, user) {
                writeHead(res);
                if (user.role === 'on') {
                    Sensors.find().exec(function(err, sensors) {
                        PriorityList.find()
                            .exec(function(err, priorityLists) {
                                if (priorityLists.length !== 0) {

                                    var sortedPriorityLists = sortPriorityList(priorityLists);
                                    var currentBid = sortedPriorityLists[0].list.sort(compareBids)[0];
                                    var currentBidLeader = sortedPriorityLists[0].team;

                                    //Max value ne induljon mar 1200-rol, ha 600 a maxos bid ra..
                                    var maxValue = currentBid.value * 2;
                                    if(currentBid.value > 500) {
                                        maxValue = 1000;
                                        if(currentBid.value === 1000) {
                                            maxValue = 1010;
                                        }
                                    }

                                    //Ha utso designer van hatra..viszont akkor is ennyit ir ki, ha
                                    //meg csak 1 ember adta le a listat, erre kene egy bool, ami jelzi, hogy
                                    //mindenki leadta
                                    //ES ez a timer nemtom, hogy hogy mukodik, ha ugyanolyan ertek a min es max, mivel
                                    // akkor a setTimeOutnal: ((maxBidValue - minBidValue) / step) * 1000 * stepTime)
                                    //ez 0 lenne
                                    if(priorityLists.length === 1) {
                                        maxValue = currentBid.value + 10;
                                    }

                                    res.end(admincompiled({
                                        username: user.TeamFullName,
                                        designer: currentBid.designer,
                                        minValue: currentBid.value,
                                        maxValue: maxValue,
                                        team: currentBidLeader,
                                        sensors: sensors
                                    }));
                                } else {
                                    res.end(admincompiled({
                                        username: user.TeamFullName,
                                        designer: false,
                                        sensors: sensors
                                    }));
                                }

                            });
                    });

                } else {
                    res.end(errorcompiled({
                        errormsg: 'You have to log in as admin to see this page!'
                    }));
                }
            });
        });
    });

    app.post('/startDesignerAuction', isAuthenticated, function(req, res) {
        maxBidValue = req.body.maxValue;
        currentBidValue = maxBidValue;
        minBidValue = req.body.minValue;
        stepTime = req.body.stepTime;
        bidSubject = req.body.designer;
        priorityListLeader = req.body.bidLeader;

        if (!maxBidValue || !minBidValue || !stepTime || !bidSubject || !priorityListLeader) {
            res.redirect('/admin');
        } else {
            io.on('connection', function(socket) {
                console.log('user disconnected , I\'m in admin.js, designerAuctionStarted');
                io.emit('designerAuctionStarted', {
                    designer: bidSubject,
                    minBidValue: minBidValue,
                    maxBidValue: currentBidValue,
                    priorityListLeader: priorityListLeader
                });

                socket.once('disconnect', function() {
                    console.log('user disconnected , I\'m in admin.js');
                });
            });

            clearInterval(interval_id);
            clearTimeout(timeout_id);

            interval_id = setInterval(function() {
                currentBidValue -= step;
                io.emit('timer', {
                    value: currentBidValue
                });
            }, 1000 * stepTime);

            timeout_id = setTimeout(function() {
                currentBidValue -= step;
                io.emit('timer', {
                    value: "Vége"
                });

                Teams.findOne({
                    TeamFullName: priorityListLeader
                }, function(error, team) {
                    var teamFullName = priorityListLeader;
                    var value = minBidValue;
                    handleDesignerBidSuccess(DesignerBID, PriorityList, bidSubject, minBidValue, priorityListLeader, team);
                    io.emit('BIDsuccess', {
                        msg: 'A BIDet ' + teamFullName + ' nyerte ' + value + '-ért'
                    });
                });

            }, ((maxBidValue - minBidValue) / step) * 1000 * stepTime);
            res.redirect('/admin');
        }
    });

    app.post('/startSensorAuction', isAuthenticated, function(req, res) {
        maxBidValue = req.body.maxValue;
        currentBidValue = maxBidValue;
        minBidValue = req.body.minValue;
        stepTime = req.body.stepTime;
        bidSubject = req.body.optradio;

        if (!maxBidValue || !minBidValue || !stepTime || !bidSubject) {
            res.redirect('/admin');
        } else {

            io.on('connection', function(socket) {
                console.log('user disconnected , I\'m in admin.js, sensorAuctionStarted');
                io.emit('sensorAuctionStarted', {
                    sensor: bidSubject,
                    minBidValue: minBidValue,
                    maxBidValue: currentBidValue
                });

                socket.once('disconnect', function() {
                    console.log('user disconnected , I\'m in admin.js');
                });
            });

            clearInterval(interval_id);
            clearTimeout(timeout_id);

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
                    value: "Vége"
                });
            }, ((maxBidValue - minBidValue) / step) * 1000 * stepTime);
            res.redirect('/admin');
        }
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
    bidSubject = undefined;
    priorityListLeader = undefined;
};

var getBidSubject = function() {
    return bidSubject;
};

var handleDesignerBidSuccess = function(DesignerBID, PriorityList, designer, value, teamFullName, team) {
    endAuction();
    var newdesignerbid = {
        name: designer,
        osszeg: value,
        felado: teamFullName
    };
    var designerbid = new DesignerBID(newdesignerbid);
    designerbid.save();

    team.designer = designer;
    team.money -= value;
    team.save();

    updatePriorityLists(PriorityList, teamFullName, designer);
};

var updatePriorityLists = function(PriorityList, TeamFullName, designer) {
    var updatedPriorityLists = [];

    PriorityList.findOneAndRemove({
        team: TeamFullName
    }, function(err) {
        if (err) {
            console.log(err);
        }
        PriorityList.update({}, {
            $pull: {
                list: {
                    designer: designer                }
            }
        }, {
            multi: true
        }, function(err, numberAffected) {
            if (err) {
                console.log(err);
            }
        });
    });
};



exports.Admin = Admin;

exports.getCurrentValue = getCurrentValue;
exports.getMinValue = getMinValue;
exports.endAuction = endAuction;
exports.getBidSubject = getBidSubject;

exports.canUpload = canUpload;
exports.teamCount = teamCount;

exports.handleDesignerBidSuccess = handleDesignerBidSuccess;