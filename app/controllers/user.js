var User    = require('../models/user');
var Guild   = require('../models/guild');
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

        Guild.findOne({}, function(err, guild) {
            if(err) throw err;
            
            var isOfficer = false;
            var isMember  = false;
            var isAdmin   = false;

            // figure out if you're an officer or member
            for(var i = 0; i < guild.members.length; i++) {
                for(var k = 0; k < characters.length; k++) {
                    var member    = guild.members[i];
                    var character = characters[k];

                    if(
                    member.character.name  === character.name &&
                    member.character.realm === character.realm ) {
                        isMember = true;
                        if(member.rank <= 2) {
                            isOfficer = true;
                            break;
                        }
                    }
                }
            }

            // or if you're an admin
            if(profile.battletag === 'Lup#1749') {
                isAdmin = true;
            }

            // find thumbnail and class
            for (var h = 0; h < newUser.characters.length; h++) {
                var c = newUser.characters[h];

                if( c.name  === newUser.mainCharacter.name &&
                    c.realm === newUser.mainCharacter.realm) {
                    newUser.mainCharacter.classNum = c.class;
                    newUser.mainCharacter.thumb    = c.thumbnail;
                    break;
                }
            }


            newUser.role = {
               officer : isOfficer,
               member  : isMember,
               admin   : isAdmin
            };

            // save the user
            newUser.save(function (err) {
               if (err) throw err;
               return done(null, newUser);
            });
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

    updateUser: function(req, res) {
        var body = req.body;

        var mainCharacter = body.mainCharacter.split(':');
        var name      = mainCharacter[0];
        var realm     = mainCharacter[1];
        var isOfficer = false;
        var isMember  = false;

        Guild.findOne({}, function(err, guild) {
            if(err) throw err;

            // figure out if you're an officer
            for (var i = 0; i < guild.members.length; i++) {
                var member = guild.members[i];

                if(
                member.character.name  === name &&
                member.character.realm === realm) {
                    isMember = true;
                    classNum = member.character.class;
                    thumb    = member.character.thumbnail;
                    if (member.rank <= 2) {
                        isOfficer = true;
                        break;
                    }
                    break;
                }
            }

            User.findOne({ 'bnetId': req.user.bnetId }, function (err, user) {
                if(err) throw err;

                // find thumbnail and class
                var classNum  = 0;
                var thumb     = '';
                for (var i = 0; i < user.characters.length; i++) {
                    var character = user.characters[i];

                    if( character.name  === name &&
                        character.realm === realm) {
                        classNum = character.class;
                        thumb    = character.thumbnail;
                        break;
                    }
                }

                user.mainCharacter.name     = name;
                user.mainCharacter.realm    = realm;
                user.mainCharacter.classNum = classNum;
                user.mainCharacter.thumb    = thumb;
                user.role.admin             = req.user.battletag === 'Lup#1749';
                user.role.officer           = isOfficer;
                user.role.member            = isMember;

                user.save(function (err) {
                    if (err) throw err;
                    res.redirect('/account');
                });
            });
        });
    }
};