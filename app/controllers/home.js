var fs = require('fs');
var Image  = require('../models/image');
var User   = require('../models/user');
var Post   = require('../models/post');
var Guild  = require('../models/guild');
var Thread = require('../models/thread');
var CONFIG = require('../config/config');
var request = require('../request');
var path   = require('path');
var __     = require('lodash');

module.exports = {
    getHomepage: function (req, res) {

        // Random tagline
        var taglines = [
            "We're pants on head smart!"
        ];
        var tagline = taglines[Math.random() * taglines.length<<0];

        // Get the guild
        Guild.findOne({}, function(err, guild) {
            if(err) throw err;

            // Update the guild once an hour, on page load TODO: hacky
            if(guild !== null && guild.lastUpdated.getTime() < new Date().getTime() - (1*60*60*1000)) {
                request.bnet(
                    'us.battle.net',
                    '/api/wow/guild/'+CONFIG.realm+'/'+encodeURIComponent(CONFIG.guild)+'?fields=members,news',
                    function(data) {
                        var lastUpdated = new Date().getTime();

                        for(var key in data) {
                            guild[key] = data[key];
                        }

                        guild.lastUpdated = lastUpdated;
                        guild.news = data.news;

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

            // Show the guild home page
            if(guild !== null) {

                // Find latest forum posts
                var numPosts = 3;
                Post
                    .find()
                    .where('categoryId').ne([])
                    .populate([{path: 'author'}, {path: 'thread'}])
                    .sort({ 'created': -1 })
                    .exec(function (err, posts) {
                        if (err) throw err;
                        if(posts === null || posts.length === 0) {
                            posts = [];
                        }

                        posts = __.filter(posts, function(item) {
                            return item.thread.topic !== 'officer';
                        });
                        posts = posts.splice(0,3);

                        // Find the latest announcement
                        Thread
                            .findOne({'topic': 'announcements'})
                            .sort({ 'created': -1 })
                            .exec(function (err, thread) {
                                if (err) throw err;
                                if(thread === null) {
                                    thread = {};
                                }

                                // Get announcement post
                                Post.findOne({'thread': thread._id})
                                    .populate('author')
                                    .sort({ 'created': 1 })
                                    .exec(function (err, announcement) {
                                        if (err) throw err;
                                        if(announcement === null) {
                                            announcement = {};
                                        }

                                        // Find latest gallery image
                                        var numImages = 1;
                                        Image
                                            .find({})
                                            .sort({ 'created': -1 })
                                            .limit(numImages)
                                            .exec(function (err, images) {
                                                if (err) throw err;
                                                if(images.length === 0 || images === null) {
                                                    images = [];
                                                }

                                                announcement.title = thread.title;
                                                announcement.threadId = thread._id;

                                                // Get latest three forum posts and guild news, aggregated
                                                var news = posts.concat(guild.news.splice(0,numPosts));
                                                for(var i = 0; i < news.length; i++) {
                                                    if(!news[i].type)
                                                        news[i].type = 'post';
                                                    if(!news[i].character)
                                                        news[i].character = news[i].author.mainCharacter.name;
                                                    if(!news[i].timestamp)
                                                        news[i].timestamp = news[i].created;
                                                }
                                                news = news.sort(function(a, b) {
                                                    var aDate = new Date(a.timestamp).getTime();
                                                    var bDate = new Date(b.timestamp).getTime();
                                                    return aDate < bDate;
                                                });

                                                var resObj = {
                                                    user: req.user,
                                                    announcement: announcement,
                                                    posts: posts,
                                                    images: images,
                                                    guild: guild,
                                                    news: news,
                                                    tagline: tagline
                                                };

                                                // Render home page
                                                res.render('home', resObj);
                                            });
                                    });
                            });
                    });
            }
        });
    }
};