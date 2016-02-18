var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var util = require('util');

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;


var Profile = function(app, io, Teams, PriorityList, Designers, SensorBID, Users) {

    app.get('/', isAuthenticated, function(req, res, next) {
        res.redirect('/results');
    });

    app.get('/results', isAuthenticated, function(req, res, next) {
        Users.findOne({
            ID: req.user.ID
        }, function(error, user) {
            writeHead(res);

            PriorityList.find().select({
                '_id': 0,
                'designerName': 1,
                'list': 1
            }).exec(
                function(err, priorityLists) {
                    SensorBID.find().exec(function(err, sensorBids) {
                        Designers.find().exec(function(err, designers) {

                            var currentPriorityList = [];
                            // Ha mindenki leadta a listajat vagy, ha admin vagyok
                            if (priorityLists.length === designers.length || user.role == "admin") {
                                currentPriorityList = sortPriorityList(priorityLists);
                            }

                            Teams.find().exec(function(err, teams) {
                                res.render('results', {
                                    username: user.name,
                                    priorityLists: currentPriorityList,
                                    sensorbids: sensorBids,
                                    designerResult: designers,
                                    teamResult: teams,
                                    path: "/results",
                                    role: user.role
                                });
                            });

                        });
                    });
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

exports.sortPriorityList = sortPriorityList;
exports.compareBids = compareBids;
exports.Profile = Profile;