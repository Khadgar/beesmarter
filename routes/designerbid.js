var getTimeout = require('./admin.js').getTimeout;

var DesignerBid = function(app, io, DesignerBID) {
    app.post('/bidfordesigner', function(req, res) {
        io.on('connection', function(socket) {
            socket.on('BIDcheck', function(msg) {
                var timeout = getTimeout();
                if (timeout) {
                    if (timeout <= 1) {
                        socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
                    } else {
                        socket.emit('BIDsuccess', 'A BID rogzitesre kerult');
                    }
                } else {
                    socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
                }
            });
            socket.on('disconnect', function() {});
        });

        var timeout = getTimeout();
        if (timeout) {
            if (timeout <= 1) {
                //nincs rogzitve a bid
            } else {
                var newdesignerbid = {
                    name: req.body.optradio,
                    osszeg: req.body.designerosszeg,
                    felado: req.user.TeamID
                };
                var designerbid = new DesignerBID(newdesignerbid);
                designerbid.save();
            }
        } else {
            //nincs rogzitve a bid
        }

        res.redirect('/personal');
    });
};

exports.DesignerBid = DesignerBid;