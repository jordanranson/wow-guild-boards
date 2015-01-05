var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var Schema = mongoose.Schema({
    title       : String,
    description : String,
    created     : Date
});

module.exports = mongoose.model('Image', Schema);