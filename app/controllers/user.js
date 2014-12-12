var User = require('../models/user');
var Keys = require('../config/keys');
var https = require('https');

module.exports = {
    login: function(profile, err, user, done) {

        if(err) {
            return done(err);
        }

        var request = https.request({
            host: 'us.api.battle.net',
            path: '/wow/user/characters?access_token='+profile.oauth.accessToken,
            port: 443,
            method: 'GET',
            headers: {
                Authorization: 'OAuth ' + profile.oauth.accessToken
            }
        },
        function(res) {
            var data = '';

            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on('end', function () {

                data = JSON.parse(data);

                var characters = [];
                for(var i = 0; i < data.characters.length; i++) {
                    characters.push(data.characters[i]);
                }
                console.log(characters);

                // user exists
                if(user) {
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
                    newUser.mainCharacter = characters[0].name + ',' + characters[0].realm;

                    // site settings
                    newUser.characterRole = '—';
                    newUser.showItemLevel = false;

                    // save the user
                    newUser.save(function (err) {
                        if (err) throw err;
                        return done(null, user);
                    });
                }

            });
        });
        request.end();
    }
};