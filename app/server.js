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
    res.redirect('https://'+CONFIG.prefix+'.'+CONFIG.hostName+req.url);
});
http.listen(80);

// start real server
server.listen(443, function() {
    console.log('Listening on port %d', server.address().port);

    Guild.findOne({}, function(err, guild) {
        request.bnet(
            'us.battle.net',
            '/api/wow/guild/'+CONFIG.realm+'/'+encodeURIComponent(CONFIG.guild)+'?fields=members,news',
            function(data) {
                var lastUpdated = new Date().getTime();
                if(guild !== null) {
                    for(var key in data) {
                        guild[key] = data[key];
                    }

                    guild.lastUpdated = lastUpdated;
                    guild.news = data.news;
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