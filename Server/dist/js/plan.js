var map;
var service;
var infowindow;

/* variables to draw the itinerary */
var directionsService;
var directionsDisplay;

var plan;
var weekdays = [];
var shortdays = [];
var dif_days;
var plan_days = [];
var day; // index of the day displayed
var place_info = [];

var places = {}; // dictionary with all visits
var suggested_places = {}; // dictionary with all suggested places
var hotels = {}; // dictionary with all suggested hotels

/* variables to store map markers and markers cluster */
var markers = [];
var markerList = [];
var markerCluster;

/* colors for differentes types of visits */
var visits_color = '#74bb82';
var suggested_visits_color = '#ac48db';
var hotels_color = '#2079d8';

var hasMap = false;

var TRAVEL_MODE;


/* load map */
function initMap(latitude, longitude) {

    var position = {lat: parseFloat(latitude), lng: parseFloat(longitude)};

    map = new google.maps.Map(document.getElementById('map'), {
        center: position,
        zoom: 12,
    });

    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
    directionsDisplay.setMap(map);

    // Style map
    var styles = {
        default: null,
        hide: [
            {
                featureType: 'poi',
                stylers: [{visibility: 'off'}]
            },
        ]
    };
    map.setOptions({styles: styles['hide']});


    google.maps.event.addListenerOnce(map, 'idle', function () {

        for(var key in places){
            if(places[key].day.replace(/\s/g, '') == plan_days[day].replace(/\s/g, '')){
                data = {color: visits_color, icon: getIcon(places[key]["poi_type"])};
                createMarker(places[key]['coordinates'], places[key]['name'], data, "visits");
            }
        }

        /*for(var key in suggested_places){
            data = {color: suggested_visits_color, icon: getIcon(suggested_places[key]["poi_type"])};
            createMarker(suggested_places[key]['coordinates'], suggested_places[key]['name'], data, "suggestions");
        }

        for(var key in hotels){
            data = {color: hotels_color, icon: getIcon(hotels[key]["poi_type"])};
            createMarker(hotels[key]['coordinates'], hotels[key]['name'], data, "hotels");
        }*/

        /* Markers clustering */
        markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

        loadItinerary();    

    });

    infoWindow = new google.maps.InfoWindow;
    loadNavbar();

    var myPath = window.location.href;
    var plan_id = /id=([^&]+)/.exec(location.search)[1];

    document.cookie = "plan=" + plan_id + ";path=" + myPath;

    hasMap = true;
}


function createMarker(local, name, data, type){
    /* if place has already a marker in the map, ignore */
    if(markerList.includes(name))
      return;
    
    var coordinates = new google.maps.LatLng({lat: parseFloat(local.split(', ')[0]), lng: parseFloat(local.split(', ')[1])}); 
    
    marker = new Marker({
      position: coordinates,
      map: map,
      title: name,
      icon: {
          path: MAP_PIN,
          fillColor: data.color,
          fillOpacity: 1,
          strokeColor: '',
          strokeWeight: 0
      },
      map_icon_label: '<i class="'+data.icon+'"></i>'
    });


    if(type == "visits"){
        marker.addListener('click', function () {
            loadModalInMap(places[this.title]);
            $("#info-modal").modal();
            $("#add-visit-btn").css("display", "none");
        });
    }

    else if(type == "suggestions"){
        marker.addListener('click', function () {
            loadModalInMap(suggested_places[this.title]);
            $("#info-modal").modal();
            $("#add-visit-btn").css("display", "block");
        });
    }

    else if(type == "hotels"){
        marker.addListener('click', function () {
            viewPOI(hotels[this.title]);
            $("#info-modal").modal();
            $("#add-visit-btn").css("display", "none");
        });

    }      
    
    markers.push(marker);
    markerList.push(marker.title);
  }


// Deletes all markers in the map
function clearMarkers() {
    markerCluster.clearMarkers();

    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }

    markers = [];
    markerList = [];
}


