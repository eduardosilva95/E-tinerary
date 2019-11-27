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
var hotels = {}; // dictionary with all suggested hotels

/* variables to store map markers and markers cluster */
var markers = [];
var markerList = [];
var markerCluster;

/* colors for differentes types of visits */
var visits_color = '#74bb82';
var suggested_visits_color = '#ac48db';
var hotels_color = '#2079d8';


/* load map */
function initMap(latitude, longitude) {

    var position = {lat: parseFloat(latitude), lng: parseFloat(longitude)};

    map = new google.maps.Map(document.getElementById('full-map'), {
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
            viewPOI(places[this.title], false);
            if($("#add-remove-visit-btn").length > 0){
                $("#add-remove-visit-btn").attr("class","btn btn-danger btn-remove-modal");
                $("#add-remove-visit-btn").attr("data-toggle","modal");
                $("#add-remove-visit-btn").attr("data-target","#remove-modal");
                $("#add-remove-visit-btn").attr("data-poi-id",places[this.title].id);
                $("#add-remove-visit-btn").attr("data-poi-name",this.title);
                $("#add-remove-visit-btn").html('<i class="fas fa-trash-alt"></i><span style="padding-left: 10px;">Remove from trip</span>');
                document.getElementById("add-remove-visit-btn").style.visibility = 'visible';
            }
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
            viewPOI(suggested_places[this.title], false);
            if($("#add-remove-visit-btn").length > 0){
                $("#add-remove-visit-btn").attr("class","btn btn-success");
                $("#add-remove-visit-btn").html('<i class="fas fa-calendar-alt"></i><span style="padding-left: 10px;">Add to trip</span>');
                document.getElementById("add-remove-visit-btn").style.visibility = 'visible';
            }
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
            viewPOI(hotels[trip_days[day]], true);
            if($("#add-remove-visit-btn").length > 0){
                $("#add-remove-visit-btn").attr("class","btn btn-danger btn-remove-modal");
                $("#add-remove-visit-btn").attr("data-toggle","modal");
                $("#add-remove-visit-btn").attr("data-target","#remove-modal");
                $("#add-remove-visit-btn").attr("data-poi-id",hotels[trip_days[day]].id);
                $("#add-remove-visit-btn").attr("data-poi-name",this.title);
                $("#add-remove-visit-btn").html('<i class="fas fa-trash-alt"></i><span style="padding-left: 10px;">Remove from trip</span>');
                document.getElementById("add-remove-visit-btn").style.visibility = 'visible';
            }
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
        directionsDisplay.setDirections(result);
        //animateItinerary(result);
      }
    });
  }


  /* function to show the itinerary being traversed */
  function animateItinerary (response){
    var path = response.routes[0].overview_path;
    var maxIter=path.length;

    /* if exists car markers in the map, remove them */
    for (var i = 0; i < carMarkerAnimation.length; i++) {
        carMarkerAnimation[i].setMap(null);
    }
    carMarkerAnimation = [];

    /* create car marker */
    carMarker=new google.maps.Marker({
       position: path[0],
       map: map, 
       icon: "img/car.png"
    });

    carMarkerAnimation.push(carMarker); 

    var delay = 20, count = 0;
    function delayed () {
      count += 1;
      carMarker.setPosition({lat:path[count].lat(),lng:path[count].lng()});
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


    directionsService = new google.maps.DirectionsService();
    loadItinerary();

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




function loadSuggestions(suggested_visits){

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

    updateMarkers();
}

function loadVisits(){
    document.getElementById('visit-day').innerText = weekdays[day];
    //document.getElementById('visit-day-mobile').innerText = shortdays[day];

}



function loadCityImage(city){
  var request = {
    query: city,
  };

  var service = new google.maps.places.PlacesService(document.createElement('places-map'));

  service.textSearch(request, function(results, status){
      if (status == google.maps.places.PlacesServiceStatus.OK) {
          var place = results[0];

          if(place.photos != undefined)
              document.getElementById("city-img").src =  place.photos[0].getUrl();
          else
              document.getElementById("city-img").src = "";
      }
    });
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


function viewPOI(place_dict, isHotel){

    $("#poi-info-table").children().remove();

    document.getElementById("change-day-div").style.display = "none";

    document.getElementById("sidebar-1").style.display = "none";
    document.getElementById("sidebar-2").style.display = "block";

    if($('#sidebar').attr("class") == 'active'){

        $('#sidebar').toggleClass('active');
        $('#full-map').toggleClass('active');
        $('#sidebarCollapse').toggleClass('active');
    }
    
    if($('#sidebar').children()[0].className == 'text-right' && $('#sidebar').className == 'active'){
        setTimeout(function(){
            $('#sidebar').children()[0].className = 'text-center';
        }, 600);
    }
    else{
        $('#sidebar').children()[0].className = 'text-right';
    }

    document.getElementById('poi-name').innerHTML = place_dict['name'];

    if(!isHotel)
        document.getElementById('visit-schedule').innerHTML = '<i class="fas fa-check-circle"></i>' + '<span style="padding-left: 5px;"> Scheduled for ' + place_dict['day'] + ' from ' + place_dict['start_time'] + ' to ' + place_dict['end_time'] + '</span>';

    else
        document.getElementById('visit-schedule').innerHTML = '<i class="fas fa-check-circle"></i>' + '<span style="padding-left: 5px;"> Arrived at the hotel scheduled for ' + place_dict['day'] + ' at ' + place_dict['start_time'] + '</span>';


    document.getElementById("poi-info").style.visibility = 'visible';
    document.getElementById("poi-opening-hours").style.visibility = 'visible';

    document.getElementById('poi-address').innerHTML = place_dict['address'];
    document.getElementById('poi-phone-number').innerText = place_dict['phone_number'];
    document.getElementById('poi-rating').innerText = place_dict['google_rating'];

    if(place_dict['website'] != "No information available")
        document.getElementById('poi-website').innerHTML = '<a class="poi-labels" href='+place_dict['website']+'>'+place_dict['website']+'</a>';
    else
    document.getElementById('poi-website').innerHTML = '<span class="poi-labels">'+place_dict['website']+'</span>';

    if(!isNaN(place_dict['google_rating']))
        document.getElementById('poi-rating').innerText += " / 5.0";

    if(place_dict['photo'] != null)
        document.getElementById('image_poi').src = place_dict['photo'];


    var request = {
      placeId: place_dict["place_id"],
    };

    var service = new google.maps.places.PlacesService(map);

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {

            if(place.opening_hours != null)
                createOpeningHoursTable(place.opening_hours.weekday_text);

            if(place_dict['photo'] == null && place.photos != undefined)
                document.getElementById('image_poi').src = place.photos[0].getUrl({'maxWidth': 300, 'maxHeight': 300});
            
            else if(place_dict['photo'] == null)
                document.getElementById('image_poi').src = "img/no-photo-found.png";
        }

        else if(place_dict['photo'] == null)
            document.getElementById('image_poi').src = "img/no-photo-found.png";

    });
}


  function createOpeningHoursTable(hours){
    var table = document.getElementById("table-opening-hours");
    
    table.innerHTML = "";

    for(var i=0; i < hours.length; i++){

        var weekday = hours[i].split(':')[0];
        var opening_hours = hours[i].substring(hours[i].indexOf(':')+1)

        var row = table.insertRow(-1);

        var cell1 = row.insertCell(0);
        cell1.innerText = weekday;

        var cell2 = row.insertCell(1);
        cell2.innerText = opening_hours;
    }

}






$(document).ready(function () {
  $('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
      $('#full-map').toggleClass('active');
      $(this).toggleClass('active');
    
    if($('#sidebar').children()[0].className == 'text-right'){
        setTimeout(function(){
            $('#sidebar').children()[0].className = 'text-center';
        }, 600);
    }
    else{
        $('#sidebar').children()[0].className = 'text-right';
    }

  });

});

function backtoTrip(){
  document.getElementById("change-day-div").style.display = "block";

  document.getElementById("sidebar-2").style.display = "none";
  document.getElementById("sidebar-1").style.display = "block";

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
    $('#add-remove-visit-btn').on('click', function () {

        if($(this).attr('class').includes('btn-remove-modal')){
            var id = $(this).data('poi-id');
            var name = $(this).data('poi-name');

            console.log(id, name);

            $('#modal-delete-visit-name-title').text(name);
            $('#modal-delete-visit-name').text(name);

            document.getElementById('confirm-remove-btn').setAttribute( "onClick", "javascript: deleteVisit("+ id +");" );
        }
    });
});


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
