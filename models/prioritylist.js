var mongoose = require('mongoose');

module.exports = function(mongoose) {
    var Schema = mongoose.Schema;
    var PriorityList = new Schema({
        designerName: String,
        createdAt: Date,
        list: [{
            team: String,
            value: Number
        }]
    }, {
        collection: 'PriorityList'
    });

    var model = mongoose.model('PriorityList', PriorityList);

    return model;
};