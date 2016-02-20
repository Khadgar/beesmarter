var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var isAuthenticated = require('./login.js').isAuthenticated;
var writeHead = require('./utils.js').writeHead;

var completedUploads = {};
var fileName;

Date.prototype.addHours = function(h) {
    this.setHours(this.getHours() + h);
    return this;
};

var getCurrentTime = function() {
    return new Date().toLocaleTimeString().slice(0, 8).replace(':', '').replace(':', '');
};

var Upload = function(app, Teams, ftpupload, Users, busboy) {

    app.get('/upload', isAuthenticated, function(req, res, next) {
        var canUpload = require('./admin.js').canUpload;


        if (canUpload) {
            Users.findOne({
                ID: req.user.ID
            }, function(error, user) {
                writeHead(res);
                res.render('upload', {
                    username: user.name,
                    fileName: fileName,
                    path: "/upload"
                });
                fileName = '';
            });
        } else {
            writeHead(res);
            res.render('error', {
                errormsg: 'Time is up!'
            });
        }
    });

    app.post('/uploadFile', isAuthenticated, function(req, res, next) {

        var fstream;
        console.log(req.user.ID);
        req.pipe(req.busboy);
        req.busboy.on('file', function(fieldname, file, filename) {
            console.log("Uploading: " + filename);
            //temp dir of the files
            fstream = fs.createWriteStream(path.join(__dirname, '../files/' + req.user.ID + '_' + getCurrentTime() + '_' + filename));
            file.pipe(fstream);

            fstream.on('close', function() {

                completedUploads[req.user.ID] = filename;
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