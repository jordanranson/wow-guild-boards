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
var CONFIG          = require('./config/config');
var env             = 'dev';


/*------------------------------------*
 Passport setup
 *------------------------------------*/

require('./config/passport')(passport);


/*------------------------------------*
 Express/HTTP server setup
 *------------------------------------*/

var app = express();

// configure Express
app.use(cookieParser());
app.use(session({
    secret: CONFIG[env].sessionSecret,
    saveUninitialized: true,
    resave: true
}));


app.engine('.hbs', exphbs({
    defaultLayout: 'master',
    extname: '.hbs',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
}));
app.set('view engine', '.hbs');

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());


/*------------------------------------*
 Routes
 *------------------------------------*/

require('./config/routes')(app, passport);


/*------------------------------------*
 Initialization
 *------------------------------------*/

var key         = fs.readFileSync('./wowguild.jordanranson.com.key',  'utf8');
var cert        = fs.readFileSync('./wowguild.jordanranson.com.cert', 'utf8');
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