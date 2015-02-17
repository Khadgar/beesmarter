var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var profilecontent = fs.readFileSync(path.join(__dirname, '../views/results.html'), 'utf-8');
var profilecompiled = ejs.compile(profilecontent);

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var Profile = function(app, io, Teams) {

    app.get('/', isAuthenticated, function(req, res, next) {
        writeHead(res);
        res.end(profilecompiled({
            username: req.user.TeamFullName
        }));
    });

    app.get('/results', isAuthenticated, function(req, res, next) {
        Teams.findOne({
            TeamID: req.user.TeamID
        }, function(error, user) {
            writeHead(res);
            res.end(profilecompiled({
                username: user.TeamFullName
            }));
        });
    });
};

exports.Profile = Profile;