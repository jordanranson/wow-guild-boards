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
            res.render('admin', {
                user: req.user
            });
        } else {
            res.redirect('/unauthorized');
        }
    }
}