var mongoose = require('mongoose');

var Schema = mongoose.Schema({

    serverName: String,
    guildName:  String,
    adminBattletag: String

});

module.exports = mongoose.model('Settings', Schema);