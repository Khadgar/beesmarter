var mongoose = require('mongoose');
mongoose.connect('mongodb://beesmarter:beesmarter@ds039261.mongolab.com:39261/beesmarterdb');

// var SensorBID = require('./models/sensorbid.js')(mongoose);
// SensorBID.find({}, function(err, sensorbids) {
//   sensorbids.forEach(function(sensorbid) {
//     sensorbid.remove();
//   });
// });

var Teams = require('./models/team.js')(mongoose);

Teams.count({
  role: null
}, function(err, c) {
  if (err) {
    console.log(err);
  }
});

var priorityList = require('./routes/priorityList.js');
var Designers = require('./models/designer.js')(mongoose);
var DesignerPriorityList = require('./models/designerPrioritylist.js')(mongoose);
var TeamPriorityList = require('./models/teamPrioritylist.js')(mongoose);
DesignerPriorityList.find({}).select({
  designerName: 1,
  list: 1,
  _id:0
}).exec(function(err, designerPrioritylists) {
  console.log(designerPrioritylists);
  TeamPriorityList.find({}).select({
    teamName: 1,
    list: 1,
    _id:0
  }).exec(function(err, teamPrioritylists) {
    console.log(teamPrioritylists);
    priorityList.handlePriorityListRoundFinished(Teams, Designers, designerPrioritylists, teamPrioritylists);
  });
});