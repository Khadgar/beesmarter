var getCurrentValue = require('./admin.js').getCurrentValue;
var getMinValue = require('./admin.js').getMinValue;
var endAuction = require('./admin.js').endAuction;

var DesignerBid = function(app, io, DesignerBID) {
    app.post('/bidfordesigner', function(req, res) {
        io.on('connection', function(socket) {
            socket.on('BIDcheck', function(msg) {
                var value = getCurrentValue();
                var minValue = getMinValue();
                if (value) {
                    if (value <= getMinValue) {
                        socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
                    } else {
                        //endAuction();
                        console.log('BIDsuccess');
                        socket.emit('BIDsuccess', 'A BID rogzitesre kerult');
                    }
                } else {
                    socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
                }
            });
            socket.on('disconnect', function() {});
        });

        var value = getCurrentValue();
        var minValue = getMinValue();
        if (value) {
            if (value <= getMinValue) {
                //nincs rogzitve a bid
            } else {
                endAuction();
                console.log('endAuction');
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
        console.log('redirect to /personal');
        res.redirect('/personal');
    });
};

exports.DesignerBid = DesignerBid;