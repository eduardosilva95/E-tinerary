
var trip;
var place_info = [];

var places = {}; // dictionary with all visits
var suggested_places = {}; // dictionary with all suggested places
var hotels = {}; // dictionary with all suggested hotels


var TRAVEL_MODE;


function loadTrip(trip_array, days, days_shortname, travel_mode){
    TRAVEL_MODE = travel_mode;
    trip = trip_array;

    for(var j=0 ; j < trip.length ; j++){
        p = JSON.parse(trip[j]);
        places[p.name] = p;
    }

    loadVisits();
}

function loadVisits(){

    var count = 0;
    for(var key in places){
        document.getElementById('place-' + count + '-name').innerText = places[key].name;
        document.getElementById('place-' + count + '-name').title = places[key].name;
        document.getElementById('place-' + count + '-type').innerText = places[key].poi_type;

        document.getElementById('place-' + count + '-type').innerHTML = '<i class="' + getIcon(places[key].poi_type) + '" aria-hidden="true" style="padding-right: 10px;"></i>' + places[key].poi_type;

        $("#place-" + count + "-remove").attr("data-poi", places[key].id);
        
        place_info[count] = places[key];

        document.getElementById('place-' + count).style.display = 'block';
        
        if(places[key].photo == null)
            loadImage(places[key].place_id, 'place-' + count + '-img');    
        else
            document.getElementById('place-' + count + '-img').src = places[key].photo;

        document.getElementById('place-' + count + '-info').innerHTML = "Info about " + places[key].name;
    
        count = count + 1;
    
    }
}

function loadSuggestions(suggested_visits){

    for(var j=0 ; j < suggested_visits.length ; j++){
        p = JSON.parse(suggested_visits[j]);

        suggested_places[p.name] = {'id': p.id, 'name': p.name, 'city': p.city, 'place_id': p.place_id, 'address': p.address, 'coordinates': p.coordinates, 'website': p.website, 'phone_number': p.phone_number, 'poi_type': p.poi_type};
    }
}

function loadHotels(suggested_hotels){

    for(var j=0 ; j < suggested_hotels.length ; j++){
        p = JSON.parse(JSON.stringify(suggested_hotels[j]));

        hotels[p.name] = {'id': p.id, 'name': p.name, 'city': p.city, 'place_id': p.place_id, 'address': p.address, 'coordinates': p.coordinates, 'website': p.website, 'phone_number': p.phone_number, 'poi_type': p.poi_type};
    }
}


function loadImage(place_id, dest){
    var request = { 
        placeId: place_id,
    };
  
    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {

            if(place.photos != undefined)
                document.getElementById(dest).src = place.photos[0].getUrl();
            else
                document.getElementById(dest).src = "";

        }
    });


}


$(function () {
    $('.btn-info-modal').on('click', function () {
        var id = parseInt($(this).attr('id').replace('place-', '').replace('-info', ''));

        $('.modal-title').text(place_info[id]['name']);

        if(place_info[id]['photo'] == null)
            loadImage(place_info[id]['place_id'], "info-modal-img");    
        else
            document.getElementById("info-modal-img").src = place_info[id]['photo'];

        
        $('#modal-info-city').text(place_info[id]['city']);
        $('#modal-info-addr').text(place_info[id]['address']);
        $('#modal-info-coord').text(place_info[id]['coordinates']);
        $('#modal-info-phone').text(place_info[id]['phone_number']);
        $('#modal-info-website').text(place_info[id]['website']);

        if(place_info[id]['website'] == "No information available")
            $('#modal-info-website').removeAttr("href");
        else
            $('#modal-info-website').attr("href", place_info[id]['website']);
        
        $('#modal-info-number-trips').text(place_info[id]['no_trips']);
        $('#modal-info-duration').text(place_info[id]['duration']);
        $('#modal-info-price').text(place_info[id]['price']);

        loadRating(place_info[id]['rating'] ,"place-rating");
        loadRating(place_info[id]['accessibility'] ,"place-accessibility");
        loadRating(place_info[id]['security'] ,"place-security");

        var dest =  '/place?id=' + place_info[id]['id'] + '&trip=' + /id=([^&]+)/.exec(location.search)[1];
        $('#modal-find-more-btn').attr("onclick", "window.location.href = " + "'" + dest + "'");
    });
});


