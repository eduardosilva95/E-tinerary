
function getCityImage(city, dest, image){

    /* if there are images stored in the server, use them */
    if(image != undefined && image != ""){
        if(image.includes("img/city")){
            document.getElementById(dest).src = image;
        }

        else{
            document.getElementById(dest).src = "/img/trips/" + image;
        }
    }
    
    /* if not, get the image from Google */
    else{
        if(city == "Barcelona" || city == "Madrid")
            city = city + ", Spain";

        var request = {
            query: city,
        };

        var service = new google.maps.places.PlacesService(document.createElement('places-map'));

        service.textSearch(request, function(results, status){
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var place = results[0];

                if(place.photos != undefined)
                    document.getElementById(dest).src = place.photos[0].getUrl();
                else
                    document.getElementById(dest).src = "img/no-photo-found.png";
            }

            else{
                document.getElementById(dest).src = "img/no-photo-found.png";
            }
        });

    }
}

$(function () {
    $('.btn-remove-modal').on('click', function () {
        $('#modal-delete-trip-title').text($(this).data('name'));
        $('#modal-delete-trip-name').text($(this).data('name'));
    
        document.getElementById('confirm-remove-btn').setAttribute( "onClick", "javascript: deleteTrip("+$(this).data('id')+");" );

    });
});

$(function () {
    $('.btn-rename-modal').on('click', function () {
        $('#modal-rename-trip-title').text($(this).data('name'));
        $('#inputName').attr("value", $(this).data('name'));
    
        document.getElementById('confirm-rename-btn').setAttribute( "onClick", "javascript: renameTrip("+$(this).data('id')+");");

    });
});

$(function () {
    $('.btn-archive-modal').on('click', function () {
        $('#archive-modal-title').text($(this).data('name'));
    
        document.getElementById('confirm-archive-btn').setAttribute( "onClick", "javascript: archiveTrip("+$(this).data('id')+");");

    });
});


$(function () {
    $('.btn-share-modal').on('click', function () {
        $('#share-modal-title').text($(this).data('name'));

        $('#share-modal-trip-id').val($(this).data('id'));
        $('#share-modal-user').val(getUserCookie());

        if($(this).data('src') == "past")
            $("#are-you-sure-share-msg").css("display", "none");
        else
            $("#are-you-sure-share-msg").css("display", "block");


        //document.getElementById('submit-share-trip-btn').setAttribute( "onClick", "javascript: shareTrip("+$(this).data('id')+");");

    });
});



function deleteTrip(trip_id){
    $.post("/delete-trip", {trip: trip_id}, function(result){
    
        if(result.result == 'error'){
        }
        
        else{
            window.location.reload();
        }
    
    });
}

function renameTrip(trip_id){
    var name = document.getElementById("inputName").value;

    $.post("/rename-trip", {trip: trip_id, name: name}, function(result){
        if(result.result == 'error'){
            $("#rename-error").css("display", "block");
            $("#rename-error").text(result.msg);
        }
        
        else{
            window.location.reload();
        }
    })    
}

function archiveTrip(trip_id){
    $.post("/archive-trip", {trip: trip_id}, function(result){
    
        if(result.result == 'error'){
        }
        
        else{
            window.location.reload();
        }
    })    
}

$(function (){
    $(".make-favorite-btn").mouseenter(function(){
        $('#make-favorite-' + this.id.split('-')[2] + '-icon').attr('class', 'fas fa-star fa-lg');
    });

    $(".make-favorite-btn").mouseleave(function(){
        $('#make-favorite-' + this.id.split('-')[2] + '-icon').attr('class', 'far fa-star fa-lg');
    });

    $(".unfavorite-btn").mouseenter(function(){
        $('#unfavorite-' + this.id.split('-')[1] + '-icon').attr('class', 'far fa-star fa-lg');
    });

    $(".unfavorite-btn").mouseleave(function(){
        $('#unfavorite-' + this.id.split('-')[1] + '-icon').attr('class', 'fas fa-star fa-lg');
    });
});


