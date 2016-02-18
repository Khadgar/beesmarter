var mongoose = require('mongoose');

module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var Team = new Schema({
		TeamID: String,
		TeamFullName: String,
		broughtResult: Number,
		money: Number,
		designer: String,
		teamVote: Number,
    appVote: Number,
		role: String
	}, {
		collection: 'Teams'
	});

	var model = mongoose.model('Teams', Team);

	return model;
};