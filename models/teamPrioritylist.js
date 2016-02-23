var mongoose = require('mongoose');

module.exports = function(mongoose) {
    var Schema = mongoose.Schema;
    var TeamPriorityList = new Schema({
        teamName: String,
        createdAt: Date,
        list: [{
            designer: String,
            value: Number
        }]
    }, {
        collection: 'TeamPriorityList'
    });

    var model = mongoose.model('TeamPriorityList', TeamPriorityList);

    return model;
};