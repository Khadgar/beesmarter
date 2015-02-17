var writeHead = function(res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
};

var Signup = function(app, Designers, Teams) {
    app.post('/signupteam', function(req, res) {

        var newUserName = req.body.username;

        Teams.findOne({
            'TeamID': newUserName
        }, function(err, user) {
            if (user) {
                writeHead(res);

                res.end(errorcompiled({
                    errormsg: 'Username exists!'
                }));
            } else {

                if (newUserName && req.body.password) {
                    var newteam = {
                        TeamID: newUserName,
                        Password: req.body.password,
                        TeamFullName: req.body.fullname,
                        role: req.body.role
                    };
                    var newUser = new Teams(newteam);

                    newUser.save(function(error, data) {
                        if (error) {
                            res.json(error);
                        } else {
                            res.redirect('/admin');
                        }
                    });
                } else {
                    writeHead(res);
                    res.end(errorcompiled({
                        errormsg: 'You have to fill username and password fields!'
                    }));
                }

            }
        });

    });

    app.post('/signupdesigner', function(req, res) {
        var newDesignerName = req.body.designername;

        Designers.findOne({
            'name': newDesignerName
        }, function(err, user) {
            if (user) {
                writeHead(res);
                res.end(errorcompiled({
                    errormsg: 'Designer exists!'
                }));
            } else {
                if (newDesignerName) {
                    var designer = new Designers({
                        name: newDesignerName
                    });

                    designer.save(function(error, data) {
                        if (error) {
                            res.json(error);
                        } else {
                            res.redirect('/admin');
                        }
                    });
                } else {
                    writeHead(res);
                    res.end(errorcompiled({
                        errormsg: 'You have to fill the designer name!'
                    }));
                }

            }
        });

    });
};

exports.Signup = Signup;