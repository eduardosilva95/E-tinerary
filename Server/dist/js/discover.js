
$(function () {
    $(document).scroll(function () {
      var $nav = $(".navbar");
      $nav.toggleClass('scrolled', $(this).scrollTop() > $nav.height());
    });
  });


  function search(){
    if(document.getElementById('query-input').value != undefined && document.getElementById('query-input').value != ""){
      var query = document.getElementById('query-input').value;
      
      var href = new URL(window.location.href);
      href.searchParams.set('query', query);
      
      window.location.href = href;
    }
  }