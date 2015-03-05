var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var isAuthenticated = require('./login.js').isAuthenticated;

var uploadcontent = fs.readFileSync(path.join(__dirname, '../views/upload.html'), 'utf-8');
var uploadcompiled = ejs.compile(uploadcontent);
var errorcontent = fs.readFileSync(path.join(__dirname, '../views/error.html'), 'utf-8');
var errorcompiled = ejs.compile(errorcontent);
var writeHead = require('./utils.js').writeHead;
var completedUploads = {};
var fileName;
//completedUploads.team1=[];
//completedUploads.team2=[];
//completedUploads.team3=[];
Date.prototype.addHours = function(h) {
    this.setHours(this.getHours() + h);
    return this;
}

var getCurrentTime = function() {
    return new Date().addHours(1).toTimeString().slice(0, 8).replace(':', '').replace(':', '');
};

var Upload = function(app, Teams, ftpupload, busboy) {

    app.get('/upload', isAuthenticated, function(req, res, next) {
        var canUpload = require('./admin.js').canUpload;


        if (canUpload) {
            Teams.findOne({
                TeamID: req.user.TeamID
            }, function(error, user) {
                if (user.role === 'on') {
                    writeHead(res);
                    res.end(errorcompiled({
                        errormsg: 'You are the Admin. You don\'t have to upload anything!'
                    }));
                } else {

                    writeHead(res);
                    res.end(uploadcompiled({
                        username: user.TeamFullName,
                        fileName: fileName
                    }));
                    fileName = '';
                }
            });
        } else {
            writeHead(res);
            res.end(errorcompiled({
                errormsg: 'Time is up!'
            }));
        }
    });

    app.post('/uploadFile', isAuthenticated, function(req, res, next) {

        var fstream;
        console.log(req.user.TeamID);
        req.pipe(req.busboy);
        req.busboy.on('file', function(fieldname, file, filename) {
            console.log("Uploading: " + filename);
            //temp dir of the files
            fstream = fs.createWriteStream(path.join(__dirname, '../files/' + req.user.TeamID + '_' + getCurrentTime() + '_' + filename));
            file.pipe(fstream);
            var c = new ftpupload();

            fstream.on('close', function() {
                c.on('ready', function() {
                    //ftp path of the file

                    c.put(path.join(__dirname, '../files/' + req.user.TeamID + '_' + filename), req.user.TeamID + '_' + getCurrentTime() + '_' + filename, function(err) {
                        if (err) throw err;
                        c.end();
                    });
                });

                c.connect({
                    host: 'ftp.25.hu',
                    user: 'bsadmin@pc63.hu',
                    password: 'bsadmin1234'
                });
                fileName = filename;
                completedUploads[req.user.TeamID] = filename;
                exports.completedUploads = completedUploads;

                res.redirect('/upload');
            });
        });
    });

    app.post('/clearList', isAuthenticated, function(req, res, next) {
        completedUploads = {};
        exports.completedUploads = completedUploads;
        res.redirect('/admin');
    });

};

exports.Upload = Upload;