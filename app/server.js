/*------------------------------------*
 Server
 *------------------------------------*/

var express         = require('express');
var exphbs          = require('express-handlebars');
var passport        = require('passport');
var mongoose        = require('mongoose');
var util            = require('util');
var https           = require('https');
var fs              = require('fs');
var cookieParser    = require('cookie-parser');
var session         = require('express-session');
var CONFIG          = require('./config/config');
var bodyParser      = require('body-parser');
var moment          = require('moment');
var markdown        = require('markdown').markdown;
var Guild           = require('./models/guild');
var request         = require('./request');
var KEYS            = require('./config/keys');
var env             = 'dev';
var hbsHelpers      = require('./public/js/common/handlebar-helpers');


/*------------------------------------*
 Mongoose setup
 *------------------------------------*/

mongoose.connect(CONFIG.databaseUrl);


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
    secret: KEYS.sessionSecret,
    saveUninitialized: true,
    resave: true
}));

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
    extended: true
}));

app.engine('.hbs', exphbs({
    defaultLayout: 'master',
    extname: '.hbs',
    helpers: hbsHelpers
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

var key         = fs.readFileSync('./ssl-key.key', 'utf8');
var cert        = fs.readFileSync('./ssl-certificate.cert', 'utf8');
var credentials = { key: key, cert: cert }; // ssl
var server      = https.createServer(credentials, app);
var http        = express();

// set up a route to redirect http to https
http.get('*',function(req,res){
    res.redirect('https://'+CONFIG.guild.toLowerCase()+'.'+CONFIG.hostName+req.url);
});
http.listen(80);

// start real server
server.listen(443, function() {
    console.log('Listening on port %d', server.address().port);

    Guild.findOne({}, function(err, guild) {
        request.bnet(
            'us.battle.net',
            '/api/wow/guild/'+CONFIG.realm+'/'+encodeURIComponent(CONFIG.guild)+'?fields=members',
            function(data) {
                var lastUpdated = new Date().getTime();
                if(guild !== null) {
                    for(var key in data) {
                        guild[key] = data[key];
                    }

                    guild.lastUpdated = lastUpdated;
                    guild.settings = {
                        webAdminBattletag: ''
                    };

                    guild.save(function(err) {
                        if(err) throw err;
                    });
                }
                else {
                    var newGuild = new Guild();
                    for(var key in data) {
                        newGuild[key] = data[key];
                    }

                    newGuild.lastUpdated = lastUpdated;
                    newGuild.settings = {
                        webAdminBattletag: ''
                    };

                    newGuild.save(function(err) {
                        if(err) throw err;
                    });
                }
            }
        );
    });
});