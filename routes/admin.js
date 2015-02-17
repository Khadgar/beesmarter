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

var designer;

var Admin = function(app, Teams, io, Designers) {
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

        io.on('connection', function(socket) {
            console.log('a user connected, I\'m in admin.js2');

            socket.on('message', function(msg) {
                Designers.find({team: undefined})
                    .select('name')
                    .exec(function(err, designers) {
                        socket.emit('designers', designers);
                    });
            });

            socket.on('disconnect', function() {
                console.log('a user disconnected, I\'m in admin.js2');
            });
        });
    });

    app.post('/startDesignerAuction', function(req,res) {
        maxBidValue = req.body.maxValue;
        currentBidValue = maxBidValue;
        minBidValue = req.body.minValue;
        stepTime = req.body.stepTime;
        designer = req.body.optradio;

        io.on('connection', function(socket) {
            io.emit('designerAuctionStarted', {
                designer: designer,
                minBidValue: minBidValue,
                maxBidValue: maxBidValue
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
            clearInterval(interval_id);
            io.emit('timer', {
                value: "Vége"
            });
        }, ((maxBidValue - minBidValue)/step) * 1000 * stepTime);
        res.redirect('/admin');
    });
};

var globalIO = function(io) {
    io.on('connection', function(socket) {

        console.log('a user connected, I\'m in admin.js');
        socket.on('disconnect', function() {
            console.log('user disconnected , I\'m in admin.js');
        });
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
    designer = undefined;
};

var getCurrentDesigner = function(){
    return designer;
};


exports.Admin = Admin;
exports.globalIO = globalIO;
exports.getCurrentValue = getCurrentValue;
exports.getMinValue = getMinValue;
exports.endAuction = endAuction;
exports.getCurrentDesigner = getCurrentDesigner;