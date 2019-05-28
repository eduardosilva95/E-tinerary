
function getCityImage(city, dest, image){

    if(image != undefined && image != "")
        document.getElementById(dest).src = "/img/plans/" + image;

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
                    document.getElementById(dest).src = "";
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

        $('#share-modal-plan-id').val($(this).data('id'));
        $('#share-modal-user').val(getUserCookie());

        if($(this).data('src') == "past")
            $("#are-you-sure-share-msg").css("display", "none");
        else
            $("#are-you-sure-share-msg").css("display", "block");


       // document.getElementById('confirm-public-btn').setAttribute( "onClick", "javascript: makePublic("+$(this).data('id')+");");

    });
});



function deleteTrip(trip_id){
    var user = getUserCookie();

    if(user != null){
        $.post("/delete-plan", {plan: trip_id, user: user}, function(result){
    
      
            if(result.result == 'error'){
            }
            
            else{
              window.location.reload();
            }
      
        });
      
    }

}

function renameTrip(trip_id){
    var user = getUserCookie();

    var name = document.getElementById("inputName").value;

    if(user != null){
        $.post("/rename-plan", {plan: trip_id, user: user, name: name}, function(result){

            console.log(result);
    
      
            if(result.result == 'error'){
            }
            
            else{
              window.location.reload();
            }
        })    
    }

}

function archiveTrip(trip_id){
    $.post("/archive-plan", {plan: trip_id}, function(result){
    
        if(result.result == 'error'){
        }
        
        else{
            window.location.reload();
        }
    })    
}

