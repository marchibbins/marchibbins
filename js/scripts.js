Zepto(function($){
    $('a[rel="external"]').click(function(event) {
        event.preventDefault();
        window.open(this.href);
    });
});
