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