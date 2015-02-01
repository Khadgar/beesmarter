var mongoose = require('mongoose');

module.exports = function(mongoose) {
var Schema = mongoose.Schema;
var Settings = new Schema({
		id			: Number,
		votetimeout : Number
	}, {
		collection : 'settings'
	});
	
	var model= mongoose.model('settings', Settings);

return model;
}