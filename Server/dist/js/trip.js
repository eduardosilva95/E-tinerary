var map;
var service;
var infowindow;

/* variables to draw the itinerary */
var directionsService;
var directionsDisplay;

var trip;
var weekdays = [];
var shortdays = [];
var dif_days;
var trip_days = [];
var day; // index of the day displayed
var place_info = [];

var places = {}; // dictionary with all visits
var hotels = {}; // dictionary with all hotels already in the trip
var suggested_places = {}; // dictionary with all suggested places
var suggested_hotels = {}; // dictionary with all suggested hotels
var open_slots = {}; // dictionary with all open slots for a new trip or an edition of a existing one

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
    

    directionsDisplay.setOptions({
        polylineOptions: {
          strokeColor: '#5fcfe7'
        }
    });

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

        var count = 1;

        for(var key in places){
            if(places[key].day.replace(/\s/g, '') == trip_days[day].replace(/\s/g, '')){
                data = {color: visits_color, icon: getIcon(places[key]["poi_type"])};
                createMarker(places[key], data, "visits", 'green', count);
                count++;
            }
        }

        for(var key in hotels){
            if(hotels[key].day.replace(/\s/g, '') == trip_days[day].replace(/\s/g, '')){
                data = {color: visits_color, icon: getIcon(hotels[key]["poi_type"])};
                createMarker(hotels[key], data, "hotels", 'yellow', 'H');
            }
        }


        for(var key in suggested_places){
            data = {color: suggested_visits_color, icon: getIcon(suggested_places[key]["poi_type"])};
            createMarker(suggested_places[key], data, "suggestions", 'blue', 'I');
        }


        /* Markers clustering */
        markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

        loadItinerary();    

    });

    infoWindow = new google.maps.InfoWindow;
    loadNavbar();

    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    document.cookie = "trip=" + trip_id + ";path=" + href;

    hasMap = true;
}

