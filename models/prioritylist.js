var mongoose = require('mongoose');

module.exports = function(mongoose) {
    var Schema = mongoose.Schema;
    var PriorityList = new Schema({
        team: String,
        list: [{
            designer: String,
            value: Number
        }]
    }, {
        collection: 'PriorityList'
    });

    var model = mongoose.model('PriorityList', PriorityList);

    return model;
};