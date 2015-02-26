var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var util = require('util');

var profilecontent = fs.readFileSync(path.join(__dirname, '../views/results.html'), 'utf-8');
var profilecompiled = ejs.compile(profilecontent);

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var Profile = function(app, io, Teams, PriorityList, DesignerBID, Designers, SensorBID) {

    app.get('/', isAuthenticated, function(req, res, next) {
        res.redirect('/results');
    });

    app.get('/results', isAuthenticated, function(req, res, next) {
        Teams.findOne({
            TeamID: req.user.TeamID
        }, function(error, user) {
            writeHead(res);

            PriorityList.find().select({
                '_id': 0,
                'team': 1,
                'list': 1
            }).exec(
                function(err, priorityLists) {
                    var currentPriorityList = sortPriorityList(priorityLists);

                    DesignerBID.find().exec(function(err, designerBids) {
                        SensorBID.find().exec(function(err, sensorBids) {
                            Designers.find().exec(function(err, designers) {
                                Teams.find().exec(function(err, teams) {
                                    var competitorTeams = teams.filter(function(team) {
                                        return !team.role;
                                    });
                                    res.end(profilecompiled({
                                        username: user.TeamFullName,
                                        priorityLists: currentPriorityList,
                                        designerbids: designerBids,
                                        sensorbids: sensorBids,
                                        designerResult: designers,
                                        teamResult: competitorTeams
                                    }));
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