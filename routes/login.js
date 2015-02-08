var path = require('path');

module.exports = function(app, passport) {
    app.get('/login', function(req, res) {
        console.log("login.html");

        res.sendfile(path.join(__dirname, '../views/index.html'));

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
        res.redirect('/personal');
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};