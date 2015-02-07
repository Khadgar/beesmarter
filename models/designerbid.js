var mongoose = require('mongoose');

module.exports = function (mongoose) {
	var Schema = mongoose.Schema;
	var DesignerBID = new Schema({
			name : String,
			osszeg: String,
			felado: String
		}, {
			collection : 'DesignerBID'
		});

	var model = mongoose.model('DesignerBID', DesignerBID);

	return model;
}