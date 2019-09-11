document.querySelector("html").classList.add('js');

var reader = new FileReader();

//Set up some of our variables.
var map; //Will contain map object.
var marker = false; ////Has the user plotted their location marker? 

var cities_list = [];


/* load map */
function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 12,
        mapTypeId: 'satellite'
    });
    infoWindow = new google.maps.InfoWindow;

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        $('#input-poi-latitude').val(position.coords.latitude);
        $('#input-poi-longitude').val(position.coords.longitude);

        //infoWindow.setPosition(pos);
        infoWindow.open(map);

        marker = new google.maps.Marker({
            position: pos,
            map: map,
            draggable: true //make it draggable
        });
        //Listen for drag events!
        google.maps.event.addListener(marker, 'dragend', function(event){
            markerLocation();
        });

        map.setCenter(pos);
        }, function() {
        handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }

    google.maps.event.addListener(map, 'click', function(event) {                
        //Get the location that the user clicked.
        var clickedLocation = event.latLng;
        //If the marker hasn't been added.
        if(marker === false){
            //Create the marker.
            marker = new google.maps.Marker({
                position: clickedLocation,
                map: map,
                draggable: true //make it draggable
            });
            //Listen for drag events!
            google.maps.event.addListener(marker, 'dragend', function(event){
                markerLocation();
            });
        } else{
            //Marker has already been added, so just change its location.
            marker.setPosition(clickedLocation);
        }
        //Get the marker's location.
        markerLocation();
    });


    loadNavbar();
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);

}

        
//This function will get the marker's current location and then add the lat/long
//values to our textfields so that we can save the location.
function markerLocation(){
    //Get location.
    var currentLocation = marker.getPosition();
    //Add lat and lng values to a field that we can save.
    $("#input-poi-latitude").val(currentLocation.lat());
    $("#input-poi-longitude").val(currentLocation.lng());
}
        
        
//Load the map when the page has finished loading.
google.maps.event.addDomListener(window, 'load', initMap);



reader.onload = function (e) {
    $('#photo-preview').attr('src', e.target.result);
}
   
function readURL(input) {
    if (input.files && input.files[0]) {
        reader.readAsDataURL(input.files[0]);
        the_return.innerHTML = input.files[0].name;  
        the_return.title = input.files[0].name;
    }
}

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
    readURL(this);
});  

function loadCities(cities){
    cities_list = cities;

    var input_city = $('#input-poi-city');

    for(var i=0; i<cities.length; i++){
        var option = $("<option/>", {
            value: cities[i],
            text: cities[i]
        });

        input_city.append(option);
    }
}


$(function () {
    $('#input-google-place-id').focusout(function() {
        autoCompleteData();
    });

    $('#input-poi-latitude').focusout(function() {
        marker.setPosition(new google.maps.LatLng($('#input-poi-latitude').val(), $('#input-poi-longitude').val()));
        map.setCenter(new google.maps.LatLng($('#input-poi-latitude').val(), $('#input-poi-longitude').val()));
    });

    $('#input-poi-longitude').focusout(function() {
        marker.setPosition(new google.maps.LatLng($('#input-poi-latitude').val(), $('#input-poi-longitude').val()));
        map.setCenter(new google.maps.LatLng($('#input-poi-latitude').val(), $('#input-poi-longitude').val()));
    });


});

function autoCompleteData(){
    var request = {
        placeId: $('#input-google-place-id').val(),
        fields: ["formatted_address", "formatted_phone_number", "website", "rating", "user_ratings_total", "geometry", "name"]
    };
  
  
    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
    
            if(place.formatted_address != null)
                $('#input-poi-address').val(place.formatted_address);
            else
                $('#input-poi-address').val('');

            if(place.website != null)
                $('#input-poi-website').val(place.website);
            else
                $('#input-poi-website').val('');

            if(place.formatted_phone_number != null)
                $('#input-poi-phone').val(place.formatted_phone_number);
            else
                $('#input-poi-phone').val('');

            if(place.rating != null)
                $('#input-google-rating').val(place.rating);
            else
                $('#input-google-rating').val('');

            if(place.user_ratings_total != null)
                $('#input-google-reviews').val(place.user_ratings_total);
            else
                $('#input-google-reviews').val('');

            if(place.geometry.location != null){
                $('#input-poi-latitude').val(place.geometry.location.lat);
                $('#input-poi-longitude').val(place.geometry.location.lng);
                marker.setPosition(new google.maps.LatLng($('#input-poi-latitude').val(), $('#input-poi-longitude').val()));
                map.setCenter(new google.maps.LatLng($('#input-poi-latitude').val(), $('#input-poi-longitude').val()));
            }

            if(place.name != null){
                $('#input-poi-title').val(place.name);
            }


        }
    });
}


function searchID(){
    var poi_name = $("#input-poi-title-for-id-search").val();

    if(poi_name != ''){
        var request = {
            query: poi_name
        };
    
        var service = new google.maps.places.PlacesService(document.createElement('places-map'));
    
        service.textSearch(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                if(results.length > 0 && results[0].place_id != null){
                    $("#input-google-place-id").val(results[0].place_id);
                    autoCompleteData();
                }

                else{
                    $("#input-google-place-id").val('None');
                }
            }

            else{
                $("#input-google-place-id").val('None');
            }

        });
    }

    else{
        $("#input-google-place-id").val('None');
    }
}

$(function () {
    $('#input-poi-type').on('change', function() {
        if(this.value == 'Other'){
            $("#div-other-type").css("display", "block");
        }
        else{
            $("#div-other-type").css("display", "none");
        }
    });
});





function verify(){
    var poi_type = $("#input-poi-type").val();
    var city = $("#input-poi-city").val();

    if(poi_type == 'Select a category' || poi_type == '' || poi_type == undefined){
        alert("Must specify a category");
        return false;
    }

    else if(poi_type == 'Other'){
        var other_poi_type = $("#input-other-poi-type").val();
        if(other_poi_type == ''){
            alert("Must specify an other category");
            return false;
        }
    }


    if(city == 'Select a city' || city == '' || city == undefined){
        alert("Must specify a city");
        return false;
    }

    return true;
}