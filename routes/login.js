var path = require('path');

var writeHead = require('./utils.js').writeHead;

var isAuthenticated = function(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/login');
};

var Login = function(app, passport) {
    app.get('/login', function(req, res) {
        writeHead(res);
        res.render('index');
    });

    app.post('/login',
        passport.authenticate('local', {
            successRedirect: '/loginSuccess',
            failureRedirect: '/loginFailure'
        }));

    app.get('/loginFailure', function(req, res, next) {
        res.redirect('/');
    });

    app.get('/loginSuccess', function(req, res, next) {
        res.redirect('/results');
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

exports.Login = Login;
exports.isAuthenticated = isAuthenticated;