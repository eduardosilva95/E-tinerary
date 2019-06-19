var field_selected;


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
    the_return.innerHTML = event.srcElement.files[0].name;  
    the_return.title = event.srcElement.files[0].name;
    $("#update-picture-confirm-btn").css("display", "block");
});  


$(function () {
    $('.btn-edit-modal').on('click', function () {

        var field =  $(this).data('title');  
        field_selected = field;

        $('#edit-modal-title').text(field); 
        $('#error-msg-field').text(field); 

        $('#edit-text').css("display", "none");
        $('#edit-numbers').css("display", "none");
        $('#edit-date').css("display", "none");
        $('#edit-country').css("display", "none");


        if(field == "Name"){
            $('#edit-text').css("display", "block");
            $('#edit-text-input').attr("value", $(this).data('value'));
        }

        else if(field == "Birthday"){
            $('#edit-date').css("display", "block");
            $("#edit-date-input").datepicker("value", $(this).data('value'));
        }
        
        else if(field == "Country"){
            $('#edit-country').css("display", "block");
            $('#edit-country-input').val($(this).data('value'));
        }

        else if(field == "Address"){
            $('#edit-text').css("display", "block");
            $("#edit-text-input").attr("value", $(this).data('value'));
        }

        else if(field == "Phone Number"){
            $('#edit-numbers').css("display", "block");
            $("#edit-numbers-input").attr("value", $(this).data('value'));
        }

    });
});

$(function () {
	var month = new Array();
	month[0] = "January";
	month[1] = "February";
	month[2] = "March";
	month[3] = "April";
	month[4] = "May";
	month[5] = "June";
	month[6] = "July";
	month[7] = "August";
	month[8] = "September";
	month[9] = "October";
	month[10] = "November";
    month[11] = "December";


    if($("#bday").text() == ""){
        $("#birthday-text").html("");
        return;
    }


    
    var birthday = new Date($("#bday").text());

    var birthday_txt = birthday.getDate() + " " + month[birthday.getMonth()] + " " + birthday.getFullYear();
    var birthday_val = (birthday.getDate()<10?'0':'') + birthday.getDate() + "/" + ((birthday.getMonth()+1)<10?'0':'') + (birthday.getMonth()+1) + "/" + birthday.getFullYear();;

    $("#birthday-text").html(birthday_txt);
    
    $("#btn-edit-modal-bday").data("value", birthday_val);

});




function editProfile(){
    if(!hasUserCookies())
        return;

    var new_value;

    if(field_selected == "Name")
        new_value = $('#edit-text-input').val();

    else if(field_selected == "Birthday")
        new_value = $('#edit-date-input').val();

    else if(field_selected == "Country")
        new_value = $('#edit-country-input').val();

    else if(field_selected == "Address")
        new_value = $('#edit-text-input').val();

    else if(field_selected == "Phone Number"){
        if($('#edit-numbers-input').val().match(/^[0-9]+$/) == null){
            $('#edit-error').css("display", "block");
            return;
        }

        new_value = $('#edit-numbers-input').val();
    }
        
    
    $.post("/edit-profile", {field: field_selected, value: new_value}, function(result){

        if(result.result == 'error'){
            $('#edit-error').css("display", "block");
        }
        
        else{
            window.location.reload();
        }    
    });

}

$(function () {
    $('#edit-profile-modal').on('hidden.bs.modal', function () {
        $('#edit-error').css("display", "none");
    });
});