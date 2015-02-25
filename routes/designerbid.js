var fs = require('fs');
var path = require('path');
var ejs = require('ejs');


var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;


var getCurrentValue = require('./admin.js').getCurrentValue;
var getMinValue = require('./admin.js').getMinValue;
var getBidSubject = require('./admin.js').getBidSubject;
var endAuction = require('./admin.js').endAuction;
var teamCount = require('./admin.js').teamCount;
var handleDesignerBidSuccess = require('./admin.js').handleDesignerBidSuccess;


var sortPriorityList = require('./profile.js').sortPriorityList;


var designerPriorityContent = fs.readFileSync(path.join(__dirname, '../views/designerPriority.html'), 'utf-8');
var designerPriorityCompiled = ejs.compile(designerPriorityContent);

var designerBidContent = fs.readFileSync(path.join(__dirname, '../views/designerBid.html'), 'utf-8');
var designerBidCompiled = ejs.compile(designerBidContent);

var designerBidAdminContent = fs.readFileSync(path.join(__dirname, '../views/designerBidAdmin.html'), 'utf-8');
var designerBidAdminCompiled = ejs.compile(designerBidAdminContent);

var designerWonContent = fs.readFileSync(path.join(__dirname, '../views/designerWon.html'), 'utf-8');
var designerWonCompiled = ejs.compile(designerWonContent);



var DesignerBid = function(app, io, DesignerBID, Teams, Designers, PriorityList) {
    io.on('connection', function(socket) {
        console.log('CONNECTED , designerbid.js');

        socket.on('BIDcheck', function(data) {
            var teamFullName = data.username;
            handleDesignerBid(Teams, DesignerBID, PriorityList, teamFullName, io);

        });
        socket.on('disconnect', function() {
            console.log('DISCONNECTED , designerbid');
        });
    });


    app.get('/designer', isAuthenticated, function(req, res, next) {
        Teams.findOne({
            TeamID: req.user.TeamID
        }, function(error, team) {
            writeHead(res);
            if (team.designer) {
                res.end(designerWonCompiled({
                    username: team.TeamFullName
                }));
            } else {
                PriorityList.find({
                    team: team.TeamFullName
                }, function(err, list) {
                    //Ha admin jogom van
                    if (team.role === 'on') {
                        res.end(designerBidAdminCompiled({
                            username: team.TeamFullName
                        }));
                    }

                    //Ha nincs prioritas listam
                    if (!list.length) {
                        Designers.find()
                            .select('name')
                            .exec(function(err, designers) {
                                res.end(designerPriorityCompiled({
                                    username: team.TeamFullName,
                                    designers: designers
                                }));
                            });
                    } else {
                        res.end(designerBidCompiled({
                            username: team.TeamFullName
                        }));
                    }
                });
            }
        });
    });

    app.post('/priorityList', isAuthenticated, function(req, res) {

        //Le kell ellenorizni, minden field ki volt-e toltve, hogy 10-nel nagyobb es 1000-nel kisebb,
        //  illetve, hogy kulonbozo ertekuek-e. Mindegyikre figyel a kliens, de kiszedheti html-ből, hogy figyeljen

        Teams.findOne({
            TeamID: req.user.TeamID
        }, function(error, team) {
            var newList = [];
            for (var key in req.body) {
                newList.push({
                    designer: key,
                    value: req.body[key]
                });
            }
            var newPriorityList = {
                team: team.TeamFullName,
                list: newList
            };

            var priorityList = new PriorityList(newPriorityList);
            priorityList.save(function(err) {

                PriorityList.find().exec(function(err, priorityLists) {

                    if (priorityLists.length === teamCount) {

                        Designers.find().select({
                            '_id': 0,
                            'name': 1
                        }).exec(function(err, designers) {
                            var designersWithBids = getMaxDesignerBids(priorityLists, designers);
                            addMaxDesignerBids(Designers, designersWithBids);
                        });
                        io.emit('priorityListRoundFinished');
                    }

                });
            });

            res.redirect('/designer');
        });
    });
};

var handleDesignerBid = function(Teams, DesignerBID, PriorityList, teamFullName, io) {
    Teams.findOne({
        TeamFullName: teamFullName
    }, function(error, team) {
        var value = getCurrentValue();
        var minValue = getMinValue();
        var designer = getBidSubject();
        var money = team.money;

        var check = checkBid(value, minValue, money);
        if (check) {
            handleDesignerBidSuccess(DesignerBID, PriorityList, designer, value, teamFullName, team);
            io.emit('BIDsuccess', {
                msg: 'A BIDet ' + teamFullName + ' nyerte ' + value + '-ért'
            });
        } else {
            console.log('BidFail');
            socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
        }
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

var getMaxDesignerBids = function(priorityLists, designers) {
    var designersWithBids = designers.map(function(designer) {
        return {
            name: designer.name,
            maxBid: 0
        };
    });

    priorityLists.forEach(function(priorityList) {
        priorityList.list.forEach(function(listElement) {
            designersWithBids.forEach(function(designerWithBids) {
                if (listElement.designer === designerWithBids.name) {
                    if (listElement.value > designerWithBids.maxBid) {
                        designerWithBids.maxBid = listElement.value;
                    }
                }
            });

        });
    });

    return designersWithBids;
};

var addMaxDesignerBids = function(Designers, designersWithBids) {
    designersWithBids.forEach(function(designerWithBid) {
        Designers.update({
            name: designerWithBid.name
        }, {
            maxBid: designerWithBid.maxBid
        }, {
            multi: false
        }, function(err) {});
    });
};


exports.DesignerBid = DesignerBid;