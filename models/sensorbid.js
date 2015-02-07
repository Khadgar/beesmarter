var mongoose = require('mongoose');

module.exports = function (mongoose) {
	var Schema = mongoose.Schema;
	var SensorBID = new Schema({
			name : String
		}, {
			collection : 'SensorBID'
		});

	var model = mongoose.model('SensorBID', SensorBID);

	return model;
}