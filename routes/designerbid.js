var fs = require('fs');
var path = require('path');
var ejs = require('ejs');


var writeHead = require('./utils.js').writeHead;
var isAuthenticated = require('./login.js').isAuthenticated;

var sortPriorityList = require('./profile.js').sortPriorityList;
var compareBids = require('./profile.js').compareBids;



var DesignerBid = function(app, io, Teams, Designers, PriorityList, Users) {

    app.get('/designer', isAuthenticated, function(req, res, next) {
        Users.findOne({
            ID: req.user.ID
        }, function(error, user) {
            writeHead(res);
            PriorityList.find({
                designerName: user.name
            }, function(err, list) {
                //Ha nincs prioritas listam
                if (!list.length) {
                    Teams.find().select('TeamFullName')
                        .exec(function(err, teams) {
                            res.render('designerPriority', {
                                username: user.name,
                                teams: teams,
                                path: "/designer"
                            });
                        });
                } else {
                    res.render('designerWon', {
                        username: user.name,
                        path: "/designer"
                    });
                }
            });
        });
    });

    app.post('/priorityList', isAuthenticated, function(req, res) {

        //Le kell ellenorizni, minden field ki volt-e toltve, hogy 5-nel nagyobb es 500-nel kisebb=,
        //  illetve, hogy kulonbozo ertekuek-e es legalabb 5 a kulonbseg koztuk.
        //Mindegyikre figyel a kliens, de kiszedheti html-ből
        Users.findOne({
            ID: req.user.ID
        }, function(error, user) {
            var newList = [];
            for (var key in req.body) {
                //Le kell ellenorizni, hogy ki van-e toltve
                if (!req.body[key]) {
                    console.log('Not all values have been filled out!');
                    return res.redirect('/designer');
                }
                //Le kell ellenorizni, hogy szam-e
                else if (!parseInt(req.body[key])) {
                    console.log('Only numbers are valid values!');
                    return res.redirect('/designer');
                }
                newList.push({
                    team: key,
                    value: req.body[key]
                });
            }

            //Le kell ellenorizni, minden field ki  5-nelnagyobb es 1000-nel kisebb,
            //  illetve, hogy kulonbozo ertekuek-e es legalabb 5 a kulonbseg koztuk.
            for (var i = 0; i < newList.length - 1; i++) {
                var value = newList[i].value;
                var nextValue = newList[i + 1].value;

                if ((value >= 5 && value <= 500) && (Math.abs(value - nextValue) >= 5)) {} else {
                    console.log('The values have to be >= 5, <= 500 and the differences have to be >= 5!');
                    return res.redirect('/designer');
                }
            }

            var newPriorityList = {
                designerName: user.name,
                // UTC date
                createdAt: new Date(),
                list: newList
            };

            var priorityList = new PriorityList(newPriorityList);
            priorityList.save(function(err) {

                PriorityList.find().exec(function(err, priorityLists) {
                    Designers.count({
                        role: null
                    }, function(err, designerCount) {
                        if (priorityLists.length === designerCount) {
                            io.emit('priorityListRoundFinished');
                            handlePriorityListRoundFinished(Teams, Designers, PriorityList);
                        }
                    });
                });
            });

            res.redirect('/designer');
        });
    });
};

var handlePriorityListRoundFinished = function(Teams, Designers, PriorityList) {
    // Ha minden designer leadta a prioritasi listajat, osszeparositjuk a team-ekkel
    // Elsosorban az dont, hogy ki adta a legnagyobb bid-et a csapatra, ha ket designer is ugyanannyit adott,
    //  akkor az ido dont(aki hamarabb adta). -> ez TODO
    PriorityList.find().select({
        '_id': 0,
        'designerName': 1,
        'list': 1
    }).exec(
        function(err, priorityLists) {
            var sortedPriorityLists = sortPriorityList(priorityLists);
            var length = sortedPriorityLists.length;

            for (var i = 0; i < length; i++) {
                console.log(sortedPriorityLists);
                var currentBid = sortedPriorityLists[0].list.sort(compareBids)[0];
                var currentBidLeader = sortedPriorityLists[0].designerName;
                sortedPriorityLists = updatePriorityLists(Teams, Designers, sortedPriorityLists, currentBidLeader, currentBid.team);
            }
        });

};

var updatePriorityLists = function(Teams, Designers, sortedPriorityLists, designerName, teamName) {

    Teams.findOne({
        TeamFullName: teamName
    }, function(err, team) {
        Designers.findOne({
            name: designerName
        }, function(err, designer) {
            team.designer = designerName;
            team.money += designer.money;
            team.save();
        });

    });

    return sortPriorityList(sortedPriorityLists.filter(function(prioList) {
        prioList.list = prioList.list.filter(function(valueList) {
            return valueList.team !== teamName;
        });
        return prioList.designerName !== designerName;
    }));
};


exports.DesignerBid = DesignerBid;