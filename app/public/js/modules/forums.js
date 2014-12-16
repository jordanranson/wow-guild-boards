/*
 * Forums front-end module
 */

$(function() {
    function onClickReply(e) {
        e.preventDefault();

        $('.x-create-post').show();
        $('.x-update-thread').hide();
        $('.x-update-post').hide();

        $('body').scrollTop($('.x-post-editor').offset().top);
    }

    function onClickEditPost(e) {
        e.preventDefault();

        $('.x-create-post').hide();
        $('.x-update-thread').hide();
        $('.x-update-post').show();

        var $target  = $(e.target);
        var postId   = $target.attr('data-for');
        var markdown = $('li[data-id="'+postId+'"]').attr('data-markdown');

        $('.x-edit-content').val(decodeURIComponent(markdown));
        $('.x-post-id').val(postId);

        $('body').scrollTop($('.x-post-editor').offset().top);

    }

    function onClickEditThread(e) {
        e.preventDefault();

        $('.x-create-post').hide();
        $('.x-update-thread').show();
        $('.x-update-post').hide();

        $('body').scrollTop($('.x-post-editor').offset().top);
    }

    var $body = $('body');
    $body.on('click', '.x-reply',       onClickReply);
    $body.on('click', '.x-cancel',      onClickReply);
    $body.on('click', '.x-edit',        onClickEditPost);
    $body.on('click', '.x-edit-thread', onClickEditThread);
});