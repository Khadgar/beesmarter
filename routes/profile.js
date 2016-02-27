var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var util = require('util');

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;


var Profile = function(app, io, Teams, DesignerPriorityList, TeamPriorityList, Designers, SensorBID, Users) {

    app.get('/', isAuthenticated, function(req, res, next) {
        res.redirect('/results');
    });

    app.get('/results', isAuthenticated, function(req, res, next) {
        Users.findOne({
            ID: req.user.ID
        }, function(error, user) {
            writeHead(res);

            DesignerPriorityList.find().select({
                '_id': 0,
                'designerName': 1,
                'list': 1
            }).exec(
                function(err, designerPrioritylists) {
                    TeamPriorityList.find().select({
                        '_id': 0,
                        'teamName': 1,
                        'list': 1
                    }).exec(
                        function(err, teamPrioritylists) {
                            SensorBID.find().exec(function(err, sensorBids) {
                                Designers.find().exec(function(err, designers) {
                                    Teams.find().exec(function(err, teams) {

                                        var currentDesignerPriorityList = [];
                                        var currentTeamPriorityList = [];
                                        // Ha mindenki leadta a listajat vagy, ha admin vagyok
                                        if ((designerPrioritylists && teamPrioritylists) && ((designerPrioritylists.length === designers.length && teamPrioritylists.length === teams.length) || user.role == "admin")) {
                                            currentDesignerPriorityList = sortPriorityList(designerPrioritylists);
                                            currentTeamPriorityList = sortPriorityList(teamPrioritylists);
                                        }

                                        teamsSummed = sortTeams(teams);
                                        designersSummed = sortDesigners(designers);

                                        Teams.find().exec(function(err, teams) {
                                            res.render('results', {
                                                username: user.name,
                                                designerPriorityLists: currentDesignerPriorityList,
                                                teamPriorityLists: currentTeamPriorityList,
                                                sensorbids: sensorBids,
                                                designerResult: designersSummed,
                                                teamResult: teamsSummed,
                                                path: "/results",
                                                role: user.role
                                            });
                                        });

                                    });
                                });
                            });
                        }
                    );
                }
            );
        });
    });

    app.get('/getgitkey', isAuthenticated, function(req, res, next) {
        var filename = req.user.ID + '_git.pub';
        res.redirect('/'+filename);
    });
};

var sortTeams = function(teams) {
    summedTeams = teams.map(function(team) {
        var sum = team.teamVote + team.appVote;
        team.sum = sum;
        return team;
    });

    return summedTeams.sort(compareSums);
};


var sortDesigners = function(designers) {
    summedDesigners = designers.map(function(designer) {
        var sum = designer.designerVote + designer.appVote;
        designer.sum = sum;
        return designer;
    });

    return summedDesigners.sort(compareSums);
};

var compareSums = function(summedObject1, summedObject2) {
     if (summedObject1.sum > summedObject2.sum) {
        return -1;
    }
    if (summedObject1.sum < summedObject2.sum) {
        return 1;
    }

    return 0;
};


var sortPriorityList = function(priorityList) {
    return priorityList.sort(comparePriorityList);
};

var comparePriorityList = function(priorityList1, priorityList2) {
    var priorityList1Max = priorityList1.list.sort(compareBids)[0].value;
    var priorityList2Max = priorityList2.list.sort(compareBids)[0].value;

    if (priorityList1Max > priorityList2Max) {
        return -1;
    }
    if (priorityList1Max < priorityList2Max) {
        return 1;
    }

    return 0;
};

var compareBids = function(bid1, bid2) {
    if (bid1.value > bid2.value) {
        return -1;
    }
    if (bid1.value < bid2.value) {
        return 1;
    }

    return 0;
};

var sortMergedPriorityList = function(mergedPriorityList) {
    return mergedPriorityList.sort(compareMergedPriorityList);
};

var compareMergedPriorityList = function(mergedPriorityList1, mergedPriorityList2) {
    if(mergedPriorityList1.designerBidValue + mergedPriorityList1.teamBidValue > mergedPriorityList2.designerBidValue + mergedPriorityList2.teamBidValue) {
        return -1;
    }
    if(mergedPriorityList1.designerBidValue + mergedPriorityList1.teamBidValue < mergedPriorityList2.designerBidValue + mergedPriorityList2.teamBidValue) {
        return 1;
    }
    if(mergedPriorityList1.designerPrio < mergedPriorityList2.designerPrio) {
        return -1;
    }
    if(mergedPriorityList1.designerPrio > mergedPriorityList2.designerPrio) {
        return 1;
    }
    if(mergedPriorityList1.teamPrio < mergedPriorityList2.teamPrio) {
        return -1;
    }
    if(mergedPriorityList1.teamPrio > mergedPriorityList2.teamPrio) {
        return 1;
    }

    return 0;
};

exports.sortPriorityList = sortPriorityList;
exports.sortMergedPriorityList = sortMergedPriorityList;
exports.Profile = Profile;
exports.compareBids = compareBids;