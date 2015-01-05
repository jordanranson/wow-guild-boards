var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var Schema = mongoose.Schema({
    title       : String,
    description : String
});

module.exports = mongoose.model('Image', Schema);