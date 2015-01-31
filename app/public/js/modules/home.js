/*
 * Home front-end module
 */

$(function() {
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

    var $body = $('body');
    $body.on('click', '.x-item', onViewImage);
    $body.on('click', '.x-modal', onCloseModal);

    var $modal = $('.modal');
    $modal.hide();
});