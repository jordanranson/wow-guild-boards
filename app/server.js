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
var env             = 'dev';


/*------------------------------------*
 Mongoose setup
 *------------------------------------*/

mongoose.connect('mongodb://localhost:27017/wowguild');


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

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
    extended: true
}));

app.engine('.hbs', exphbs({
    defaultLayout: 'master',
    extname: '.hbs',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        timeSince: function(date) {
            return moment(date).fromNow();
        },
        formatDate: function(date, format) {
            return moment(date).format(format);
        },
        plusOne: function(value) {
            return Number(value) + 1;
        },
        username: function(user) {
            if(user.mainCharacter.name === null) {
                return user.battletag;
            }
            return user.mainCharacter.name;
        },
        decode: function(body) {
            return decodeURIComponent(body);
        },
        className: function(classId) {
            switch(classId) {
                case 1:  return 'Warrior';
                case 2:  return 'Paladin';
                case 3:  return 'Hunter';
                case 4:  return 'Rogue';
                case 5:  return 'Priest';
                case 6:  return 'Death Knight';
                case 7:  return 'Shaman';
                case 8:  return 'Mage';
                case 9:  return 'Warlock';
                case 10: return 'Monk';
                case 11: return 'Druid';
            }
        },
        classSelector: function(classId) {
            switch(classId) {
                case 1:  return 'warrior';
                case 2:  return 'paladin';
                case 3:  return 'hunter';
                case 4:  return 'rogue';
                case 5:  return 'priest';
                case 6:  return 'deathknight';
                case 7:  return 'shaman';
                case 8:  return 'mage';
                case 9:  return 'warlock';
                case 10: return 'monk';
                case 11: return 'druid';
            }
        },
        markdown: function(body) {
            var text = decodeURIComponent(body);
            var tree = markdown.parse(text);
            var html = markdown.renderJsonML(markdown.toHTMLTree(tree));

            html = html.replace(
            /\[(.*)\]\[(.*)\]/g,
            function(match, url, method, offset, string) {
                url = url.replace('http://',  '//');
                url = url.replace('https://', '//');

                switch(method) {
                    case 'image':
                        return '<div class="post-image" style="background-image:url('+url+')"></div>';
                    case 'video':
                        url = url.replace('watch?v=', 'embed/');
                        return '<div class="post-video"><iframe src="'+url+'" seamless frameborder="0" allowfullscreen></iframe></div>';
                }
            });

            return html;
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
    res.redirect('https://wowguild.jordanranson.com:443'+req.url)
});
http.listen(80);

// start real server
server.listen(443, function() {
    console.log('Listening on port %d', server.address().port);
});