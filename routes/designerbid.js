var fs = require('fs');
var path = require('path');
var ejs = require('ejs');


var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;


var getCurrentValue = require('./admin.js').getCurrentValue;
var getMinValue = require('./admin.js').getMinValue;
var getBidSubject = require('./admin.js').getBidSubject;
var endAuction = require('./admin.js').endAuction;


var sortPriorityList = require('./profile.js').sortPriorityList;


var designerPriorityContent = fs.readFileSync(path.join(__dirname, '../views/designerPriority.html'), 'utf-8');
var designerPriorityCompiled = ejs.compile(designerPriorityContent);

var designerBidContent = fs.readFileSync(path.join(__dirname, '../views/designerBid.html'), 'utf-8');
var designerBidCompiled = ejs.compile(designerBidContent);

var designerWonContent = fs.readFileSync(path.join(__dirname, '../views/designerWon.html'), 'utf-8');
var designerWonCompiled = ejs.compile(designerWonContent);

var teamCount = 3;

var DesignerBid = function(app, io, DesignerBID, Teams, Designers, PriorityList) {
    io.on('connection', function(socket) {
        console.log('CONNECTED , designerbid.js');
        socket.on('BIDcheck', function(data) {
            var username = data.username;

            Teams.findOne({
                TeamFullName: username
            }, function(error, team) {
                var value = getCurrentValue();
                var minValue = getMinValue();
                var designer = getBidSubject();
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

                    team.designer = designer;
                    team.money -= value;
                    team.save();

                    io.emit('BIDsuccess', {
                        msg:'A BIDet ' + username +' nyerte ' + value + '-ért'
                    });
                } else {
                    console.log('BidFail');
                    socket.emit('BIDfail', 'A BID nem kerult rogzitesre');
                }
            });
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
            if(team.designer) {
                    res.end(designerWonCompiled({
                    username: team.TeamFullName
                }));
            }
            else{
                PriorityList.find({
                    team: team.TeamFullName
                }, function(err, list){
                    //Ha nincs prioritas listam
                    if(!list.length) {
                        Designers.find()
                            .select('name')
                            .exec(function(err, designers) {
                                    res.end(designerPriorityCompiled({
                                        username: team.TeamFullName,
                                        designers: designers
                                    }));
                            });
                    }
                    else {
                        res.end(designerBidCompiled({
                            username: team.TeamFullName
                        }));
                    }
                });
            }
        });
    });

    app.post('/priorityList', isAuthenticated, function(req, res){
        Teams.findOne({
            TeamID: req.user.TeamID
        }, function(error, team) {
            var newList = [];
            for(var key in req.body){
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
                    updatePriorityLists(PriorityList, priorityLists);

                    if(priorityLists.length === teamCount) {

                        Designers.find().select({ '_id': 0, 'name': 1}).exec(function(err, designers){
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
                if(listElement.designer === designerWithBids.name) {
                    if(listElement.value > designerWithBids.maxBid) {
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
        Designers.update({name: designerWithBid.name}, {maxBid: designerWithBid.maxBid}, {multi: false}, function (err) {});
    });
};

var updatePriorityLists = function(PriorityList, priorityLists) {
    var sortedPriorityLists = sortPriorityList(priorityLists);
    sortedPriorityLists.forEach(function(priorityList) {
        PriorityList.update({team: priorityList.team}, {list: priorityList.list}, {multi: false}, function (err) {});
    });
};

exports.DesignerBid = DesignerBid;