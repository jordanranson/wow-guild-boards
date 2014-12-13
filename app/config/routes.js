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
    app.get('/threads/:topic', function(req, res) {
        var topic = req.params.topic;

        var description = '';
        var guildName = 'AXION';

        if(topic === undefined) {
            res.redirect('/topics');
            return;
        }

        switch(topic) {
            case 'announcements':
                title       = 'Announcements';
                description = 'The latest happenings of ' + guildName + '.';
                break;
            case 'general':
                title       = 'General Discussion';
                description = 'For all your off topic discussion.';
                break;
            case 'pve':
                title       = 'PvP, Dungeons, &amp; Raids';
                description = 'Discuss strategies and plan groups.';
                break;
            case 'pvp':
                title       = 'Player Versus Player';
                description = 'Form teams, talk strategies, get rekt.';
                break;
            case 'officer':
                title       = 'Officer';
                description = 'Officer only threads. Hidden to non-officers.';
                break;
        }

        var threads = [{
            created : new Date().getTime() - 36000,
            author  : 12345,
            title   : 'Thread Title',
            topic   : 'announcements',
            views   : 999,
            sticky  : false,
            locked  : false,
            replies : 999
        }];
        threads = [];

        if(topic === 'announcements') {
            if(req.isAuthenticated()) {
                res.render('threads', {
                    user: req.user,
                    topic: topic,
                    topicTitle: title,
                    topicDescription: description,
                    threads: threads
                });
            } else {
                res.render('threads', {
                    user: null,
                    topic: topic,
                    topicTitle: title,
                    topicDescription: description,
                    threads: threads
                });
            }
        }

        if(topic === 'general') {
            if(req.isAuthenticated()) {
                res.render('threads', {
                    user: req.user,
                    topic: topic,
                    topicTitle: title,
                    topicDescription: description,
                    threads: threads
                });
            } else {
                res.redirect('/unauthorized');
            }
        }

        if(topic === 'pve' || topic === 'pvp') {
            if(req.isAuthenticated()) {
                res.render('threads', {
                    user: req.user,
                    topic: topic,
                    topicTitle: title,
                    topicDescription: description,
                    threads: threads
                });
            } else {
                res.redirect('/unauthorized');
            }
        }
    });

    // create thread
    app.post('/thread/create/:topic', function(req, res) {
        var topic = req.params.topic;
        var data  = req.query;

        if(req.isAuthenticated()) {
            res.render('thread', {
                user: req.user
            });
        } else {
            res.status('403');
            res.redirect('/unauthorized');
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