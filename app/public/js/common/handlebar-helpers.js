/**
 * Created by jordanranson on 15-01-02.
 */
(function() {
    var helpers = {
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
            if(user.showBattletag) {
                return user.battletag;
            }
            else {
                if (user.mainCharacter.name === null) {
                    return user.battletag;
                }
                return user.mainCharacter.name;
            }
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
        },
        rankName: function(rankId) {
            switch(rankId) {
                case 0: return 'Guild Master';
                case 1: return 'Assistant GM';
                case 2: return 'Officer';
                case 3: return 'Raider';
                case 4: return 'PvP';
                case 5: return 'Social/Friend';
                case 6: return 'Alternate';
            }
        },
        canCreateThread: function(topic, user, options) {
            var a = options.fn(this);
            var b = options.inverse(this);
            var role = user.role;

            switch(topic) {
                case 'announcements' : return role.officer ? a : b;
                case 'officer'       : return role.officer ? a : b;
                case 'general'       : return role.member  ? a : b;
                case 'pve'           :
                case 'pvp'           : return role.member  ? a : b;
            }

            return b;
        },
        canReply: function(topic, user, options) {
            var a = options.fn(this);
            var b = options.inverse(this);
            var role = user.role;

            switch(topic) {
                case 'announcements' : return role.member  ? a : b;
                case 'officer'       : return role.officer ? a : b;
                case 'general'       : return a;
                case 'pve'           :
                case 'pvp'           : return role.member  ? a : b;
            }

            return b;
        },
        canModerate: function(user, author, options) {
            var a = options.fn(this);
            var b = options.inverse(this);
            var role = user.role;

            if(author._id === user._id) return a;
            if(role.admin) return a;

            return b;
        }
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports = helpers;
    else
        window.HandlebarHelpers = helpers;
})();