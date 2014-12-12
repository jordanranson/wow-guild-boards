var express = require('express');
var User    = require('../models/user');
var userController = require('../controllers/user');

module.exports = function(app, passport) {

    // static content
    app.use('/public', express.static(__dirname + '/../public/'));

    // authentication
    app.get('/auth/bnet',           passport.authenticate('bnet') );
    app.get('/auth/bnet/callback',  passport.authenticate('bnet', { failureRedirect: '/' }), function(req, res) {
        res.redirect('/');
    });

    // logout
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // home
    app.get('/', function(req, res) {
        if(req.isAuthenticated()) {
            res.render('home', {
                user: req.user
            });
        } else {
            res.render('home', {
                user: null
            });
        }
    });

    // topics
    app.get('/topics', function(req, res) {
        if(req.isAuthenticated()) {
            res.render('topics', {
                user: req.user
            });
        } else {
            res.render('topics', {
                user: null
            });
        }
    });

    // threads
    app.get('/threads', function(req, res) {
        if(req.isAuthenticated()) {
            res.render('threads', {
                user: req.user
            });
        } else {
            res.render('threads', {
                user: null
            });
        }
    });

    // thread
    app.get('/thread', function(req, res) {
        if(req.isAuthenticated()) {
            res.render('thread', {
                user: req.user
            });
        } else {
            res.render('thread', {
                user: null
            });
        }
    });

    // roster
    app.get('/roster', function(req, res) {
        if(req.isAuthenticated()) {
            res.render('roster', {
                user: req.user
            });
        } else {
            res.render('roster', {
                user: null
            });
        }
    });

    // gallery
    app.get('/gallery', function(req, res) {
        if(req.isAuthenticated()) {
            res.render('gallery', {
                user: req.user
            });
        } else {
            res.render('gallery', {
                user: null
            });
        }
    });

    // admin
    app.get('/admin', function(req, res) {
        if(req.isAuthenticated()) {
            res.render('admin', {
                user: req.user
            });
        } else {
            res.redirect('/unauthorized');
        }
    });

    // account
    app.get('/account', function(req, res) {
        if(req.isAuthenticated()) {

            console.log(req.user.characters);

            res.render('account', {
                user: req.user
            });
        } else {
            res.redirect('/unauthorized');
        }
    });

    // 403
    app.get('/unauthorized', function(req, res) {
        if(req.isAuthenticated()) {
            res.redirect('/');
        } else {
            res.status(403);
            res.render('unauthorized', { title: 'You do not have permission to access this page.' });
        }
    });

    // 404 error handler
    app.use(function(req, res, next) {
        res.status(404);
        res.render('404', { title: 'Page not found.' });
    });

    // 500 error handler
    app.use(function(error, req, res, next) {
        res.status(500);
        res.render('500', { title: 'Internal server error.', error: error });
    });
};