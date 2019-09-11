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


/* load map */
function initMap(latitude, longitude) {

    var position = {lat: parseFloat(latitude), lng: parseFloat(longitude)};

    map = new google.maps.Map(document.getElementById('full-map'), {
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

        var count = 1;

        for(var key in places){
            if(places[key].day.replace(/\s/g, '') == trip_days[day].replace(/\s/g, '')){
                data = {color: visits_color, icon: getIcon(places[key]["poi_type"])};
                createMarker(places[key]['coordinates'], places[key]['name'], data, "visits", count);
                count++;
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

    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('id'));

    document.cookie = "trip=" + trip_id + ";path=" + href;
}


function createMarker(local, name, data, type, position){
    // if place has already a marker in the map, ignore 
    if(markerList.includes(name))
      return;
    
    var coordinates = new google.maps.LatLng({lat: parseFloat(local.split(', ')[0]), lng: parseFloat(local.split(', ')[1])}); 
    
    marker = new Marker({
      position: coordinates,
      map: map,
      title: name,
      icon: 'https://raw.githubusercontent.com/Concept211/Google-Maps-Markers/master/images/marker_green' + position + '.png',
    });


    if(type == "visits"){
        marker.addListener('click', function () {
            viewPOI(places[this.title]);
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
    }

    else if(type == "suggestions"){
        marker.addListener('click', function () {
            viewPOI(suggested_places[this.title]);
            if($("#add-remove-visit-btn").length > 0){
                $("#add-remove-visit-btn").attr("class","btn btn-success");
                $("#add-remove-visit-btn").html('<i class="fas fa-calendar-alt"></i><span style="padding-left: 10px;">Add to trip</span>');
                document.getElementById("add-remove-visit-btn").style.visibility = 'visible';
            }
        });
    }

    else if(type == "hotels"){
        marker.addListener('click', function () {
            viewPOI(hotels[this.title]);
            if($("#add-remove-visit-btn").length > 0){
                $("#add-remove-visit-btn").attr("class","btn btn-success");
                $("#add-remove-visit-btn").html('<i class="fas fa-calendar-alt"></i><span style="padding-left: 10px;">Book hotel</span>');
                document.getElementById("add-remove-visit-btn").style.visibility = 'visible';
            }
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
            createMarker(places[key]['coordinates'], places[key]['name'], data, "visits", count);
            count++;
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

function loadTrip(trip_array, days, days_shortname, travel_mode){
    TRAVEL_MODE = travel_mode;
    trip = trip_array;
    day = 0;
    days = days.split(',');
    days_shortname = days_shortname.split(',');

    dif_days = days.length / 2 - 1;

    for(var i=1; i < days.length ; i+=2){
        trip_days.push(days[i]);
    }

    for(var i=0; i < days.length ; i+=2){
        weekdays.push(days[i] + days[i+1]);
    }

    for(var j=0 ; j < trip.length ; j++){
        p = JSON.parse(trip[j]);
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

}


function loadItinerary(){
    var visits_tmp = [];

    for(var key in places){
        if(places[key].day.replace(/\s/g, '') == trip_days[day].replace(/\s/g, '')){
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


function viewPOI(place_dict){

    console.log(place_dict);

    $("#poi-info-table").children().remove();

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

    document.getElementById('visit-schedule').innerHTML = '<i class="fas fa-check-circle"></i>' + '<span style="padding-left: 5px;"> Scheduled for ' + place_dict['day'] + ' from ' + place_dict['start_time'] + ' to ' + place_dict['end_time'] + '</span>';

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

function backToPlan(){
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
