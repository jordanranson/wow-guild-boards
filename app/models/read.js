var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var Schema = mongoose.Schema({

    author  : { type: ObjectId, ref: 'User' },
    thread  : { type: ObjectId, ref: 'Thread' }

});

module.exports = mongoose.model('Read', Schema);