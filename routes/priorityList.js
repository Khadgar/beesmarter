var fs = require('fs');
var path = require('path');
var ejs = require('ejs');


var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var sortPriorityList = require('./profile.js').sortPriorityList;
var sortMergedPriorityList = require('./profile.js').sortMergedPriorityList;



var DesignerBid = function(app, io, Teams, Designers, DesignerPriorityList, TeamPriorityList, Users) {

    app.get('/priorityList', isAuthenticated, function(req, res, next) {
        Users.findOne({
            ID: req.user.ID
        }, function(error, user) {
            writeHead(res);
            // A designer wants to load the prioritylist page
            if (user.role === "designer") {
                DesignerPriorityList.find({
                    designerName: user.name
                }, function(err, designerPrioritylist) {
                    //Ha nincs prioritas listam
                    if (!designerPrioritylist.length) {
                        Teams.find().select('TeamFullName')
                            .exec(function(err, teams) {
                                res.render('priorityList', {
                                    username: user.name,
                                    teams: teams,
                                    designers: false,
                                    path: "/priorityList",
                                    role: user.role
                                });
                            });
                    } else {
                        res.render('prioritySuccess', {
                            username: user.name,
                            path: "/priorityList",
                            role: user.role
                        });
                    }
                });
                // A team wants to load the prioritylist page
            } else {
                TeamPriorityList.find({
                    teamName: user.name
                }, function(err, teamPrioritylist) {
                    //Ha nincs prioritas listam
                    if (!teamPrioritylist.length) {
                        Designers.find().select('name')
                            .exec(function(err, designers) {
                                res.render('priorityList', {
                                    username: user.name,
                                    designers: designers,
                                    teams: false,
                                    path: "/priorityList",
                                    role: user.role
                                });
                            });
                    } else {
                        res.render('prioritySuccess', {
                            username: user.name,
                            path: "/priorityList",
                            role: user.role
                        });
                    }
                });
            }
        });
    });

    app.post('/priorityList', isAuthenticated, function(req, res) {

        //Le kell ellenorizni, minden field ki volt-e toltve, hogy 5-nel nagyobb es 500-nel kisebb=,
        //  illetve, hogy kulonbozo ertekuek-e es legalabb 5 a kulonbseg koztuk.
        //Mindegyikre figyel a kliens, de kiszedheti html-ből
        Users.findOne({
            ID: req.user.ID
        }, function(error, user) {

            if (user.role === "designer") {
                var newDesignerList = checkPriorityList(req, user.role);

                var newDesignerPriorityList = {
                    designerName: user.name,
                    // UTC date
                    createdAt: new Date(),
                    list: newDesignerList
                };

                var designerPrioritylist = new DesignerPriorityList(newDesignerPriorityList);
                designerPrioritylist.save(function(err) {});
            } else {
                var newTeamList = checkPriorityList(req, user.role);

                var newTeamPrioritylist = {
                    teamName: user.name,
                    // UTC date
                    createdAt: new Date(),
                    list: newTeamList
                };

                var teamPrioritylist = new TeamPriorityList(newTeamPrioritylist);
                teamPrioritylist.save(function(err) {});
            }

            DesignerPriorityList.find({}).select({
                designerName: 1,
                list: 1,
                _id: 0
            }).exec(function(err, designerPrioritylists) {
                if (designerPrioritylists) {
                    Designers.count({}, function(err, designerCount) {
                        TeamPriorityList.find({}).select({
                            teamName: 1,
                            list: 1,
                            _id: 0
                        }).exec(function(err, teamPrioritylists) {
                            if (teamPrioritylists) {
                                Teams.count({}, function(err, teamCount) {
                                    if (teamPrioritylists.length === teamCount && designerPrioritylists.length === designerCount) {
                                        io.emit('priorityListRoundFinished');
                                        handlePriorityListRoundFinished(Teams, Designers, designerPrioritylists, teamPrioritylists);
                                    }
                                });
                            }
                        });
                    });
                }
            });

            res.redirect('/priorityList');
        });
    });
};

