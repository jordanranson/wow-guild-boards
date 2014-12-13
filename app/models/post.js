var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var Schema = mongoose.Schema({

    created : Date,
    author  : Number,
    thread  : ObjectId,
    content : String

});

module.exports = mongoose.model('Post', Schema);