function createMarker(place, data, type, color, position){
    // if place has already a marker in the map, ignore 
    if(markerList.includes(place["name"]))
      return;
    
    var coordinates = new google.maps.LatLng({lat: parseFloat(place["coordinates"].split(', ')[0]), lng: parseFloat(place["coordinates"].split(', ')[1])}); 
    
    marker = new Marker({
      position: coordinates,
      map: map,
      title: place["name"],
      icon: 'https://raw.githubusercontent.com/Concept211/Google-Maps-Markers/master/images/marker_' + color + position + '.png',
    });

    
    var contentString;


    if(type == "visits"){
        marker.addListener('click', function () {
            loadModalInMap(places[this.title]);
            $("#info-modal").modal();
            $("#add-visit-btn").css("display", "none");
        });

        contentString = '<div id="content">'+
        '<div id="siteNotice">'+
        '</div>'+
        '<h5 id="firstHeading" class="firstHeading">' + place["name"] + '</h5>'+
        '<div class="row" id="bodyContent">'+
        '<div class="col-md-4">' +
        '<img src="' + place["photo"] + '" style="height: 100%; width: 100%;">'+
        '</div>' +
        '<div class="col-md-8">' +
        '<p><i class="fas fa-calendar-alt"></i><span style="padding-left: 10px;"> Scheduled for ' + place["schedule"] + '</span></p>' + 
        '</div>' +
        '</div>' +
        '</div>';

        var infowindow = new google.maps.InfoWindow({
            content: contentString,
            maxWidth: 400,
            maxHeight: 100
        });

        marker.addListener('mouseover', function() {
            infowindow.open(map, this);
        });

        marker.addListener('mouseout', function() {
            infowindow.close();
        });
    
    }

    else if(type == "suggestions"){
        marker.addListener('click', function () {
            loadModalInMap(suggested_places[this.title]);
            $("#info-modal").modal();
            $("#add-visit-btn").css("display", "block");
        });

        contentString = '<div id="content">'+
        '<div id="siteNotice">'+
        '</div>'+
        '<h5 id="firstHeading" class="firstHeading">' + place["name"] + '</h5>'+
        '<div class="row" id="bodyContent">'+
        '<div class="col-md-4">' +
        '<img src="' + place["photo"] + '" style="height: 100%; width: 100%;">'+
        '</div>' +
        '<div class="col-md-8">' +
        '<p><i class="fas fa-calendar-alt"></i><span style="padding-left: 10px;"> Suggestion </span></p>' + 
        '</div>' +
        '</div>' +
        '</div>';

        var infowindow = new google.maps.InfoWindow({
            content: contentString,
            maxWidth: 400,
            maxHeight: 100
        });

        marker.addListener('mouseover', function() {
            infowindow.open(map, this);
        });

        marker.addListener('mouseout', function() {
            infowindow.close();
        });
    }

    else if(type == "hotels"){
        marker.addListener('click', function () {
            loadModalInMap(hotels[trip_days[day]]);
            $("#info-modal").modal();
            $("#add-visit-btn").css("display", "none");
        });

        contentString = '<div id="content">'+
        '<div id="siteNotice">'+
        '</div>'+
        '<h5 id="firstHeading" class="firstHeading">' + place["name"] + '</h5>'+
        '<div class="row" id="bodyContent">'+
        '<div class="col-md-4">' +
        '<img src="' + place["photo"] + '" style="height: 100%; width: 100%;">'+
        '</div>' +
        '<div class="col-md-8">' +
        '<p><i class="fas fa-calendar-alt"></i><span style="padding-left: 10px;"> Scheduled for arrival at ' + place["schedule"] + '</span></p>' + 
        '</div>' +
        '</div>' +
        '</div>';

        var infowindow = new google.maps.InfoWindow({
            content: contentString,
            maxWidth: 400,
            maxHeight: 100
        });

        marker.addListener('mouseover', function() {
            infowindow.open(map, this);
        });

        marker.addListener('mouseout', function() {
            infowindow.close();
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

    var count = 1;

    for(var key in places){
        if(places[key].day.replace(/\s/g, '') == trip_days[day].replace(/\s/g, '')){
            data = {color: visits_color, icon: getIcon(places[key]["poi_type"])};
            createMarker(places[key], data, "visits", 'green', count);
            count++;
        }
    }

    for(var key in hotels){
        if(hotels[key].day.replace(/\s/g, '') == trip_days[day].replace(/\s/g, '')){
            data = {color: visits_color, icon: getIcon(hotels[key]["poi_type"])};
            createMarker(hotels[key], data, "visits", 'yellow', 'H');
        }
    }

    for(var key in suggested_places){
        data = {color: suggested_visits_color, icon: getIcon(suggested_places[key]["poi_type"])};
        createMarker(suggested_places[key], data, "suggestions", 'blue', 'I');
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


function calcRoute(start, start_coord, end, end_coord, waypts) {

    var request = {
        waypoints: waypts, 
        travelMode: TRAVEL_MODE
    };

    if(start != undefined){
        request["origin"] = {placeId: start};
    }
    else{
        request["origin"] = start_coord;
    }

    if(end != undefined){
        request["destination"] = {placeId: end};
    }
    else{
        request["destination"] = end_coord;
    }

    
    directionsService.route(request, function(result, status) {
      if (status == 'OK') {
        loadTravelTimesAndDistances(result, start);

        if(hasMap)
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


function loadTrip(trip_array, hotels_array, days, days_shortname, travel_mode, openslots){
    TRAVEL_MODE = travel_mode;
    trip = trip_array;
    day = 0;
    days = days.split(',');
    days_shortname = days_shortname.split(',');

    dif_days = days.length / 2 - 1;

    for(var i=1; i < days.length ; i+=2){
        trip_days.push(days[i].substring(1));
    }

    for(var i=0; i < days.length ; i+=2){
        weekdays.push(days[i] + days[i+1]);
    }

    for(var j=0 ; j < trip.length ; j++){
        p = JSON.parse(trip[j]);
        places[p.name] = p;
    }

    for(var j=0 ; j < hotels_array.length ; j++){
        h = JSON.parse(hotels_array[j]);
        hotels[h.day] = h;
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

    if(!hasMap){
        directionsService = new google.maps.DirectionsService();
        loadItinerary();
    }

    openslots = JSON.parse(openslots);
  
    for(d in openslots){
      var list = [];
      for(var i=0; i < openslots[d].length ; i++){
        list.push(openslots[d][i]);
      }
      open_slots[d] = list;
    }

}


function loadItinerary(){
    var visits_tmp = [];
    var origin_coord, dest_coord;
    var dest_placeID;
    var hotel = null;

    for(var key in places){
        if(places[key].day.replace(/\s/g, '') == trip_days[day].replace(/\s/g, '')){
            visits_tmp.push(places[key]);
        }
    }

    for(var key in hotels){
        if(hotels[key].day.replace(/\s/g, '') == trip_days[day].replace(/\s/g, '')){
            hotel = hotels[key];
            break;
        }
    }

    var waypoints = [];
    var waypoints_size = visits_tmp.length;

    if(hotel == null)
        waypoints_size = visits_tmp.length-1;
    
    for(var i=1; i < waypoints_size; i++){
        if(visits_tmp[i].place_id != undefined)
            waypoints.push({ stopover: true, location: { placeId: visits_tmp[i].place_id } });
        else{
            var lat = visits_tmp[i].coordinates.split(', ')[0];
            var lng = visits_tmp[i].coordinates.split(', ')[1];
            waypoints.push({ stopover: true, location: new google.maps.LatLng(lat, lng)});
        }
    }

    origin_coord = new google.maps.LatLng(visits_tmp[0].coordinates.split(', ')[0], visits_tmp[0].coordinates.split(', ')[1]);

    if(hotel == null){
        dest_coord = new google.maps.LatLng(visits_tmp[visits_tmp.length-1].coordinates.split(', ')[0], visits_tmp[visits_tmp.length-1].coordinates.split(', ')[1]);
        dest_placeID = visits_tmp[visits_tmp.length-1].place_id;
    }

    else{
        dest_coord = new google.maps.LatLng(hotel.coordinates.split(', ')[0], hotel.coordinates.split(', ')[1]);
        dest_placeID = hotel.place_id;
    }
        

    calcRoute(visits_tmp[0].place_id, origin_coord, dest_placeID, dest_coord, waypoints);
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

        if(TRAVEL_MODE == 'WALKING'){
            document.getElementById("desloc-" + (start_index + i) + "-travel-mode").className = 'fas fa-walking';
        }

        else if(TRAVEL_MODE == 'BICYCLING'){
            document.getElementById("desloc-" + (start_index + i) + "-travel-mode").className = 'fas fa-bicycle';
        }

        else if(TRAVEL_MODE == 'TRANSIT'){
            document.getElementById("desloc-" + (start_index + i) + "-travel-mode").className = 'fas fa-bus';
        }


    }

    
}



function loadSuggestions(suggested_visits){
    console.log(suggested_visits);
    for(var j=0 ; j < suggested_visits.length ; j++){
        p = JSON.parse(suggested_visits[j]);

        suggested_places[p.name] = {'id': p.id, 'name': p.name, 'city': p.city, 'place_id': p.place_id, 'address': p.address, 'coordinates': p.coordinates, 'website': p.website, 'phone_number': p.phone_number, 'poi_type': p.poi_type};
    }
}

function loadHotels(suggested_hotels_arr){

    for(var j=0 ; j < suggested_hotels_arr.length ; j++){
        p = JSON.parse(JSON.stringify(suggested_hotels_arr[j]));

       suggested_hotels[p.name] = {'id': p.id, 'name': p.name, 'city': p.city, 'place_id': p.place_id, 'address': p.address, 'coordinates': p.coordinates, 'website': p.website, 'phone_number': p.phone_number, 'poi_type': p.poi_type};
    }
}


function loadBottomNavbar(){

    var start = new Date(trip_days[0]);
    var now = new Date();

    if(now >= start){
        $("#add-visit-div").css("display", "none");
        $("#save-trip-btn").css("display", "none");
        $("#are-you-sure-share-msg").css("display", "none");
        
    }
}


function nextDay(){
    if(day == trip_days.length){
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
    else
        loadItinerary();

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
    else
        loadItinerary();
}


function loadVisits(){
    document.getElementById('visit-day').innerText = weekdays[day];
    document.getElementById('visit-day-mobile').innerText = shortdays[day];

    var count = 0;

    /* load data from the visits */
    for(var key in places){
        if(places[key].day.replace(/\s/g, '') == trip_days[day].replace(/\s/g, '')){
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

    /* load data from the hotels */
    for(var key in hotels){
        if(hotels[key].day.replace(/\s/g, '') == trip_days[day].replace(/\s/g, '')){
            document.getElementById('place-' + count + '-name').innerText = hotels[key].name;
            document.getElementById('place-' + count + '-name').title = hotels[key].name;
            document.getElementById('place-' + count + '-type').innerText = hotels[key].poi_type;

            document.getElementById('place-' + count + '-arrival-hour').innerText = hotels[key].start_time;

            document.getElementById('place-' + count + '-type').innerHTML = '<i class="' + getIcon(hotels[key].poi_type) + '" aria-hidden="true" style="padding-right: 10px;"></i>' + hotels[key].poi_type;

            $("#place-" + count + "-remove").attr("data-poi", hotels[key].id);
            
            place_info[count] = hotels[key];

            document.getElementById('place-' + count).style.display = 'block';
            
            if(hotels[key].photo == null)
                loadImage(hotels[key].place_id, 'place-' + count + '-img');    
            else
                document.getElementById('place-' + count + '-img').src = hotels[key].photo;
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
                document.getElementById(dest).src = "img/no-photo-found.png";

        }

        else{
            document.getElementById(dest).src = "img/no-photo-found.png";
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

    $('#modal-info-number-trips').text(place_dict['no_trips']);
    $('#modal-info-duration').text(place_dict['duration']);
    $('#modal-info-price').text(place_dict['price']);

    loadRating(place_dict['rating'] ,"place-rating");
    loadRating(place_dict['accessibility'] ,"place-accessibility");
    loadRating(place_dict['security'] ,"place-security");

    var dest =  '/place?id=' + place_dict['id'] + '&trip=' + /id=([^&]+)/.exec(location.search)[1];
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

        $('#modal-delete-visit-name-title').text(place_info[id]['name']);

        document.getElementById('confirm-remove-btn').setAttribute( "onClick", "javascript: deleteVisit("+$(this).data('poi')+");" );

        
    });
});

$(function () {
    $('.btn-edit-modal').on('click', function () {
        var id = parseInt($(this).attr('id').replace('place-', '').replace('-edit', ''));

        $('#modal-title').text(place_info[id]['name']);

        console.log(place_info[id]);

        

    });
});


function addVisit(city){
    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    var queryString = "?dest=" + city + "&trip=" + trip_id;
    window.location.href = "./places" + queryString;
}

function changeView(view){

    var href = new URL(window.location.href);
    
    if(view == 'normal'){
        href.searchParams.delete('v');
    }

    else if(view == 'full'){
        href.searchParams.set('v', 'full');
    }

    else if(view == 'map'){
        href.searchParams.set('v', 'map');
    }

    window.location.href = href;

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


function saveTrip(){
    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    $.post("/save-trip", {trip: trip_id, user: user}, function(result){
    
        if(result.result == 'error'){
        }
        
        else{
            window.location.href = "/trip?id=" + trip_id;
        }
    
    });
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
    $('.btn-use-trip-modal').on('click', function () {
        $('#modal-use-trip-title').text($(this).data('title'));
    });
  });

$(function () {
    $('.btn-share-modal').on('click', function () {
        $('#share-modal-title').text($(this).data('name'));
        $('#are-you-sure-trip-name').text($(this).data('name'));

        var href = new URL(window.location.href);
        var trip_id = parseInt(href.searchParams.get('id'));

        $('#share-modal-trip-id').val(trip_id);
       
    });
});


$(function () {
    $("#arrival-date").datepicker({ 
        uiLibrary: 'bootstrap4',
        format: 'dd/mm/yyyy',
        minDate: new Date(),
    });

});


function useTrip(){
    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    var start_date = $("#arrival-date").val();

    if(start_date == "")
        return;

    start_date = new Date(start_date.split('/')[2]+"/"+start_date.split('/')[1]+"/"+start_date.split('/')[0]);
    var end_date = new Date(start_date.getTime() + dif_days * 24 * 60 * 60 * 1000);

    start_date = start_date.getFullYear() + "/" + ((start_date.getMonth()+1).toString()<10?'0':'') + (start_date.getMonth()+1).toString() + "/" + (start_date.getDate()<10?'0':'') + start_date.getDate();
    end_date = end_date.getFullYear() + "/" + ((end_date.getMonth()+1).toString()<10?'0':'') + (end_date.getMonth()+1).toString() + "/" + (end_date.getDate()<10?'0':'') + end_date.getDate();

    $.post("/create-child-trip", {trip: trip_id, start_date: start_date, end_date: end_date}, function(result){
    
        if(result.result == 'error'){
            $("#use-trip-error").css("display", "block");
            $("#use-trip-error").text(result.msg);
        }
        
        else{
           window.location.href = "/trip?id=" + result.trip;
        }
    
    });
}


function getRatingValue(element){
    var value = 0;
  
    if(document.getElementById(element + "-star5").checked)
      value = 5;
    else if(document.getElementById(element + "-star4").checked)
      value = 4;
    else if(document.getElementById(element + "-star3").checked)
      value = 3;
    else if(document.getElementById(element + "-star2").checked)
      value = 2;
    else if(document.getElementById(element + "-star1").checked)
      value = 1;
  
    return value;
  }


function submitReview(){
    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    var review = document.getElementById("review-text").value;

    var rating = parseInt(getRatingValue('review-rating'));

    var rating_access = parseInt(getRatingValue('review-rating-access'));
    var rating_security = parseInt(getRatingValue('review-rating-security'));
    var rating_price = parseInt(getRatingValue('review-rating-price'));

    if(rating < 1 || rating > 5){
        alert("Please submit a valid rating  !!");
        return;
    }

    $.post("/review-trip", {trip: trip_id, review: review, rating: rating, rating_access: rating_access, rating_security: rating_security, rating_price: rating_price}, function(result){
        if(result.result == 'error'){
            $("#review-error").css("display", "block");
            $("#review-error").text(result.msg);
        }
        
        else{
            window.location.reload();
        }
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
    $('#review-rating-star1').change(function(){
        var rating = parseInt(getRatingValue("review-rating"));
        if(rating > 0 && rating < 6){
            $('#submit-review-btn').removeAttr('disabled');
        }
    });

    $('#review-rating-star2').change(function(){
        var rating = parseInt(getRatingValue("review-rating"));
        if(rating > 0 && rating < 6){
            $('#submit-review-btn').removeAttr('disabled');
        }
    });

    $('#review-rating-star3').change(function(){
        var rating = parseInt(getRatingValue("review-rating"));
        if(rating > 0 && rating < 6){
            $('#submit-review-btn').removeAttr('disabled');
        }
    });

    $('#review-rating-star4').change(function(){
        var rating = parseInt(getRatingValue("review-rating"));
        if(rating > 0 && rating < 6){
            $('#submit-review-btn').removeAttr('disabled');
        }
    });

    $('#review-rating-star5').change(function(){
        var rating = parseInt(getRatingValue("review-rating"));
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

    else{
        return "fas fa-monument";
    }

}

$(function () {
    $('.visit-loaded').delay(100).animate({ opacity: 1 }, 700);
});


function checkInterest(){
    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    $.post("/user-interested", {trip: trip_id}, function(result){
        if(result.result == 'error'){
        }
        
        else{
            window.location.reload();
        }
    });
}

function uncheckInterest(){
    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    $.post("/user-not-interested", {trip: trip_id}, function(result){
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

    var data = '<p>';

    while(count < Math.floor(rating)){
      data += '<i class="fas fa-star" aria-hidden="true" style="color: #ffc107;"></i>';
      count = count + 1;
    }

    if(rating-count >= 0.5){
        data += '<i class="fas fa-star-half-alt" aria-hidden="true" style="color: #ffc107;"></i>';
      count = count + 1;
    }

    while(count < 5){
        data += '<i class="fas fa-star" aria-hidden="true" style="color: #d0cfd1;"></i>';
      count = count + 1;
    }

    data += '</p>'

    document.getElementById(dest).innerHTML = data;

  }


function changeSharePage(){
    $('#share-modal-general-info').removeClass('active');
    $('#pills-share-general-info-tab').removeClass('active');

    $('#share-modal-more-info').tab('show');
    $('#pills-share-more-info-tab').addClass('active');

    $('#change-share-page-btn').css("display", "none");
    $('#submit-share-trip-btn').css("display", "block");
    $('#return-share-page-btn').css("display", "block");

}

$(function () {
    $('#pills-share-general-info-tab').click(
      function(){ returnSharePage(); return false;})
});

function returnSharePage(){
    $('#share-modal-general-info').tab('show');
    $('#pills-share-general-info-tab').addClass('active');

    $('#share-modal-more-info').removeClass('active');
    $('#pills-share-more-info-tab').removeClass('active');

    $('#change-share-page-btn').css("display", "block");
    $('#submit-share-trip-btn').css("display", "none");
    $('#return-share-page-btn').css("display", "none");

}

$(function () {
    $('#pills-share-more-info-tab').click(
      function(){ changeSharePage(); return false;})
});



function changeReviewPage(){
    $('#review-modal-general-info').removeClass('active');
    $('#pills-review-general-info-tab').removeClass('active');

    $('#review-modal-more-info').tab('show');
    $('#pills-review-more-info-tab').addClass('active');

    $('#change-review-page-btn').css("display", "none");
    $('#submit-review-btn').css("display", "block");
    $('#return-review-page-btn').css("display", "block");

}

$(function () {
    $('#pills-review-general-info-tab').click(
      function(){ returnReviewPage(); return false;})
});

function returnReviewPage(){
    $('#review-modal-general-info').tab('show');
    $('#pills-review-general-info-tab').addClass('active');

    $('#review-modal-more-info').removeClass('active');
    $('#pills-review-more-info-tab').removeClass('active');

    $('#change-review-page-btn').css("display", "block");
    $('#submit-review-btn').css("display", "none");
    $('#return-review-page-btn').css("display", "none");

}

$(function () {
    $('#pills-review-more-info-tab').click(
      function(){ changeReviewPage(); return false;})
});


function loadStatsRatings(rating, accessibility_rating, security_rating, price_rating){
    loadRating(rating, 'trip-stats-rating');
    loadRating(accessibility_rating, 'trip-stats-access-rating');
    loadRating(security_rating, 'trip-stats-security-rating');
    loadRating(price_rating, 'trip-stats-price-rating');
}