var checkPriorityList = function(req, role) {
    var newList = [];
    for (var key in req.body) {
        //Le kell ellenorizni, hogy ki van-e toltve
        if (!req.body[key]) {
            console.log('Not all values have been filled out!');
            return res.redirect('/priorityList');
        }
        //Le kell ellenorizni, hogy szam-e
        else if (!parseInt(req.body[key])) {
            console.log('Only numbers are valid values!');
            return res.redirect('/priorityList');
        }
        if (role === "designer") {
            newList.push({
                team: key,
                value: req.body[key]
            });
        } else {
            newList.push({
                designer: key,
                value: req.body[key]
            });
        }
    }

    //Le kell ellenorizni, minden field ki  10-nel nagyobb es 1000-nel kisebb,
    //  illetve, hogy kulonbozo ertekuek-e es legalabb 10 a kulonbseg koztuk.
    // Hogy 10-zel osztható legyen és, hogy mind az 1000-t fölrakták-e
    var sum = newList[0].value;
    for (var i = 0; i < newList.length - 1; i++) {
        var value = newList[i].value;
        var nextValue = newList[i + 1].value;

        if ((value >= 10 && value <= 1000) && (Math.abs(value - nextValue) >= 10) && value % 10 === 0) {} else {
            console.log('The values have to be >= 10, <= 1000 and the differences have to be >= 10 and value mod 10 should be zero!');
            return res.redirect('/priorityList');
        }
        sum += nextValue;
    }
    if (sum !== 1000) {
        console.log('The values sum has to be 1000!');
        return res.redirect('/priorityList');
    }

    return newList;
    // TODO check team with different values, add sum check
};


var handlePriorityListRoundFinished = function(Teams, Designers, designerPrioritylists, teamPrioritylists) {
    // Ha minden designer leadta a prioritasi listajat, osszeparositjuk a designereket a team-ekkel
    // Mindenkit mindekivel parositva -> max ertek elso
    var mergedPriorityLists = mergePriorityLists(designerPrioritylists, teamPrioritylists);
    var sortedMergedPrioritylists = sortMergedPriorityList(mergedPriorityLists);

    var length = designerPrioritylists.length;

    for (var i = 0; i < length; i++) {
        var leader = sortedMergedPrioritylists[0];
        sortedMergedPrioritylists = updateWinner(leader, Teams, Designers, sortedMergedPrioritylists);
    }
};

var mergePriorityLists = function(designerPrioritylists, teamPrioritylists) {
    var mergedPriorityLists = [];

    designerPrioritylists.forEach(function(designerPrioritylist) {
        designerPrioritylist.list.forEach(function(designerBid) {
            teamPrioritylists.every(function(teamPrioritylist) {
                var teamBid = teamPrioritylist.list.find(function(bid) {
                    return (bid.designer === designerPrioritylist.designerName && designerBid.team === teamPrioritylist.teamName);
                });

                if (teamBid) {
                    var mergedPriorityList = {
                        designerName: designerPrioritylist.designerName,
                        teamName: teamPrioritylist.teamName,
                        designerBidValue: designerBid.value,
                        teamBidValue: teamBid.value
                    };
                    mergedPriorityLists.push(mergedPriorityList);

                    return false;
                }

                return true;
            });
        });
    });

    return mergedPriorityLists;
};

var updateWinner = function(winnerBid, Teams, Designers, sortedMergedPrioritylists) {
    Teams.findOne({
        TeamFullName: winnerBid.teamName
    }, function(err, team) {
        Designers.findOne({
            name: winnerBid.designerName
        }, function(err, designer) {

            designer.money -= winnerBid.designerBidValue + winnerBid.teamBidValue;
            designer.save(function(err) {});

            team.designer = winnerBid.designerName;
            team.money += designer.money;
            team.save(function(err) {});
        });
    });

    return sortMergedPriorityList(sortedMergedPrioritylists.filter(function(prioList) {
        return !(prioList.designerName === winnerBid.designerName || prioList.teamName === winnerBid.teamName);
    }));
};


exports.DesignerBid = DesignerBid;
exports.handlePriorityListRoundFinished = handlePriorityListRoundFinished;