var fs = require('fs');
var Image = require('../models/image');

module.exports = {
    getGallery: function(req, res) {
        Image
        .find({})
        .exec(function(err, images) {
            if(err) throw err;

            res.render('gallery', {
                user: req.user,
                images: images
            });
        });
    },

    uploadImage: function(req, res) {
        var imageData = req.body.imageData.replace(/^data:image\/png;base64,/, "");

        var image         = new Image();
        image.title       = req.body.title;
        image.description = req.body.description;

        image.save(function(err) {
            if(err) throw err;
            fs.writeFile('../public/gallery/'+image._id+'.png', imageData, 'base64', function(err) {
                if(err) throw err;
                res.redirect('/gallery');
            });
        });
    },

    updateImage: function(req,res) {},

    deleteImage: function(req,res) {}
};