function makeTripFavorite(trip_id){

    $.post("/favorite-trip", {trip: trip_id}, function(result){
        if(result.result == 'error'){
        }
        
        else{
            window.location.reload();
        }
    });
}

function unfavoriteTrip(trip_id){

    $.post("/unfavorite-trip", {trip: trip_id}, function(result){
        if(result.result == 'error'){
        }
        
        else{
            window.location.reload();
        }
    });

}


$(function (){
    $('#scheduled-trips-checkbox').on('change', function () {
        if (!this.checked) {
            /*$("#scheduled-trips").css("display", "none");*/
            $('#scheduled-trips').removeClass('active').addClass('out');

			setTimeout(function(){
				$('#scheduled-trips').hide() 
            }, 300); //Same time as animation
            
        }
        else{
           /* $("#scheduled-trips").css("display", "block");*/
            $('#scheduled-trips').show();
            $('#scheduled-trips').removeClass('out').addClass('active');
        }
    });


    $('#past-trips-checkbox').on('change', function () {
        if (!this.checked) {
            $('#past-trips').removeClass('active').addClass('out');

			setTimeout(function(){
				$('#past-trips').hide() 
            }, 300); //Same time as animation
            
        }
        else{
            $('#past-trips').show();
            $('#past-trips').removeClass('out').addClass('active');
        }
    });

    $('#development-trips-checkbox').on('change', function () {
        if (!this.checked) {
            $('#development-trips').removeClass('active').addClass('out');

			setTimeout(function(){
				$('#development-trips').hide() 
            }, 300); //Same time as animation
            
        }
        else{
            $('#development-trips').show();
            $('#development-trips').removeClass('out').addClass('active');
        }
    });

    $('#interested-trips-checkbox').on('change', function () {
        if (!this.checked) {
            $('#interested-trips').removeClass('active').addClass('out');

			setTimeout(function(){
				$('#interested-trips').hide() 
            }, 300); //Same time as animation
            
        }
        else{
            $('#interested-trips').show();
            $('#interested-trips').removeClass('out').addClass('active');
        }
    });

    $('#favorite-trips-checkbox').on('change', function () {
        if (!this.checked) {
            $('#favorite-trips').removeClass('active').addClass('out');

			setTimeout(function(){
				$('#favorite-trips').hide() 
            }, 300); //Same time as animation
            
        }
        else{
            $('#favorite-trips').show();
            $('#favorite-trips').removeClass('out').addClass('active');
        }
    });
});


function setExperationTimeText(expiration_time, dest, trip_id){
    var countDownDate = new Date(expiration_time).getTime();

    // Update the count down every 1 second
    var x = setInterval(function() {

    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the result in the element with id="demo"
    document.getElementById(dest).innerHTML = "<strong>" + days + "d " + hours + "h "
    + minutes + "m " + seconds + "s </strong> to plan this trip";

    // If the count down is finished, write some text 
    if (distance < 0) {
        clearInterval(x);
        document.getElementById(dest).innerHTML = "EXPIRED";
        $("#"+ dest).css("color", 'red');
        deleteTrip(trip_id);
    }
    }, 1000);
}


function changeReviewPage(){
    $('#share-modal-general-info').removeClass('active');
    $('#pills-general-info-tab').removeClass('active');

    $('#share-modal-more-info').tab('show');
    $('#pills-more-info-tab').addClass('active');

    $('#change-review-page-btn').css("display", "none");
    $('#submit-share-trip-btn').css("display", "block");
    $('#return-review-page-btn').css("display", "block");

}

$(function () {
    $('#pills-general-info-tab').click(
      function(){ returnReviewPage(); return false;})
});

function returnReviewPage(){
    $('#share-modal-general-info').tab('show');
    $('#pills-general-info-tab').addClass('active');

    $('#share-modal-more-info').removeClass('active');
    $('#pills-more-info-tab').removeClass('active');

    $('#change-review-page-btn').css("display", "block");
    $('#submit-share-trip-btn').css("display", "none");
    $('#return-review-page-btn').css("display", "none");

}

$(function () {
    $('#pills-more-info-tab').click(
      function(){ changeReviewPage(); return false;})
});
