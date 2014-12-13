var Thread   = require('../models/thread');
var Post     = require('../models/post');
var request  = require('../request');
var __       = require('lodash');
var color    = require('colors');

function getTopic(topic, guildName) {
    var title       = '';
    var description = '';

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
        default:
            return false;
    }

    return { title: title, description: description };
}

module.exports = {

    createThread: function(req, res) {
        if(req.isAuthenticated()) {
            var user  = req.user;
            var topic = req.params.topic;
            var body  = req.body;

            var thread = new Thread();

            thread.created = new Date().getTime();
            thread.author  = user._id;
            thread.title   = body.title;
            thread.topic   = topic;
            thread.views   = 1;
            thread.sticky  = false;
            thread.locked  = false;

            thread.save(function (err) {
                if (err) throw err;

                var post = new Post();

                post.created = new Date().getTime();
                post.author  = user._id;
                post.thread  = thread._id;
                post.content = encodeURIComponent(body.content);

                post.save(function (err) {
                    if (err) throw err;
                    res.redirect('/thread/' + thread._id);
                });
            });
        }
        else {
            res.redirect('/unauthorized');
        }
    },

    getThread: function(req, res) {
        Thread
        .findOne({ '_id' : req.params.id })
        .populate('author')
        .exec(function(err, thread) {
            if(err) throw err;

            Post
            .find({ 'thread': req.params.id })
            .populate('author')
            .exec(function (err, posts) {
                if(err) throw err;

                var guildName = 'AXION';
                var topicData = getTopic(thread.topic, guildName);

                res.render('thread', {
                    user: req.user,
                    topicTitle: topicData.title,
                    thread: thread,
                    posts: posts
                });
            });
        });
    },

    getThreads: function(req, res) {
        var topic     = req.params.topic;
        var guildName = 'AXION';

        if(topic === undefined) {
            res.redirect('/topics');
            return;
        }

        var topicData = getTopic(topic, guildName);

        if(topicData === false) {
            res.redirect('/404');
            return;
        }

        Thread
        .find({ 'topic' : topic })
        .populate('author')
        .exec(function(err, threads) {
            if(err) throw err;

            if(topic === 'announcements') {
                if(req.isAuthenticated()) {
                    res.render('threads', {
                        user: req.user,
                        topic: topic,
                        topicTitle: topicData.title,
                        topicDescription: topicData.description,
                        threads: threads
                    });
                } else {
                    res.render('threads', {
                        user: null,
                        topic: topic,
                        topicTitle: topicData.title,
                        topicDescription: topicData.description,
                        threads: threads
                    });
                }
            }

            if(topic === 'general') {
                if(req.isAuthenticated()) {
                    res.render('threads', {
                        user: req.user,
                        topic: topic,
                        topicTitle: topicData.title,
                        topicDescription: topicData.description,
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
                        topicTitle: topicData.title,
                        topicDescription: topicData.description,
                        threads: threads
                    });
                } else {
                    res.redirect('/unauthorized');
                }
            }
        });
    },

    updateThread: function() {},

    deleteThread: function() {},

    createPost: function(req, res) {
        var user   = req.user;
        var body   = req.body;
        var post   = new Post();
        var thread = req.params.id;

        post.created = new Date().getTime();
        post.author  = user._id;
        post.thread  = thread;
        post.content = encodeURIComponent(body.content);

        post.save(function (err) {
            if (err) throw err;
            res.redirect('/thread/' + thread + '/#' + post._id);
        });
    },

    getPost: function(req, res) {
        Post
        .findOne({ '_id': req.params.id })
        .populate('author')
        .exec(function (err, post) {
            if(err) throw err;

            Thread
            .findOne({ '_id' : post.thread })
            .populate('author')
            .exec(function(err, thread) {
                if (err) throw err;

                var guildName = 'AXION';
                var topicData = getTopic(thread.topic, guildName);

                res.render('post', {
                    user: req.user,
                    topicTitle: topicData.title,
                    thread: thread,
                    post: post
                });
            });
        });
    },

    updatePost: function() {},

    deletePost: function() {},

    getTopics: function(req, res) {
        if(req.isAuthenticated()) {
            res.render('topics', {
                user: req.user
            });
        } else {
            res.render('topics', {
                user: null
            });
        }
    }

};