var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var profilecontent = fs.readFileSync(path.join(__dirname, '../views/results.html'), 'utf-8');
var profilecompiled = ejs.compile(profilecontent);

var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var Profile = function(app, io, Teams, PriorityList) {

    app.get('/', isAuthenticated, function(req, res, next) {
        writeHead(res);
        res.end(profilecompiled({
            username: req.user.TeamFullName
        }));
    });

    app.get('/results', isAuthenticated, function(req, res, next) {
        Teams.findOne({
            TeamID: req.user.TeamID
        }, function(error, user) {
            writeHead(res);
            PriorityList.find().select({ '_id': 0, 'team': 1, 'list': 1}).exec(
                function(err, priorityLists){
                    var currentPriorityList = priorityLists.map(
                        function(priorityList) {
                            var newList = priorityList.list;
                            newList = priorityList.list.map(
                                function(bid) {
                                    return {
                                        designer: bid.designer,
                                        value:bid.value
                                    };
                                }
                            );
                            return {
                                team: priorityList.team,
                                list: newList
                            };
                        }
                    );
                    res.end(profilecompiled({
                            username: user.TeamFullName,
                            priorityLists: currentPriorityList
                        })
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
    var priorityList1Max = priorityList1.list.sort();
    var priorityList2Max = priorityList2.list.sort();

    if (priorityList1Max < priorityList2Max) {
        return -1;
    }
    if (priorityList1Max > priorityList2Max) {
        return 1;
    }

    return 0;
};

exports.Profile = Profile;