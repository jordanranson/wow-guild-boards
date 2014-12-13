var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var Schema = mongoose.Schema({

    created : Date,
    author  : Number,
    title   : String,
    topic   : String,
    views   : Number,
    sticky  : Boolean,
    locked  : Boolean

});

module.exports = mongoose.model('Thread', Schema);