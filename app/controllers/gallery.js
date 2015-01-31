var fs = require('fs');
var Image = require('../models/image');
var path = require('path');

module.exports = {
    getGallery: function(req, res) {
        Image
        .find({})
        .sort({ 'created': -1 })
        .exec(function(err, images) {
            if(err) throw err;

            res.render('gallery', {
                user: req.user,
                images: images
            });
        });
    },

    uploadImage: function(req, res) {
        var imageData  = req.body.imageData.replace(/^data:image\/jpeg;base64,/, "");
        var imageThumb = req.body.imageThumb.replace(/^data:image\/jpeg;base64,/, "");

        var image         = new Image();

        image.title       = req.body.title;
        image.description = req.body.description;
        image.created     = new Date().getTime();

        image.save(function(err) {
            if(err) throw err;
            fs.writeFile(path.resolve(__dirname, '../public/gallery/'+image._id+'.jpg'), imageData, 'base64', function(err) {
                if(err) throw err;
                fs.writeFile(path.resolve(__dirname, '../public/gallery/'+image._id+'_thumb.jpg'), imageThumb, 'base64', function(err) {
                    if(err) throw err;
                    res.redirect('/gallery');
                });
            });
        });
    },

    updateImage: function(req, res) {
        Image.findOne({ '_id': req.body.id }, function(err, image) {
            if(err) throw err;

            image.title       = req.body.title;
            image.description = req.body.description;

            image.save(function(err) {
                if(err) throw err;
                res.redirect('/gallery');
            });
        });
    },

    deleteImage: function(req,res) {
        Image.findOne({ '_id': req.body.id }, function(err, image) {
            if (err) throw err;
            image.remove(function(err) {
                if(err) throw err;

                fs.unlink(path.resolve(__dirname, '../public/gallery/'+image._id+'.jpg'));
                res.redirect('/gallery');
            })
        });
    }
};