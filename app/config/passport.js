var KEYS            = require('./keys');
var BNET_ID         = KEYS.key;
var BNET_SECRET     = KEYS.secret;
var BnetStrategy    = require('passport-bnet').Strategy;

module.exports = function(passport) {
    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });

    // Use the BnetStrategy within Passport.
    passport.use(new BnetStrategy({
                clientID: BNET_ID,
                clientSecret: BNET_SECRET,
                scope: 'wow.profile',
                callbackURL: 'https://wowguild.jordanranson.com:3000/auth/bnet/callback'
            },
            function (accessToken, refreshToken, profile, done) {
                profile.accessToken = accessToken;
                process.nextTick(function () {
                    return done(null, profile);
                });
            })
    );
};