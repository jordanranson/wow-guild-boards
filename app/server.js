/*------------------------------------*
 Server
 *------------------------------------*/

var express         = require('express');
var exphbs          = require('express-handlebars');
var passport        = require('passport');
var util            = require('util');
var https           = require('https');
var fs              = require('fs');
var cookieParser    = require('cookie-parser');
var session         = require('express-session');
var BnetStrategy    = require('passport-bnet').Strategy;
var KEYS            = require('./keys');
var BNET_ID         = KEYS.key;
var BNET_SECRET     = KEYS.secret;


/*------------------------------------*
 Passport setup
 *------------------------------------*/

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// Use the BnetStrategy within Passport.
passport.use(new BnetStrategy({
        clientID: BNET_ID,
        clientSecret: BNET_SECRET,
        scope: 'wow.profile',
        callbackURL: 'https://wowguild.jordanranson.com:3000/auth/bnet/callback'
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            return done(null, profile);
        });
    })
);


/*------------------------------------*
 Express/HTTP server setup
 *------------------------------------*/

var app = express();

// configure Express
app.use(cookieParser());
app.use(session({
    secret: 'blizzard',
    saveUninitialized: true,
    resave: true
}));


app.engine('handlebars', exphbs({
    defaultLayout: 'master',
    extname: '.hbs',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        percent: function(value, max) {
            return (Math.round(value / max) * 100) + '%';
        }
    }
}));
app.set('view engine', 'handlebars');

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());


/*------------------------------------*
 Routes
 *------------------------------------*/

// static content
app.use('/public', express.static(__dirname + 'public/'));

// authentication
app.get('/auth/bnet',           passport.authenticate('bnet') );
app.get('/auth/bnet/callback',  passport.authenticate('bnet', { failureRedirect: '/' }), function(req, res) {
      res.redirect('/');
});
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// home
app.get('/', function(req, res) {
    if(req.isAuthenticated()) {
        res.render('home', {
            user: req.user
        });
    } else {
        res.render('home', {
            user: null
        });
    }
});

// topics
app.get('/topics', function(req, res) {
    if(req.isAuthenticated()) {
        res.render('topics', {
            user: req.user
        });
    } else {
        res.render('topics', {
            user: null
        });
    }
});



/*------------------------------------*
 Initialization
 *------------------------------------*/

var key  = fs.readFileSync('./wowguild.jordanranson.com.key', 'utf8');
var cert = fs.readFileSync('./wowguild.jordanranson.com.cert', 'utf8');
var credentials = { key: key, cert: cert }; // ssl
var server      = https.createServer(credentials, app);
var http        = express();

// set up a route to redirect http to https (shitty, I need to improve this)
http.get('*',function(req,res){
    res.redirect('https://wowguild.jordanranson.com:3000'+req.url)
});
http.listen(8080);

// start real server
server.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});