$(function () {
    $('.btn-remove-modal').on('click', function () {
        var id = parseInt($(this).attr('id').replace('place-', '').replace('-remove', ''));

        $('#modal-delete-visit-name').text(place_info[id]['name']);

        document.getElementById('confirm-remove-btn').setAttribute( "onClick", "javascript: deleteVisit("+$(this).data('poi')+");" );

        
    });
});

$(function () {
    $('.btn-edit-modal').on('click', function () {
        var id = parseInt($(this).attr('id').replace('place-', '').replace('-edit', ''));

        $('#modal-title').text(place_info[id]['name']);

    });
});

function addVisit(city){
    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    var queryString = "?dest=" + city + "&trip=" + trip_id;
    window.location.href = "./places" + queryString;
}



function deleteVisit(poi_id){
    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    $.post("/delete-visit", {trip: trip_id, poi: poi_id}, function(result){
    
        if(result.result == 'error'){
        }
        
        else{
            window.location.reload();
        }
    });
}

function deleteTrip(){
    var href = new URL(window.location.href);
    trip_id = parseInt(href.searchParams.get('id'));
    
    $.post("/delete-trip", {trip: trip_id}, function(result){
    
        if(result.result == 'error'){
        }
        
        else{
            window.location.href = "./trips";
        }
    
    });
}


function saveTrip(){
    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    $.post("/save-trip", {trip: trip_id}, function(result){
    
        if(result.result == 'error'){
        }
        
        else{
            window.location.href = "/trip?id=" + trip_id;
        }
    
    });
}


function getIcon(type){

    type = type.toLowerCase();

    if(type == 'park'){
        return "fas fa-tree";
    }

    else if(type == 'castle'){
        return "fas fa-chess-rook";
    }

    else if (type == 'tower' || type == 'museum'){
        return "fas fa-archway";
    }

    else if (type == 'church'){
        return "fas fa-church";
    }

    else if (type == 'restaurant'){
        return "fas fa-utensils";
    }

    else if (type == 'hotel'){
        return "fas fa-bed";
    }

    else if (type == 'natural feature'){
        return "fas fa-umbrella-beach";
    }

    else if (type == 'aquarium'){
        return "fas fa-fish";
    }

    else if (type == 'zoo'){
        return "fas fa-hippo";
    }

    else if (type == 'place of worship'){
        return "fas fa-place-of-worship";
    }

    else if (type == 'amusement park'){
        return "fas fa-child";
    }

    else if (type == 'stadium'){
        return "fas fa-futbol";
    }

    else if (type == 'train station'){
        return "fas fa-train";
    }

    else{
        return "fas fa-monument";
    }

}

$(function () {
    $('.visit-loaded').delay(100).animate({ opacity: 1 }, 700);
});


function loadProgressBar(num_visits, max_num_visits){
    var progress_perc = num_visits / max_num_visits * 100;
    $('#visits-progress-bar').css('width', progress_perc + "%");

    if(progress_perc >= 10 && progress_perc < 25)
        $('#visits-progress-bar').attr('class', 'progress-bar progress-bar-striped bg-success');

    else if(progress_perc >= 25 && progress_perc < 50)
        $('#visits-progress-bar').attr('class', 'progress-bar progress-bar-striped bg-info');

    else if(progress_perc >= 50 && progress_perc < 75)
        $('#visits-progress-bar').attr('class', 'progress-bar progress-bar-striped bg-warning');

    else if(progress_perc >= 75)
        $('#visits-progress-bar').attr('class', 'progress-bar progress-bar-striped bg-danger');

    $('#visits-progress-bar').html(num_visits + "/" +  max_num_visits);

    if(num_visits == max_num_visits){
        $("#add-visit-dropdown-button").prop("disabled", true);
        $("#add-visit-dropdown-button-bottom").prop("disabled", true);
    }

}

function setExperationTimeText(expiration_time){
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
    document.getElementById('trip-time-left').innerHTML = "<strong>" + days + "d " + hours + "h "
    + minutes + "m " + seconds + "s </strong>";

    // If the count down is finished, write some text 
    if (distance < 0) {
        clearInterval(x);
        document.getElementById('trip-time-left').innerHTML = "EXPIRED";
        deleteTrip();
    }
    }, 1000);
}


