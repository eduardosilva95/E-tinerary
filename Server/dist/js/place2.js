document.querySelector("html").classList.add('js');

var fileInput = document.querySelector( ".input-poi-photo" );  
var button  = document.querySelector( ".input-poi-photo-trigger");
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
    the_return.innerHTML = event.srcElement.files[0].name;  
    the_return.title = event.srcElement.files[0].name;
    $("#update-picture-confirm-btn").css("display", "block");
});  