var mongoose = require('mongoose');
mongoose.connect('mongodb://beesmarter:beesmarter@ds039261.mongolab.com:39261/beesmarterdb');

// var SensorBID = require('./models/sensorbid.js')(mongoose);
// SensorBID.find({}, function(err, sensorbids) {
//   sensorbids.forEach(function(sensorbid) {
//     sensorbid.remove();
//   });
// });

var Teams = require('./models/team.js')(mongoose);
Teams.update({
  role: null
}, {
  money: 1000,
  designer: null,
  teamVote: 0,
  appVote: 0
}, {
  multi: true
}, function(err, des) {
  console.log(err);
});