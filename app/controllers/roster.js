var Guild = require('../models/guild');
var __    = require('lodash');

module.exports = {
    getRoster: function(req, res) {
        Guild.findOne({}, function(err, guild) {
            if(err) throw err;

            guild.members =
                __.filter(
                    __.sortBy(guild.members,
                        function(member) {
                            return [member.rank, member.character.class, member.character.spec, member.character.name];
                        }),
                    function(member) {
                        return member.character.level >= 100 && member.rank <= 5;
                    });

            res.render('roster', {
                user: req.isAuthenticated() ? req.user : null,
                guild: guild
            });
        });
    }
};