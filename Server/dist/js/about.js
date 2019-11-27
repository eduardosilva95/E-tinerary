  // code adapted from https://www.solodev.com/blog/web-design/adding-a-scroll-down-anchor-to-your-website.stml

   $(function () {
    $(".about-nav").on('click', function(event) {
      if (this.hash !== "") {
        event.preventDefault();
        var hash = this.hash;
        $('html, body').animate({
          scrollTop: $(hash).offset().top
        }, 800, function(){
          window.location.hash = hash;
        });
      } 
    });
  });
