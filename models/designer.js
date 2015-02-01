var mongoose = require('mongoose');

module.exports = function (mongoose) {
	var Schema = mongoose.Schema;
	var Designer = new Schema({
			name : String
		}, {
			collection : 'Designers'
		});

	var model = mongoose.model('Designers', Designer);

	return model;
}