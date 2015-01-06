/*
 * Gallery front-end module
 */

$(function() {
    var $galleryUpload = $('.x-gallery-upload');
    var imageData = null;

    function onEdit(e) {
        e.preventDefault();

        var $item = $(e.target).closest('.gallery-item');
        $item.addClass('edit');
    }

    function onDelete(e) {
        e.preventDefault();

        var $form = $(e.target).closest('.x-delete-form');
        $form.submit();
    }

    function onCancelEdit(e) {
        e.preventDefault();

        var $item = $(e.target).closest('.gallery-item');
        $item.removeClass('edit');

        var $elem;

        $elem = $item.find('[name="title"]');
        $elem.val($elem.attr('data-original'));

        $elem = $item.find('[name="description"]');
        $elem.val($elem.attr('data-original'));
    }

    function onReset() {
        $galleryUpload.css('background-image', 'none');
        $('input[name="imageData"]').val('');
    }

    function onSubmit(e) {
        if($('input[name="imageData"]').val() === '') {
            e.preventDefault();
            alert('No image selected!');

            return false;
        }
        if($('input[name="title"]').val() === '') {
            e.preventDefault();
            alert("Title can't be empty!");

            return false;
        }
        if($('input[name="description"]').val() === '') {
            e.preventDefault();
            alert("Description can't be empty!");

            return false;
        }

        return true;
    }

    function onDragOver(e) {
        $galleryUpload.addClass('over');
        return false;
    }

    function onDragEnd(e) {
        $galleryUpload.removeClass('over');
        return false;
    }

    function onDrop(e) {
        e.preventDefault();

        console.log(e);

        var file = e.dataTransfer.files[0];
        var reader = new FileReader();
        reader.onload = function (event) {
            console.log(event.target);

            var image = new Image();
            var cvs   = document.createElement('canvas');
            var ctx   = cvs.getContext('2d');
            image.onload = function() {

                var aspect = image.width/image.height;
                var maxSize = 1920;
                var w, h;

                if(image.width > image.height) {
                    w = image.width  > maxSize ? maxSize : image.width;
                    h = image.width  > maxSize ? image.height * (maxSize/image.width) : image.height;
                }
                else if(image.width < image.height) {
                    w = image.height > maxSize ? image.width * (maxSize/image.height) : image.width;
                    h = image.height > maxSize ? maxSize : image.height;
                }
                else {
                    w = image.width  > maxSize ? maxSize : image.width;
                    h = image.height > maxSize ? maxSize : image.height;
                }

                cvs.width  = w;
                cvs.height = h;

                ctx.drawImage(image, 0, 0, w, h);
                imageData = cvs;

                $galleryUpload.css('background-image', 'url(' + cvs.toDataURL('image/png') + ')');
                $galleryUpload.find('input[name="imageData"]').val(cvs.toDataURL('image/png'));
            };
            image.src = event.target.result;
        };
        console.log(file);
        reader.readAsDataURL(file);
    }

    function onPaste(e) {
        e.preventDefault();
    }

    var $body = $('body');
    $body.on('click', '.x-reset',  onReset);
    $body.on('click', '.x-submit', onSubmit);
    $body.on('click', '.x-cancel-edit', onCancelEdit);
    $body.on('click', '.x-edit-image',  onEdit);
    $body.on('click', '.x-delete-image',  onDelete);

    $galleryUpload.on('dragover', onDragOver);
    $galleryUpload.on('dragend',  onDragEnd);
    if($galleryUpload.length) $galleryUpload[0].addEventListener('drop', onDrop);
});