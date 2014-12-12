var Keys            = require('./keys');
var BNET_ID         = Keys.key;
var BNET_SECRET     = Keys.secret;
var BnetStrategy    = require('passport-bnet').Strategy;
var User            = require('../models/user');
var userController  = require('../controllers/user');

module.exports = function(passport) {
    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        done(null, user);
    });

    // Use the BnetStrategy within Passport.
    passport.use(new BnetStrategy({
            clientID: BNET_ID,
            clientSecret: BNET_SECRET,
            scope: 'wow.profile',
            callbackURL: 'https://wowguild.jordanranson.com:443/auth/bnet/callback'
        },
        function (accessToken, refreshToken, profile, done) {

            // append auth
            profile.oauth = {
                accessToken: accessToken
            };

            process.nextTick(function() {
                User.findOne({ 'bnetId': profile.id }, function(err, user) {
                    return userController.login(profile, err, user, done);
                });
            });
        })
    );
};