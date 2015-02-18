var mongoose = require('mongoose');

module.exports = function (mongoose) {
    var Schema = mongoose.Schema;
    var Sensor = new Schema({
            name : String
        }, {
            collection : 'Sensors'
        });

    var model = mongoose.model('Sensors', Sensor);

    return model;
};