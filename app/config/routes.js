var express = require('express');
var Thread  = require('../models/thread');
var Post    = require('../models/post');
var forumsController = require('../controllers/forums');

module.exports = function(app, passport) {

    // static content
    app.use('/public', express.static(__dirname + '/../public/'));

    // authentication
    app.get('/auth/bnet',           passport.authenticate('bnet') );

    // This always fails to authenticate for new users, I'm not sure why.
    // The user is successfully created, however, and signing in thereafter
    // works as expected. ¯\_(ツ)_/¯
    app.get('/auth/bnet/callback',  passport.authenticate('bnet', {
        failureRedirect: '/500' }),
        function(req, res) {
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


    /*
     * Forums
     */

    // view threads & topics
    app.get('/topics',         forumsController.getTopics);
    app.get('/threads/:topic', forumsController.getThreads);
    app.get('/thread/:id',     forumsController.getThread);
    app.get('/post/:id',       forumsController.getPost);

    // thread api
    app.post('/thread/create/:topic', forumsController.createThread);
    app.post('/thread/update/:id',    forumsController.updateThread);
    app.post('/thread/delete/:id',    forumsController.deleteThread);
    app.post('/thread/reply/:id',     forumsController.createPost);

    // post api
    app.post('/post/update/:topic',  forumsController.updatePost);
    app.post('/post/delete/:topic',  forumsController.deletePost);


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
            res.render('account', {
                user: req.user
            });
        } else {
            res.redirect('/unauthorized');
        }
    });


    /*
     * Error pages
     */

    // 403 unauthorized
    app.get('/unauthorized', function(req, res) {
        res.status(403);
        res.render('unauthorized', { message: 'You do not have permission to access this page.' });
    });

    // 404 page not found
    app.use(function(req, res, next) {
        res.status(404);
        res.render('404', { message: 'Page not found.' });
    });

    // 500 server error
    app.use(function(error, req, res, next) {
        res.status(500);
        res.render('500', { message: 'Internal server error.', error: error });
    });
};