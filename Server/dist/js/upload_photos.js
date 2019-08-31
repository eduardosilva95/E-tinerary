document.querySelector("html").classList.add('js');

var fileInput = document.querySelector( ".input-photo" );  
var button  = document.querySelector( ".input-photo-trigger");
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



var reviewPhotoInput = document.querySelector( "#review-photo-name" );  
var reviewPhotoBtn  = document.querySelector( ".input-photo-trigger");
var reviewPhotoFilename = document.querySelector(".review-photo-filename");

reviewPhotoBtn.addEventListener("keydown", function( event ) {  
    if ( event.keyCode == 13 || event.keyCode == 32 ) {  
        fileInput.focus();  
    }  
});

reviewPhotoBtn.addEventListener( "click", function( event ) {
   fileInput.focus();
   return false;
});  

reviewPhotoInput.addEventListener( "change", function( event ) {  
    reviewPhotoFilename.innerHTML = event.srcElement.files[0].name;  
    reviewPhotoFilename.title = event.srcElement.files[0].name;
});  