var mongoose = require('mongoose');

module.exports = function(mongoose) {
    var Schema = mongoose.Schema;
    var DesignerPriorityList = new Schema({
        designerName: String,
        createdAt: Date,
        list: [{
            team: String,
            value: Number
        }]
    }, {
        collection: 'DesignerPriorityList'
    });

    var model = mongoose.model('DesignerPriorityList', DesignerPriorityList);

    return model;
};