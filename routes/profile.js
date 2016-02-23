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

                                        Teams.find().exec(function(err, teams) {
                                            res.render('results', {
                                                username: user.name,
                                                designerPriorityLists: currentDesignerPriorityList,
                                                teamPriorityLists: currentTeamPriorityList,
                                                sensorbids: sensorBids,
                                                designerResult: designers,
                                                teamResult: teams,
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

    return 0;
};

exports.sortPriorityList = sortPriorityList;
exports.sortMergedPriorityList = sortMergedPriorityList;
exports.Profile = Profile;