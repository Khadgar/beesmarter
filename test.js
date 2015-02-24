var mongoose = require('mongoose');
mongoose.connect('mongodb://beesmarter:beesmarter@ds039261.mongolab.com:39261/beesmarterdb');

var PriorityList = require('./models/prioritylist.js')(mongoose);

PriorityList.update({}, {
  $pull: {
    list: {
      designer: "Designer Srác 1"
    }
  }
}, {
  multi: true
}, function(err, numberAffected) {
  if (err) return console.log(err);
  console.log('The number of updated documents was %d', numberAffected);
});