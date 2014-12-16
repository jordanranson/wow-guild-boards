var express = require('express');
var Thread  = require('../models/thread');
var Post    = require('../models/post');
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
            res.redirect('/');
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
    app.get('/admin', settingsController.getAdmin);

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