var mongoose = require('mongoose');

module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var Designer = new Schema({
    name: String,
    maxBid: Number,
    avrgBid: Number,
    designerVote: Number,
    appVote: Number
  }, {
    collection: 'Designers'
  });

  var model = mongoose.model('Designers', Designer);

  return model;
};