// update markers in the map in function of the visit day displayed
function updateMarkers(){
    clearMarkers();

    for(var key in places){
        if(places[key].day.replace(/\s/g, '') == plan_days[day].replace(/\s/g, '')){
            data = {color: visits_color, icon: getIcon(places[key]["poi_type"])};
            createMarker(places[key]['coordinates'], places[key]['name'], data, "visits");
        }
    }

    /* Markers clustering */
    markerCluster = new MarkerClusterer(map, markers,
    {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
    
    /* update itinerary */
    loadItinerary();
}


function renderDirections(result) { 
    var directionsRenderer = new google.maps.DirectionsRenderer(); 
    directionsRenderer.setMap(map); 
    directionsRenderer.setDirections(result); 
}     


function calcRoute(start, end, waypts) {

    var request = {
        origin: {
            placeId: start
        },
        destination: {
            placeId: end
        },     
        waypoints: waypts, 
        travelMode: TRAVEL_MODE
    };
    
    directionsService.route(request, function(result, status) {
      if (status == 'OK') {
        loadTravelTimesAndDistances(result, start);
        directionsDisplay.setDirections(result);
        //animateItinerary(result);
      }
    });
  }


  /* function to show the itinerary being traversed */
  function animateItinerary (response){
    var path = response.routes[0].overview_path;
    var maxIter=path.length;

    taxiCab=new google.maps.Marker({
       position: path[0],
       map: map, 
       icon: "img/car.png"
    });

    var delay = 20, count = 0;
    function delayed () {
      count += 1;
      taxiCab.setPosition({lat:path[count].lat(),lng:path[count].lng()});
      if (count < maxIter-1) {
        setTimeout(delayed, delay);
      }
    }
    delayed();
}  


function loadPlan(plan_array, days, days_shortname, travel_mode){
    TRAVEL_MODE = travel_mode;
    plan = plan_array;
    day = 0;
    days = days.split(',');
    days_shortname = days_shortname.split(',');

    dif_days = days.length / 2 - 1;

    for(var i=1; i < days.length ; i+=2){
        plan_days.push(days[i]);
    }

    for(var i=0; i < days.length ; i+=2){
        weekdays.push(days[i] + days[i+1]);
    }

    for(var j=0 ; j < plan.length ; j++){
        p = JSON.parse(plan[j]);
        places[p.name] = p;
    }

    for(var i=0; i < days_shortname.length ; i++){
        shortdays.push(days_shortname[i]);
    }

    loadVisits();

    document.getElementById('previous-day-btn').disabled = true;

    if(day + 1 >= weekdays.length){
        document.getElementById('next-day-btn').disabled = true;
    }

    loadBottomNavbar();
}


function loadItinerary(){
    var visits_tmp = [];

    for(var key in places){
        if(places[key].day.replace(/\s/g, '') == plan_days[day].replace(/\s/g, '')){
            visits_tmp.push(places[key]);
        }
    }

    var waypoints = [];
    for(var i=1; i < visits_tmp.length - 1; i++){
        if(visits_tmp[i].place_id != undefined)
            waypoints.push({ stopover: true, location: { placeId: visits_tmp[i].place_id } });
        else{
            var lat = visits_tmp[i].coordinates.split(', ')[0];
            var lng = visits_tmp[i].coordinates.split(', ')[1];
            waypoints.push({ stopover: true, location: new google.maps.LatLng(lat, lng)});
        }
    }

    calcRoute(visits_tmp[0].place_id, visits_tmp[visits_tmp.length-1].place_id, waypoints);
}

function loadTravelTimesAndDistances(result, start){
    result = result.routes[0].legs;
    
    var start_index = 0;

    for(var key in places){
        if(places[key].place_id == start){
            break;
        }
        start_index++;
    }

    for(var i=0; i < result.length; i++){
        var txt = result[i].duration.text + " (" + result[i].distance.text + ")";
        $("#desloc-" + (start_index + i)).css("display", "block");
        $("#desloc-" + (start_index + i) + "-text").text(txt);
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
        p = JSON.parse(suggested_hotels[j]);

        hotels[p.name] = {'id': p.id, 'name': p.name, 'city': p.city, 'place_id': p.place_id, 'address': p.address, 'coordinates': p.coordinates, 'website': p.website, 'phone_number': p.phone_number, 'poi_type': p.poi_type};
    }
}


function loadBottomNavbar(){

    var start = new Date(plan_days[0]);
    var now = new Date();

    if(now >= start){
        $("#add-visit-div").css("display", "none");
        $("#save_plan_btn").css("display", "none");
        $("#are-you-sure-share-msg").css("display", "none");
        
    }

}


function nextDay(){
    if(day == plan_days.length){
        return;
    }
    day = day + 1;

    loadVisits();

    document.getElementById('previous-day-btn').disabled = false;

    if(day + 1 >= weekdays.length){
        document.getElementById('next-day-btn').disabled = true;
    }

    if(hasMap)
        updateMarkers();

}

function previousDay(){
    if(day == 0){
        return;
    }
    day = day - 1;

    loadVisits();

    document.getElementById('next-day-btn').disabled = false;

    if(day - 1 < 0){
        document.getElementById('previous-day-btn').disabled = true;
    }

    if(hasMap)
        updateMarkers();

}


function loadVisits(){
    document.getElementById('visit-day').innerText = weekdays[day];
    document.getElementById('visit-day-mobile').innerText = shortdays[day];

    var count = 0;
    for(var key in places){
        if(places[key].day.replace(/\s/g, '') == plan_days[day].replace(/\s/g, '')){
            document.getElementById('place-' + count + '-name').innerText = places[key].name;
            document.getElementById('place-' + count + '-name').title = places[key].name;
            document.getElementById('place-' + count + '-type').innerText = places[key].poi_type;
            document.getElementById('place-' + count + '-start-hour').innerText = places[key].start_time;
            document.getElementById('place-' + count + '-end-hour').innerText = places[key].end_time;
        
            if(places[key].weather == null){
                // does not have weather forecast
                $('#place-' + count + '-weather').parent().css("display", "none");
                $('#place-' + count + '-name').parent().attr("class", "col-md-12");
            }

            else{
                // display the weather forecast with an icon provided by OpenWeatherMap
                var weather_icon = "http://openweathermap.org/img/w/" + places[key].weather_icon + ".png";
                document.getElementById('place-' + count + '-weather').innerHTML = '<img src=' + weather_icon + ' style="width: 54px; height: 45px;"></i>' + places[key].weather + "ºC";     
            }
       
            /* use Font Awesome icons for weather */

            /*else if(visits[i].weather.split(" ")[0] == 'Clear'){
                document.getElementById('place-' + i + '-weather').innerHTML = '<i class="fas fa-sun" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].weather + "ºC";
            }

            else if(visits[i].weather.split(" ")[0] == 'Rain'){
                document.getElementById('place-' + i + '-weather').innerHTML = '<i class="fas fa-cloud-rain" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].weather + "ºC";
            }

            else if(visits[i].weather.split(" ")[0] == 'Clouds'){
                document.getElementById('place-' + i + '-weather').innerHTML = '<i class="fas fa-cloud" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].weather + "ºC";
            }*/

            document.getElementById('place-' + count + '-type').innerHTML = '<i class="' + getIcon(places[key].poi_type) + '" aria-hidden="true" style="padding-right: 10px;"></i>' + places[key].poi_type;

            $("#place-" + count + "-remove").attr("data-poi", places[key].id);
            
            place_info[count] = places[key];

            document.getElementById('place-' + count).style.display = 'block';
            
            if(places[key].photo == null)
                loadImage(places[key].place_id, 'place-' + count + '-img');    
            else
                document.getElementById('place-' + count + '-img').src = places[key].photo;

        }

        else{
            document.getElementById('place-' + count).style.display = 'none';
        }
        
        count = count + 1;
    
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


function loadModalInMap(place_dict){
    $('.modal-title').text(place_dict['name']);

    if(place_dict['photo'] == null)
        loadImage(place_dict['place_id'], "info-modal-img");    
    else
        document.getElementById("info-modal-img").src = place_dict['photo'];


    
    $('#modal-info-city').text(place_dict['city']);
    $('#modal-info-addr').text(place_dict['address']);
    $('#modal-info-coord').text(place_dict['coordinates']);
    $('#modal-info-phone').text(place_dict['phone_number']);
    $('#modal-info-website').text(place_dict['website']);
    $('#modal-info-website').attr("href", place_dict['website']);

    $('#modal-info-number-plans').text(place_dict['no_plans']);
    $('#modal-info-duration').text(place_dict['duration']);
    $('#modal-info-price').text(place_dict['price']);

    loadRating(place_dict['rating'] ,"place-rating");
    loadRating(place_dict['accessibility'] ,"place-accessibility");
    loadRating(place_dict['security'] ,"place-security");

    var dest =  '/place?id=' + place_dict['id'] + '&plan=' + /id=([^&]+)/.exec(location.search)[1];
    $('#modal-find-more-btn').attr("onclick", "window.location.href = " + "'" + dest + "'");
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
        
        $('#modal-info-number-plans').text(place_info[id]['no_plans']);
        $('#modal-info-duration').text(place_info[id]['duration']);
        $('#modal-info-price').text(place_info[id]['price']);

        loadRating(place_info[id]['rating'] ,"place-rating");
        loadRating(place_info[id]['accessibility'] ,"place-accessibility");
        loadRating(place_info[id]['security'] ,"place-security");

        var dest =  '/place?id=' + place_info[id]['id'] + '&plan=' + /id=([^&]+)/.exec(location.search)[1];
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
    var plan_id = /id=([^&]+)/.exec(location.search)[1];

    var queryString = "?dest=" + city + "&plan=" + plan_id;
    window.location.href = "./places" + queryString;
}

function changeView(view){

    var url = window.location.href;

    if(/v=([^&]+)/.exec(window.location.search) != null){
        url = window.location.href.split('&v')[0];
    }

    if(view == 'normal'){
        window.location.href = url;
    }

    else if(view == 'full'){
        window.location.href = url + "&v=full";
    }

    else if(view == 'map'){
        window.location.href = url + "&v=map";
    }

}

function deleteVisit(poi_id){
    var user = getUserCookie();

    var plan_id = /id=([^&]+)/.exec(location.search)[1];

    if(user != null){
        $.post("/delete-visit", {plan: plan_id, user: user, poi: poi_id}, function(result){
      
            if(result.result == 'error'){
            }
            
            else{
              window.location.reload();
            }
      
        });
    }
}


function savePlan(){
    var user = getUserCookie();

    var plan_id = /id=([^&]+)/.exec(location.search)[1];

    if(user != null){
        $.post("/save-plan", {plan: plan_id, user: user}, function(result){
      
            if(result.result == 'error'){
            }
            
            else{
                window.location.href = "/plan?id=" + plan_id;
            }
      
        });
    
    }
}

$(function () {
    $('.btn-view-reviews-modal').on('click', function () {
        $('#modal-view-reviews-title').text($(this).data('title'));
        $('#view-reviews-title').text($(this).data('title'));
        $('#create-review-btn').data("title", $(this).data('title'));
    });
});

$(function () {
    $('.btn-create-review-modal').on('click', function () {

        $('#modal-review-title').text($(this).data('title'));
    });
  });



$(function () {
    $('.btn-stats-modal').on('click', function () {
        $('#modal-stats-title').text($(this).data('title'));
    });
});


$(function () {
    $('.btn-use-plan-modal').on('click', function () {
        $('#modal-use-plan-title').text($(this).data('title'));
    });
  });

$(function () {
    $('.btn-share-modal').on('click', function () {
        $('#share-modal-title').text($(this).data('name'));
        $('#are-you-sure-plan-name').text($(this).data('name'));

        $('#share-modal-plan-id').val($(this).data('id'));
        $('#share-modal-user').val(getUserCookie());

       // document.getElementById('confirm-public-btn').setAttribute( "onClick", "javascript: makePublic("+$(this).data('id')+");");

    });
});


$(function () {
    $("#arrival-date").datepicker({ 
        uiLibrary: 'bootstrap4',
        format: 'dd/mm/yyyy',
        minDate: new Date(),
    });

});


function usePlan(){
    var plan_id = /id=([^&]+)/.exec(location.search)[1];

    var start_date = $("#arrival-date").val();

    if(start_date == "")
        return;

    start_date = new Date(start_date.split('/')[2]+"/"+start_date.split('/')[1]+"/"+start_date.split('/')[0]);
    var end_date = new Date(start_date.getTime() + dif_days * 24 * 60 * 60 * 1000);

    start_date = start_date.getFullYear() + "/" + ((start_date.getMonth()+1).toString()<10?'0':'') + (start_date.getMonth()+1).toString() + "/" + (start_date.getDate()<10?'0':'') + start_date.getDate();
    end_date = end_date.getFullYear() + "/" + ((end_date.getMonth()+1).toString()<10?'0':'') + (end_date.getMonth()+1).toString() + "/" + (end_date.getDate()<10?'0':'') + end_date.getDate();

    $.post("/create-child-plan", {plan: plan_id, start_date: start_date, end_date: end_date}, function(result){
    
        if(result.result == 'error'){
        }
        
        else{
           window.location.href = "/plan?id=" + result.plan;
        }
    
    });
}


function getRatingValue(){
    var value = 0;
  
    if(document.getElementById('star5').checked)
      value = 5;
    else if(document.getElementById('star4').checked)
      value = 4;
    else if(document.getElementById('star3').checked)
      value = 3;
    else if(document.getElementById('star2').checked)
      value = 2;
    else if(document.getElementById('star1').checked)
      value = 1;
  
    return value;
  }


function submitReview(){
    var plan_id = /id=([^&]+)/.exec(location.search)[1];

    var review = document.getElementById("review-text").value;

    var rating = parseInt(getRatingValue());

    if(rating < 1 || rating > 5){
        alert("Please submit a valid rating  !!");
        return;
    }

    $.post("/review-plan", {plan: plan_id, review: review, rating: rating}, function(result){
        window.location.reload();
    });
}

function loadReviewRating(rating, review){
    rating = parseInt(rating);

    var count = 0;

    while(count < rating){
      document.getElementById(review).innerHTML += '<i class="fas fa-star" aria-hidden="true" style="color: #ffc107;"></i>';
      count = count + 1;
    }

    while(count < 5){
      document.getElementById(review).innerHTML += '<i class="fas fa-star" aria-hidden="true" style="color: #d0cfd1;"></i>';
      count = count + 1;
    }
}


$(function () {
    $('#submit-review-btn').attr('disabled','disabled');
    $('#star1').change(function(){
        var rating = parseInt(getRatingValue());
        if(rating > 0 && rating < 6){
            $('#submit-review-btn').removeAttr('disabled');
        }
    });

    $('#star2').change(function(){
        var rating = parseInt(getRatingValue());
        if(rating > 0 && rating < 6){
            $('#submit-review-btn').removeAttr('disabled');
        }
    });

    $('#star3').change(function(){
        var rating = parseInt(getRatingValue());
        if(rating > 0 && rating < 6){
            $('#submit-review-btn').removeAttr('disabled');
        }
    });

    $('#star4').change(function(){
        var rating = parseInt(getRatingValue());
        if(rating > 0 && rating < 6){
            $('#submit-review-btn').removeAttr('disabled');
        }
    });

    $('#star5').change(function(){
        var rating = parseInt(getRatingValue());
        if(rating > 0 && rating < 6){
            $('#submit-review-btn').removeAttr('disabled');
        }
    });
});


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

}

$(function () {
    $('.visit-loaded').delay(100).animate({ opacity: 1 }, 700);
});


function checkInterest(){
    var plan_id = /id=([^&]+)/.exec(location.search)[1];

    $.post("/user-interested", {plan: plan_id}, function(result){
        if(result.result == 'error'){
        }
        
        else{
            window.location.reload();
        }
    });
}

function uncheckInterest(){
    var plan_id = /id=([^&]+)/.exec(location.search)[1];

    $.post("/user-not-interested", {plan: plan_id}, function(result){
        if(result.result == 'error'){
        }
        
        else{
            window.location.reload();
        }
    });

}

function loadRating(rating, dest){

    rating = parseFloat(rating).toFixed(1);

    
    if(isNaN(rating)){
      document.getElementById(dest).innerHTML = "<p> No information available </p>";
      return;
    }

    var count = 0;

    document.getElementById(dest).innerHTML = '<p></p>';

    while(count < Math.floor(rating)){
      document.getElementById(dest).innerHTML += '<i class="fas fa-star" aria-hidden="true" style="color: #ffc107;"></i>';
      count = count + 1;
    }

    if(rating-count >= 0.5){
      document.getElementById(dest).innerHTML += '<i class="fas fa-star-half-alt" aria-hidden="true" style="color: #ffc107;"></i>';
      count = count + 1;
    }

    while(count < 5){
      document.getElementById(dest).innerHTML += '<i class="fas fa-star" aria-hidden="true" style="color: #d0cfd1;"></i>';
      count = count + 1;
    }

  }


 
