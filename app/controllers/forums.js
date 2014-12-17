var Thread     = require('../models/thread');
var Post       = require('../models/post');
var Guild      = require('../models/guild');
var request    = require('../request');
var __         = require('lodash');
var color      = require('colors');
var permission = require('../permissions');

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
            title       = 'PvP, Dungeons, & Raids';
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
        var user  = req.user;
        var topic = req.params.topic;
        var body  = req.body;

        // permissions
        if (!permission.forums.canCreateThread(topic, req)) {
            res.redirect('/unauthorized');
            return;
        }

        var thread = new Thread();

        thread.created = new Date().getTime();
        thread.author  = user._id;
        thread.title   = body.title;
        thread.topic   = topic;
        thread.views   = 1;
        thread.replies = 0;
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
    },

    getThread: function(req, res) {
        Thread
        .findOne({ '_id' : req.params.id })
        .populate('author')
        .exec(function(err, thread) {
            if (err) throw err;
            if (thread === null) res.redirect('/500');

            // permissions
            if (!permission.forums.canViewTopic(thread.topic, req)) {
                res.redirect('/unauthorized');
                return;
            }

            Post
            .find({ 'thread': req.params.id })
            .populate('author')
            .populate('edited.user')
            .exec(function (err, posts) {
                if(err) throw err;

                var guildName = 'AXION';
                var topicData = getTopic(thread.topic, guildName);

                posts = __.sortBy(posts, 'created');

                res.render('thread', {
                    user: req.user,
                    topic: thread.topic,
                    topicTitle: topicData.title,
                    thread: thread,
                    posts: posts
                });

                thread.views++;
                thread.save();
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

        // permissions
        if (!permission.forums.canViewTopic(topic, req)) {
            res.redirect('/unauthorized');
            return;
        }

        Thread
        .find({ 'topic' : topic })
        .populate('author')
        .exec(function(err, threads) {
            if(err) throw err;

            res.render('threads', {
                user: req.isAuthenticated() ? req.user : null,
                topic: topic,
                topicTitle: topicData.title,
                topicDescription: topicData.description,
                threads: threads
            });
        });
    },

    updateThread: function() {

    },

    deleteThread: function() {

    },

    createPost: function(req, res) {
        var user     = req.user;
        var body     = req.body;
        var post     = new Post();
        var threadId = req.params.id;

        Thread.findOne({ '_id' : threadId }, function(err, thread) {
            if (err) throw err;
            if (thread === null) res.redirect('/500');

            // permissions
            if (!permission.forums.canCreatePost(thread.topic, req)) {
                res.redirect('/unauthorized');
                return;
            }

            thread.replies++;

            thread.save(function(err) {
                if (err) throw err;

                post.created = new Date().getTime();
                post.author  = user._id;
                post.thread  = threadId;
                post.content = encodeURIComponent(body.content);

                post.save(function (err) {
                    if (err) throw err;
                    res.redirect('/thread/' + threadId + '/#' + post._id);
                });
            });
        });
    },

    getPost: function(req, res) {
        var user = req.user;

        Post
        .findOne({ '_id': req.params.id })
        .populate('author')
        .exec(function (err, post) {
            if(err) throw err;
            if(post === null) res.redirect('/500');

            Thread
            .findOne({ '_id' : post.thread })
            .populate('author')
            .exec(function(err, thread) {
                if (err) throw err;
                if(thread === null) res.redirect('/500');

                var guildName = 'AXION';
                var topicData = getTopic(thread.topic, guildName);

                // permissions
                if (!permission.forums.canViewTopic(thread.topic, req)) {
                    res.redirect('/unauthorized');
                    return;
                }

                res.render('post', {
                    user: req.user,
                    topicTitle: topicData.title,
                    thread: thread,
                    post: post
                });
            });
        });
    },

    updatePost: function(req, res) {
        Post
        .findOne({ '_id': req.body.id })
        .populate('author')
        .exec(function (err, post) {
            if(err) throw err;
            if(post === null) res.redirect('/500');

            post.content = req.body.content;
            post.edited  = {
                user: req.user._id,
                date: new Date().getTime()
            };

            post.save(function(err) {
                if(err) throw err;
                res.redirect('/thread/' + post.thread + '/#' + post._id);
            })
        });
    },

    deletePost: function(req, res) {
        Post
        .findOne({ '_id': req.body.id })
        .populate('author')
        .exec(function (err, post) {
            if(err) throw err;
            if(post === null) res.redirect('/500');

            post.deleted = true;

            post.save(function(err) {
                if(err) throw err;
                res.redirect('/thread/' + post.thread + '/#' + post._id);
            })
        });
    },

    getTopics: function(req, res) {
        Thread.aggregate([
        { $group: { '_id' : "$topic", count : { $sum: 1 }}}
        ], function(err, groups) {
            if(err) throw err;

            var topics = {
                announcements: 0,
                officer: 0,
                general: 0,
                pve: 0,
                pvp: 0
            };

            for(var i = 0; i < groups.length; i++) {
                for(var key in topics) {
                    if(groups[i]._id === key) topics[key] = groups[i].count;
                }
            }
            console.log(groups, topics);

            res.render('topics', {
                user: req.user,
                threadCount: topics
            });
        });
    }

};