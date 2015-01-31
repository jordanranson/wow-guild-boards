/*
 * Gallery front-end module
 */

$(function() {
    var $galleryUpload = $('.x-gallery-upload');

    function onViewImage(e) {
        if($(e.target).hasClass('button') || $(e.target).hasClass('text') || $(e.target).hasClass('x-edit-image')) return;

        var $item = $(e.target).closest('.x-item');
        var $modal = $('.x-modal');

        $modal.find('.content').css('background-image', 'url("'+$item.attr('data-src')+'")');
        $modal.show();
    }

    function onCloseModal(e) {
        $('.x-modal').hide();
    }

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
        var $form = $(e.target).closest('form');

        if($form.find('input[name="imageData"]').val() === '') {
            e.preventDefault();
            alert('No image selected!');

            return false;
        }
        if($form.find('input[name="title"]').val() === '') {
            e.preventDefault();
            alert("Title can't be empty!");

            return false;
        }
        if($form.find('input[name="description"]').val() === '') {
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
            var image = new Image();
            var cvs   = document.createElement('canvas');
            var ctx   = cvs.getContext('2d');
            var tcvs  = document.createElement('canvas');
            var tctx  = tcvs.getContext('2d');

            image.onload = function() {
                // resize image to max size
                _maxSize = function(maxSize) {
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

                    return [w, h];
                };

                // resized image
                var max = _maxSize(1920);
                cvs.width  = max[0];
                cvs.height = max[1];
                ctx.drawImage(image, 0, 0, max[0], max[1]);

                // thumbnail
                max = _maxSize(480);
                tcvs.width  = max[0];
                tcvs.height = max[1];
                tctx.drawImage(image, 0, 0, max[0], max[1]);

                // set preview
                $galleryUpload.css('background-image', 'url(' + tcvs.toDataURL('image/jpeg', .8) + ')');

                // set data
                $galleryUpload.find('input[name="imageData"]').val(cvs.toDataURL('image/jpeg', .8));
                $galleryUpload.find('input[name="imageThumb"]').val(tcvs.toDataURL('image/jpeg', .8));
            };
            image.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function onPaste(e) {
        e.preventDefault();
    }

    var $body = $('body');
    $body.on('click', '.x-reset', onReset);
    $body.on('click', '.x-submit', onSubmit);
    $body.on('click', '.x-cancel-edit', onCancelEdit);
    $body.on('click', '.x-edit-image', onEdit);
    $body.on('click', '.x-delete-image', onDelete);
    $body.on('click', '.x-item', onViewImage);
    $body.on('click', '.x-modal', onCloseModal);

    var $modal = $('.modal');
    $modal.hide();

    $galleryUpload.on('dragover', onDragOver);
    $galleryUpload.on('dragend',  onDragEnd);
    if($galleryUpload.length) $galleryUpload[0].addEventListener('drop', onDrop);
});