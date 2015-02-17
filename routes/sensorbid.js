var SensorBid = function(app) {
    app.post('/bidforsensor', function(req, res) {
        console.log(req.body);
        res.redirect('/personal');
    });
};

exports.SensorBid = SensorBid;