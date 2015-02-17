var getCurrentValue = require('./admin.js').getCurrentValue;
var getMinValue = require('./admin.js').getMinValue;
var endAuction = require('./admin.js').endAuction;

var DesignerBid = function(app, io, DesignerBID) {
        io.on('connection', function(socket) {
            socket.on('BIDcheck', function(data) {
                var value = getCurrentValue();
                var minValue = getMinValue();
                if (value) {
                    if (value <= getMinValue) {
                        socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
                    } else {
                        endAuction();
                        console.log('BIDsuccess: '+ value);
                        socket.emit('BIDsuccess', 'A BID rogzitesre kerult');
                    }
                } else {
                    socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
                }
            });
            socket.on('disconnect', function() {});
        });
};

exports.DesignerBid = DesignerBid;