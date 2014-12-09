var express  = require('express');
var passport = require('passport');
var util     = require('util');
var https    = require('https');
var fs       = require('fs');


var cookieParser = require('cookie-parser');
var session      = require('express-session');

var BnetStrategy = require('passport-bnet').Strategy;

var KEYS        = require('./keys');
var BNET_ID     = KEYS.key;
var BNET_SECRET = KEYS.secret;

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// Use the BnetStrategy within Passport.
passport.use(
  new BnetStrategy(
    { clientID: BNET_ID,
      clientSecret: BNET_SECRET,
      scope: 'wow.profile',
      callbackURL: 'https://wowguild.jordanranson.com:3000/auth/bnet/callback' },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        return done(null, profile);
      });
    })
);

var app = express();

// configure Express
app.use(cookieParser());
app.use(session({ secret: 'blizzard',
                  saveUninitialized: true,
                  resave: true }));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/bnet',
        passport.authenticate('bnet'));

app.get('/auth/bnet/callback',
        passport.authenticate('bnet', { failureRedirect: '/' }),
        function(req, res){
          res.redirect('/');
        });

app.get('/', function(req, res) {
  if(req.isAuthenticated()) {
    var output = '<h1>Express OAuth Test</h1>' + req.user.id + '<br>';
    if(req.user.battletag) {
      output += req.user.battletag + '<br>';
    }
    output += '<a href="/logout">Logout</a>';
    res.send(output);
  } else {
    res.send('<h1>Express OAuth Test</h1><a href="/auth/bnet">Login with Bnet</a>');
  }
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

var key  = fs.readFileSync('./wowguild.jordanranson.com.key', 'utf8');
var cert = fs.readFileSync('./wowguild.jordanranson.com.cert', 'utf8');
var credentials = { key: key, cert: cert };
var server      = https.createServer(credentials, app);
var http        = express();

// set up a route to redirect http to https
http.get('*',function(req,res){
    res.redirect('https://wowguild.jordanranson.com:3000'+req.url)
});

http.listen(8080);
server.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});