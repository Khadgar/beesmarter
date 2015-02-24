var fs = require('fs');
var path = require('path');

var Assest = function(app) {

  app.get('/css/:asset_css', function(req, res) {
    res.sendfile(path.join(__dirname, '../views/css/' + req.params.asset_css));
  });


  app.get('/images/:asset_images', function(req, res) {
    res.sendfile(path.join(__dirname, '../views/images/' + req.params.asset_images));
  });


};

exports.Assest = Assest;