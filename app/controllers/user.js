var User    = require('../models/user');
var request = require('../request');
var __      = require('lodash');

function login(data, profile, err, user, done) {

    if(err) {
        console.log(err);
    }

    // get characters
    var characters = __.sortBy(data.characters, ['level', 'achievementPoints']).reverse();
        characters = __.filter(characters, function(item) { return item.level > 1; });

    // user exists
    if(user !== null) {
        user.characters = characters; // update character list
        user.save(function(err) {
            if(err) throw err;
            return done(null, user);
        });
    }

    // need to create a new user
    else {

        // create new user
        var newUser = new User();

        // user info
        newUser.bnetId = profile.id;
        newUser.battletag = profile.battletag;

        // character data
        newUser.characters = characters;

        if(characters.length > 0) {
            newUser.mainCharacter = {
                name: characters[0].name,
                realm: characters[0].realm
            };
            newUser.showBattletag = false;
        }
        else {
            newUser.mainCharacter = {
                name: null,
                realm: null
            };
            newUser.showBattletag = true;
        }

        // site settings
        newUser.characterRole = 'damage';
        newUser.showItemLevel = false;

        // save the user
        newUser.save(function (err) {
            if (err) throw err;
            return done(null, user);
        });
    }
}

module.exports = {
    login: function(profile, err, user, done) {
        if(err) {
            return done(err);
        }

        request.oauth(
            'us.api.battle.net',
            '/wow/user/characters',
            profile.oauth.accessToken,
            function(data) { login(data, profile, err, user, done); }
        );
    },

    update: function() {

    }
};