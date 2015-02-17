var mongoose = require('mongoose');

module.exports = function (mongoose) {
	var Schema = mongoose.Schema;
	var Team = new Schema({
			TeamID : String,
			Password : String,
			TeamFullName : String,
			money: Number,
			designer: String,
			role : String
		}, {
			collection : 'Teams'
		});

	var model = mongoose.model('Teams', Team);

	return model;
};