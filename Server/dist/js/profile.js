$(function () {
    $(document).scroll(function () {
      var $nav = $(".navbar");
      $nav.toggleClass('scrolled', $(this).scrollTop() > $nav.height());
    });
});


document.querySelector("html").classList.add('js');

var fileInput = document.querySelector( ".input-file" );  
var button  = document.querySelector( ".input-file-trigger" );
var the_return = document.querySelector(".file-return");

button.addEventListener("keydown", function( event ) {  
    if ( event.keyCode == 13 || event.keyCode == 32 ) {  
        fileInput.focus();  
    }  
});

button.addEventListener( "click", function( event ) {
   fileInput.focus();
   return false;
});  

fileInput.addEventListener( "change", function( event ) {  
    the_return.innerHTML = this.value;  
    the_return.title = this.value;
});  


$(function () {
    $('.btn-edit-modal').on('click', function () {

        var info_type =  $(this).data('title');        
        $('#edit-modal-title').text(info_type); 

        $('#edit-text').css("display", "none");
        $('#edit-date').css("display", "none");
        $('#edit-country').css("display", "none");

        if(info_type == "Name"){
            $('#edit-text').css("display", "block");
            $('#edit-text-input').attr("value", $(this).data('value'));
        }

        else if(info_type == "Birthday"){
            $('#edit-date').css("display", "block");
            $('#edit-date-input').attr("value", $(this).data('value'));
        }
        
        else if(info_type == "Country"){
            $('#edit-country').css("display", "block");
            $('#edit-country-input').val($(this).data('value'));
        }


        

    });
});