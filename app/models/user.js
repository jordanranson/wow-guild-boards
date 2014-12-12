var mongoose = require('mongoose');

var Schema = mongoose.Schema({

    // user info
    bnetId:    Number,
    battletag: String,

    // characters
    characters:    [{
        name: String,
        realm: String,
        battlegroup: String,
        class: Number,
        race: Number,
        gender: Number,
        level: Number,
        achievementPoints: Number,
        thumbnail: String
    }],
    mainCharacter: String,

    // site settings
    characterRole: String,
    showItemLevel: Boolean

});

module.exports = mongoose.model('User', Schema);