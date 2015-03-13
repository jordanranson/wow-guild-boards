var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var Schema = mongoose.Schema({

    created : Date,
    author  : { type: ObjectId, ref: 'User' },
    title   : String,
    topic   : String,
    views   : Number,
    replies : Number,
    sticky  : Boolean,
    locked  : Boolean,
    deleted : Boolean

});

module.exports = mongoose.model('Thread', Schema);