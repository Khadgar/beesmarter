var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var profilecontent = fs.readFileSync(path.join(__dirname, '../views/profile.html'), 'utf-8');
var profilecompiled = ejs.compile(profilecontent);

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var Profile = function(app, io, Teams, Designers) {

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
            console.log('a user connected, I\'m in profile.js');

            socket.on('message', function(msg) {
                Designers.find({})
                    .select('name')
                    .exec(function(err, users) {
                        //socket.emit csak a kuldonek valaszol. io.emit valaszol mindenkinek.
                        socket.emit('users', users);
                    });
            });

            socket.on('disconnect', function() {
                console.log('a user disconnected, I\'m in profile.js');
            });
        });
    });
};

exports.Profile = Profile;