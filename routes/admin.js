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
var maxBidValue,
    minBidValue,
    currentBidValue,
    stepTime,
    step = 10;

var interval_id,
    timeout_id;

var bidSubject;

var Admin = function(app, Teams, io, Designers, Sensors) {
    app.get('/admin', isAuthenticated, function(req, res, next) {
        process.nextTick(function() {
            Teams.findOne({
                TeamID: req.user.TeamID
            }, function(error, user) {
                writeHead(res);
                if (user.role === 'on') {
                    Designers.find()
                        .exec(function(err, designers) {
                            Sensors.find().exec(function(err, sensors) {
                                res.end(admincompiled({
                                    username: user.TeamFullName,
                                    designers: designers,
                                    sensors: sensors
                                }));
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

    app.post('/startDesignerAuction', isAuthenticated, function(req,res) {
        maxBidValue = req.body.maxValue;
        currentBidValue = maxBidValue;
        minBidValue = req.body.minValue;
        stepTime = req.body.stepTime;
        bidSubject = req.body.optradio;

        io.on('connection', function(socket) {
            console.log('user disconnected , I\'m in admin.js, designerAuctionStarted');
            io.emit('designerAuctionStarted', {
                designer: bidSubject,
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
        }, ((maxBidValue - minBidValue)/step) * 1000 * stepTime);
        res.redirect('/admin');
    });

    app.post('/startSensorAuction', isAuthenticated, function(req,res) {
        maxBidValue = req.body.maxValue;
        currentBidValue = maxBidValue;
        minBidValue = req.body.minValue;
        stepTime = req.body.stepTime;
        bidSubject = req.body.optradio;

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
        }, ((maxBidValue - minBidValue)/step) * 1000 * stepTime);
        res.redirect('/admin');
    });
};


var getCurrentValue = function(){
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
};

var getBidSubject = function(){
    return bidSubject;
};


exports.Admin = Admin;
exports.getCurrentValue = getCurrentValue;
exports.getMinValue = getMinValue;
exports.endAuction = endAuction;
exports.getBidSubject = getBidSubject;