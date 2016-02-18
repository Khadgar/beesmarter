var mongoose = require('mongoose');

module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var User = new Schema({
    ID: String,
    Password: String,
    name: String,
    role: String
  }, {
    collection: 'Users'
  });

  var model = mongoose.model('Users', User);

  return model;
};