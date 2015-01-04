var express = require('express');
var CONFIG  = require('../config/config');
var request = require('../request');
var Thread  = require('../models/thread');
var Post    = require('../models/post');
var User    = require('../models/user');
var Guild   = require('../models/guild');
var __      = require('lodash');

var forumsController   = require('../controllers/forums');
var rosterController   = require('../controllers/roster');
var galleryController  = require('../controllers/gallery');
var settingsController = require('../controllers/settings');
var userController     = require('../controllers/user');

module.exports = function(app, passport) {

    // static content
    app.use('/public', express.static(__dirname + '/../public/'));

    // authentication
    app.get('/auth/bnet',           passport.authenticate('bnet') );

    app.get('/auth/bnet/callback',  passport.authenticate('bnet', {
        failureRedirect: '/500' }),
        function(req, res) {
            res.redirect('/account');
    });

    // logout
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // home/index
    app.get('/', function(req, res) {
        res.render('home', {
            user: req.isAuthenticated() ? req.user : null
        });

        Guild.findOne({}, function(err, guild) {
            if(err) throw err;

            if(guild !== null && guild.lastUpdated.getTime() < new Date().getTime() - (1*60*60*1000)) {
                console.log('updating guild');

                request.bnet(
                    'us.battle.net',
                    '/api/wow/guild/'+CONFIG.realm+'/'+encodeURIComponent(CONFIG.guild)+'?fields=members',
                    function(data) {
                        var lastUpdated = new Date().getTime();

                        for(var key in data) {
                            guild[key] = data[key];
                        }

                        guild.lastUpdated = lastUpdated;

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
                            });
                        });
                    }
                );
            }
        });
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
    app.post('/thread/reply/:id',     forumsController.createPost);
    app.post('/thread/update',    forumsController.updateThread);
    app.post('/thread/delete',    forumsController.deleteThread);

    // post api
    app.post('/post/update',  forumsController.updatePost);
    app.post('/post/delete',  forumsController.deletePost);


    /*
     * Site
     */

    // roster
    app.get('/roster', rosterController.getRoster);

    // gallery
    app.get('/gallery', galleryController.getGallery);


    /*
     * Settings
     */

    // admin
    app.get( '/admin', settingsController.getAdmin);
    app.post('/admin/update', settingsController.updateAdmin);

    // account
    app.get( '/account',        settingsController.getAccount);
    app.post('/account/update', userController.updateUser);


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
        console.log(error.stack);

        res.status(500);
        res.render('500', { message: 'Internal server error.', error: error });
    });
};