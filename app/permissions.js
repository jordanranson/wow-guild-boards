module.exports = {
    forums: {
        canViewTopic: function(topic, req) {
            var user = req.user;
            var auth = req.isAuthenticated();

            switch(topic) {
                case 'announcements':
                    return true;
                case 'officer':
                    return (auth && user.role.officer);
                case 'general':
                    return auth;
                case 'pve':
                case 'pvp':
                    return (auth && user.role.member);
            }

            return false;
        },
        canCreateThread: function(topic, req) {
            var user = req.user;
            var auth = req.isAuthenticated();

            switch(topic) {
                case 'announcements':
                    return (auth && user.role.officer);
                case 'officer':
                    return (auth && user.role.officer);
                case 'general':
                    return (auth && user.role.member);
                case 'pve':
                case 'pvp':
                    return (auth && user.role.member);
            }

            return false;
        },
        canCreatePost: function(topic, req) {
            var user = req.user;
            var auth = req.isAuthenticated();

            switch(topic) {
                case 'announcements':
                    return (auth && user.role.member);
                case 'officer':
                    return (auth && user.role.officer);
                case 'general':
                    return auth;
                case 'pve':
                case 'pvp':
                    return (auth && user.role.member);
            }

            return false;
        }
    },
    settings: {
        canUpdateAdmin: function(req) {
            var user = req.user;
            return user.role.admin;
        }
    }
};