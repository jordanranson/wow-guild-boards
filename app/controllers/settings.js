var CONFIG  = require('../config/config');
var Guild   = require('../models/guild');
var User    = require('../models/user');
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
                    '/api/wow/guild/'+CONFIG.realm+'/'+encodeURIComponent(CONFIG.guild)+'?fields=members,news',
                    function(data) {
                        var lastUpdated = new Date().getTime();

                        for(var key in data) {
                            guild[key] = data[key];
                        }

                        guild.lastUpdated = lastUpdated;
                        guild.news = data.news;
                        guild.settings = {
                            webAdminBattletag: req.body.webAdminBattletag
                        };

                        guild.save(function(err) {
                            if(err) throw err;

                            User.find({}, function (err, users) {
                                if(err) throw err;

                                var user;
                                for(var k = 0; k < users.length; k++) {
                                    var isMember  = false;
                                    var isOfficer = false;
                                    user = users[k];

                                    // figure out if you're an officer
                                    for (var i = 0; i < guild.members.length; i++) {
                                        var member = guild.members[i];
                                        if (
                                            member.character.name  === user.mainCharacter.name &&
                                            member.character.realm === user.mainCharacter.realm) {
                                            isMember = true;
                                            if (member.rank <= 2) {
                                                isOfficer = true;
                                                break;
                                            }
                                        }
                                    }

                                    user.role.admin   = user.battletag === 'Lup#1749'; // this is temporary, don't worry!
                                    user.role.officer = isOfficer;
                                    user.role.member  = isMember;

                                    user.save();
                                }

                                res.redirect('/admin');
                            });
                        });
                    }
                );
            });

        } else {
            res.redirect('/unauthorized');
        }
    }
}