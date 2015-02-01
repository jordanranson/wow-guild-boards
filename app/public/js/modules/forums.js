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

    function getSelectionText() {
        var text = '';
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
        return text;
    }

    function onClickInsert(e) {
        var $textarea = $(e.target).closest('form').find('textarea');
        var selectedText = getSelectionText();
        var query = $(e.target).closest('.x-insert').attr('data-str');
        var text = $textarea.val();

        var result = query.replace('$1', selectedText);
            result = result.replace('$1', selectedText);

        $textarea.val(text.replace(selectedText, result))
    }

    var $body = $('body');
    $body.on('click', '.x-reply',       onClickReply);
    $body.on('click', '.x-cancel',      onClickReply);
    $body.on('click', '.x-edit',        onClickEditPost);
    $body.on('click', '.x-edit-thread', onClickEditThread);
    $body.on('mousedown', '.x-insert',  onClickInsert);
});