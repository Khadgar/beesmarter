var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var getCurrentValue = require('./admin.js').getCurrentValue;
var getMinValue = require('./admin.js').getMinValue;
var getCurrentDesigner = require('./admin.js').getCurrentDesigner;
var endAuction = require('./admin.js').endAuction;

var designerContent = fs.readFileSync(path.join(__dirname, '../views/designerBid.html'), 'utf-8');
var designerCompiled = ejs.compile(designerContent);

var designerWonContent = fs.readFileSync(path.join(__dirname, '../views/designerWon.html'), 'utf-8');
var designerWonCompiled = ejs.compile(designerWonContent);


var DesignerBid = function(app, io, DesignerBID, Teams, Designers) {
    io.on('connection', function(socket) {
        socket.on('BIDcheck', function(data) {
            var username = data.username;

            Teams.findOne({
                TeamFullName: username
            }, function(error, team) {
                var value = getCurrentValue();
                var minValue = getMinValue();
                var designer = getCurrentDesigner();
                var money = team.money;

                var check = checkBid(value, minValue, money);
                if(check) {
                    endAuction();
                    var newdesignerbid = {
                        name: designer,
                        osszeg: value,
                        felado: username
                    };
                    var designerbid = new DesignerBID(newdesignerbid);
                    designerbid.save();

                    Designers.findOne({
                        name: designer
                    },function(err,des) {
                        des.team = username;
                        des.save();
                    });

                    team.designer = designer;
                    team.money -= value;
                    team.save();
                    endAuction();
                    io.emit('BIDsuccess', 'A BIDet ' + username +' nyerte ' + value + '-ért');
                } else {
                    console.log('BidFail');
                    socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
                }
            });
        });
        socket.on('disconnect', function() {});
    });


    app.get('/designer', isAuthenticated, function(req, res, next) {
        var list = [{name:'d1', value: 100},{name:'d2', value: 50}];

        Teams.findOne({
            TeamID: req.user.TeamID
        }, function(error, team) {
            writeHead(res);
            if(team.designer) {
                    res.end(designerWonCompiled({
                    username: team.TeamFullName
                }));
            }

            res.end(designerCompiled({
                username: team.TeamFullName,
                piorityList: list
            }));
        });
    });
};

var checkBid = function(value, minValue, money) {
    if (value) {
        if (value <= minValue || money < value) {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
};

exports.DesignerBid = DesignerBid;