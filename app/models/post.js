var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var Schema = mongoose.Schema({

    created : Date,
    author  : { type: ObjectId, ref: 'User' },
    thread  : { type: ObjectId, ref: 'Thread' },
    content : String,
    edited  : {
        user : { type: ObjectId, ref: 'User' },
        date : Date
    },
    deleted : Boolean

});

module.exports = mongoose.model('Post', Schema);