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
var checkBid = require('./admin.js').checkBid;
var setPriorityListRoundFinished = require('./admin.js').setPriorityListRoundFinished;


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

        socket.on('BIDcheck', function(data) {
            var teamFullName = data.username;
            handleDesignerBid(Teams, DesignerBID, PriorityList, Designers, teamFullName, io);

        });
        socket.on('disconnect', function() {});
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

        //Le kell ellenorizni, minden field ki volt-e toltve, hogy 5-nel nagyobb es 1000-nel kisebb,
        //  illetve, hogy kulonbozo ertekuek-e es legalabb 5 a kulonbseg koztuk.
        //Mindegyikre figyel a kliens, de kiszedheti html-ből

        Teams.findOne({
            TeamID: req.user.TeamID
        }, function(error, team) {
            var newList = [];
            for (var key in req.body) {
                //Le kell ellenorizni, hogy ki van-e toltve
                if(!req.body[key]) {
                    console.log('Not all values have been filled out!');
                    return res.redirect('/designer');
                }
                //Le kell ellenorizni, hogy szam-e
                else if(!parseInt(req.body[key])) {
                    console.log('Only numbers are valid values!');
                    return res.redirect('/designer');
                }
                newList.push({
                    designer: key,
                    value: req.body[key]
                });
            }

            //Le kell ellenorizni, minden field ki  5-nelnagyobb es 1000-nel kisebb,
            //  illetve, hogy kulonbozo ertekuek-e es legalabb 5 a kulonbseg koztuk.
            for (var i = 0; i < newList.length - 1; i++) {
                var value = newList[i].value;
                var nextValue = newList[i + 1].value;

                if ((value >= 5 && value <=1000) && (Math.abs(value - nextValue) >= 5)) {
                } else {
                    console.log('The values have to be >= 5, <= 1000 and the differences have to be >= 5!');
                    return res.redirect('/designer');
                }
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
                            var designersWithBids = getAvrgDesignerBids(priorityLists, designers);
                            addAvrgDesignerBids(Designers, designersWithBids);
                        });
                        io.emit('priorityListRoundFinished');
                        setPriorityListRoundFinished(true);
                    }

                });
            });

            res.redirect('/designer');
        });
    });
};

var handleDesignerBid = function(Teams, DesignerBID, PriorityList, Designers, teamFullName, io) {
    Teams.findOne({
        TeamFullName: teamFullName
    }, function(error, team) {
        var value = getCurrentValue();
        var minValue = getMinValue();
        var designer = getBidSubject();
        var money = team.money;

        var check = checkBid(value, minValue, money);

        if (check.returnValue) {
            handleDesignerBidSuccess(DesignerBID, PriorityList, Designers, designer, value, team);
            io.emit('BIDsuccess', {
                msg: teamFullName + ' has won the bid for ' + designer + ' for ' + value
            });
        } else {
            socket.emit('BIDfail', 'The bid was not recorded. ' + check.message);
        }
    });
};

var getAvrgDesignerBids = function(priorityLists, designers) {
    var designersWithBids = designers.map(function(designer) {
        return {
            name: designer.name,
            avrgBid: 0
        };
    });

    priorityLists.forEach(function(priorityList) {
        priorityList.list.forEach(function(listElement) {
            designersWithBids.forEach(function(designerWithBids) {
                if (listElement.designer === designerWithBids.name) {
                    designerWithBids.avrgBid += listElement.value / teamCount;
                }
            });

        });
    });

    designersWithBids.forEach(function(designerWithBids) {
        designerWithBids.avrgBid = Math.round(designerWithBids.avrgBid * 1000) / 1000;
    });

    return designersWithBids;
};

var addAvrgDesignerBids = function(Designers, designersWithBids) {
    designersWithBids.forEach(function(designerWithBid) {
        Designers.update({
            name: designerWithBid.name
        }, {
            avrgBid: designerWithBid.avrgBid
        }, {
            multi: false
        }, function(err) {
            if (err) {
                console.log(err);
            }
        });
    });
};


exports.DesignerBid = DesignerBid;