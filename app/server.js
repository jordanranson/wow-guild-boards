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
var bodyParser      = require('body-parser');
var moment          = require('moment');
var markdown        = require('markdown').markdown;
var request         = require('./request');
var KEYS            = require('./config/keys');
var env             = 'dev';
var hbsHelpers      = require('./public/js/common/handlebar-helpers');
var Firebase        = require('firebase');
var FirebaseTokenGenerator = require("firebase-token-generator");
var tokenGenerator  = new FirebaseTokenGenerator("Aufy0ghYdjB0da9dGnOqzygsFKdmirgE60ylbCe9");
var BNET_ID         = KEYS.key;
var BNET_SECRET     = KEYS.secret;
var BnetStrategy    = require('passport-bnet').Strategy;


/*------------------------------------*
 Firebase setup
 *------------------------------------*/

var firebase = new Firebase("https://wow-guild-boards.firebaseio.com/");


/*------------------------------------*
 Passport setup
 *------------------------------------*/

//require('./config/passport')(passport);
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    firebase.child('users/'+id).once('value', function(snapshot) {
        done(null, snapshot.val());
    });
});

// Use the BnetStrategy within Passport.
passport.use(new BnetStrategy({
        clientID: BNET_ID,
        clientSecret: BNET_SECRET,
        scope: 'wow.profile',
        callbackURL: 'https://'+CONFIG.prefix+'.'+CONFIG.hostName+'/auth/bnet/callback'
    },
    function (accessToken, refreshToken, profile, done) {

        // append auth
        var token = tokenGenerator.createToken({
            uid: profile.id.toString()
        });

        profile.token = token;
        profile.bnetToken = accessToken;

        process.nextTick(function() {
            var ref = firebase.child('users/'+profile.id);
            ref.authWithCustomToken(token, function(error, result) {
               if(error) {
                   console.log(error);
                   ref.unauth();
               }
               else {
                   ref.once('value', function(snapshot) {
                       done(null, snapshot.val());
                   });
                   ref.set(profile);
                   ref.unauth();
               }
            });
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
    secret: KEYS.sessionSecret,
    saveUninitialized: true,
    resave: true
}));

app.use(bodyParser.json({limit: '50mb'}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
    limit: '50mb',
    extended: true
}));

app.engine('.hbs', exphbs({
    defaultLayout: 'master',
    extname: '.hbs',
    helpers: {
        section: function (name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        timeSince: function (date) {
            return moment(date).fromNow();
        },
        formatDate: function (date, format) {
            return moment(date).format(format);
        },
        plusOne: function (value) {
            return Number(value) + 1;
        },
        username: function (user) {
            if (user.showBattletag) {
                return user.battletag;
            }
            else {
                if (user.mainCharacter.name === null) {
                    return user.battletag;
                }
                return user.mainCharacter.name;
            }
        },
        decode: function (body) {
            return decodeURIComponent(body);
        },
        className: function (classId) {
            switch (classId) {
                case 1:
                    return 'Warrior';
                case 2:
                    return 'Paladin';
                case 3:
                    return 'Hunter';
                case 4:
                    return 'Rogue';
                case 5:
                    return 'Priest';
                case 6:
                    return 'Death Knight';
                case 7:
                    return 'Shaman';
                case 8:
                    return 'Mage';
                case 9:
                    return 'Warlock';
                case 10:
                    return 'Monk';
                case 11:
                    return 'Druid';
            }
        },
        classSelector: function (classId) {
            switch (classId) {
                case 1:
                    return 'warrior';
                case 2:
                    return 'paladin';
                case 3:
                    return 'hunter';
                case 4:
                    return 'rogue';
                case 5:
                    return 'priest';
                case 6:
                    return 'deathknight';
                case 7:
                    return 'shaman';
                case 8:
                    return 'mage';
                case 9:
                    return 'warlock';
                case 10:
                    return 'monk';
                case 11:
                    return 'druid';
            }
        },
        markdown: function (body) {
            var text = decodeURIComponent(body);
            var tree = markdown.parse(text);
            var html = markdown.renderJsonML(markdown.toHTMLTree(tree));

            html = html.replace(
                /\[(.*)\]\[(.*)\]/g,
                function (match, url, method, offset, string) {
                    url = url.replace('http://', '//');
                    url = url.replace('https://', '//');

                    switch (method) {
                        case 'image':
                            return '<div class="post-image" style="background-image:url(' + url + ')"></div>';
                        case 'video':
                            url = url.replace('watch?v=', 'embed/');
                            return '<div class="post-video"><iframe src="' + url + '" seamless frameborder="0" allowfullscreen></iframe></div>';
                    }
                });

            return html;
        },
        rankName: function (rankId) {
            switch (rankId) {
                case 0:
                    return 'Guild Master';
                case 1:
                    return 'Assistant GM';
                case 2:
                    return 'Officer';
                case 3:
                    return 'Raider';
                case 4:
                    return 'PvP';
                case 5:
                    return 'Social/Friend';
                case 6:
                    return 'Alternate';
            }
        },
        canCreateThread: function (topic, user, options) {
            var a = options.fn(this);
            var b = options.inverse(this);
            var role = user.role;

            switch (topic) {
                case 'announcements' :
                    return role.officer ? a : b;
                case 'officer'       :
                    return role.officer ? a : b;
                case 'general'       :
                    return role.member ? a : b;
                case 'pve'           :
                case 'pvp'           :
                    return role.member ? a : b;
            }

            return b;
        },
        canReply: function (thread, user, options) {
            var a = options.fn(this);
            var b = options.inverse(this);
            var role = user.role;

            if(thread.locked) return b;

            switch (thread.topic) {
                case 'announcements' :
                    return role.member ? a : b;
                case 'officer'       :
                    return role.officer ? a : b;
                case 'general'       :
                    return a;
                case 'pve'           :
                case 'pvp'           :
                    return role.member ? a : b;
            }

            return b;
        },
        canModerate: function (user, author, options) {
            var a = options.fn(this);
            var b = options.inverse(this);
            if(!user) return b;

            var role = user.role;

            if (author._id.toString() == user._id.toString() || role.admin) return a;
            if (role.admin) return a;

            return b;
        },
        canModerateGlobal: function (user, options) {
            var a = options.fn(this);
            var b = options.inverse(this);
            if(!user) return b;

            var role = user.role;

            if (role.admin || role.officer) return a;

            return b;
        },
        stickyOrLocked: function (thread, options) {
            var a = options.fn(this);
            var b = options.inverse(this);

            return thread.sticky || thread.locked ? a : b;
        },
        foreach: function(arr,options) {
            if(options.inverse && !arr.length)
                return options.inverse(this);

            return arr.map(function(item,index) {
                item.$index = index;
                item.$first = index === 0;
                item.$last  = index === arr.length-1;
                return options.fn(item);
            }).join('');
        },
        equals: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if( lvalue!=rvalue ) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
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

// static content
app.use('/public', express.static(__dirname + '/public/'));

// authentication
app.get(
    '/auth/bnet',
    passport.authenticate('bnet')
);
app.get(
    '/auth/bnet/callback',
    passport.authenticate('bnet', { failureRedirect: '/500' }),
    function(req, res) { res.redirect('/'); }
);

// logout
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// app
app.get('/', function(req, res) {
    firebase.child('guild').on('value', function(snapshot) {
        var guild = snapshot.val();
        res.render('index', {
            guild: guild,
            user: req.user
        });
    });
});


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
    res.redirect('https://'+CONFIG.prefix+'.'+CONFIG.hostName+req.url);
});
http.listen(80);

// start real server
server.listen(443, function() {
    console.log('Listening on port %d', server.address().port);

    request.bnet(
        'us.battle.net',
        '/api/wow/guild/'+CONFIG.realm+'/'+encodeURIComponent(CONFIG.guild)+'?fields=members,news',
        function(data) {
            var lastUpdated = new Date().getTime();
            var guild = firebase.child('guild');
            var guildData = {};

            for(var key in data) {
                guildData[key] = data[key];
            }

            guildData.lastUpdated = lastUpdated;
            guildData.news = data.news;
            guildData.settings = {
                webAdminBattletag: ''
            };

            guild.set(guildData);
        }
    );
});