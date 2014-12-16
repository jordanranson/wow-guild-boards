var CONFIG  = require('../config/config');
var Guild   = require('../models/guild');
var request = require('../request');

module.exports = {
    getAccount: function(req, res) {
        if(req.isAuthenticated()) {
            res.render('account', {
                user: req.user
            });
        } else {
            res.redirect('/unauthorized');
        }
    },
    getAdmin: function(req, res) {
        if(req.isAuthenticated() && req.user.role.admin) {
            Guild.findOne({}, function(err, guild) {
                if(err) throw err;
                if(guild === null) res.redirect('/500');

                res.render('admin', {
                    user: req.user,
                    guild: guild
                });
            });
        } else {
            res.redirect('/unauthorized');
        }
    },
    updateAdmin: function(req, res) {
        if(req.isAuthenticated() && req.user.role.admin) {

            Guild.findOne({}, function(err, guild) {
                if(err) throw err;
                if(guild === null) res.redirect('/500');
                
                request.bnet(
                    'us.battle.net',
                    '/api/wow/guild/'+CONFIG.realm+'/'+encodeURIComponent(CONFIG.guild)+'?fields=members',
                    function(data) {
                        var lastUpdated = new Date().getTime();

                        for(var key in data) {
                            guild[key] = data[key];
                        }

                        guild.lastUpdated = lastUpdated;
                        guild.settings = {
                            webAdminBattletag: req.body.webAdminBattletag
                        };

                        guild.save(function(err) {
                            if(err) throw err;
                            res.redirect('/admin');
                        });
                    }
                );
            });

        } else {
            res.redirect('/unauthorized');
        }
    }
}