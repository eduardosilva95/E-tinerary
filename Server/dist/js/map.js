var map;
var service;
var infowindow;

var plan;
var weekdays = [];
var plan_days = [];
var day;
var place_info = [];
var visits;

var places = {};
var suggested_places = {};
var hotels = {};

var markers = [];
var marker_list = [];

var visits_color = '#74bb82';
var suggested_visits_color = '#ac48db';
var hotels_color = '#2079d8';

var directionsService;
var directionsDisplay;

/* load map */
function initMap(city) {
    var coordinates;

    if(city == "Barcelona")
        city = "Barcelona, Spain";

    // show map in the city specified 
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'address': city
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            var Lat = results[0].geometry.location.lat();
            var Lng = results[0].geometry.location.lng();
            var coordinatesFromAddress = {
                zoom: 12,
                center: new google.maps.LatLng(Lat, Lng)
            };
            directionsService = new google.maps.DirectionsService();
            directionsDisplay = new google.maps.DirectionsRenderer();

            map = new google.maps.Map(document.getElementById('full-map'), coordinatesFromAddress);

            directionsDisplay.setMap(map);

            // Apply new JSON when the user chooses to hide/show features.
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
                    data = {color: visits_color, icon: getIcon(places[key]["poi_type"])};
                    createMarker(places[key]['coordinates'], places[key]['name'], data, "visits");
                }

                for(var key in suggested_places){
                    data = {color: suggested_visits_color, icon: getIcon(suggested_places[key]["poi_type"])};
                    createMarker(suggested_places[key]['coordinates'], suggested_places[key]['name'], data, "suggestions");
                }

                for(var key in hotels){
                    data = {color: hotels_color, icon: getIcon(hotels[key]["poi_type"])};
                    createMarker(hotels[key]['coordinates'], hotels[key]['name'], data, "hotels");
                }

            /* Markers clustering */
            var markerCluster = new MarkerClusterer(map, markers,
            {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

            });


            loadItinerary(visits, weekdays[day], plan_days[day]);

        } 

        else {
            alert("Something got wrong " + status);
        }
    });

    infoWindow = new google.maps.InfoWindow;

    loadNavbar();

}


function createMarker(local, name, data, type){
    if(marker_list.includes(name))
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
            viewPOI(places[this.title]);
            $("#add-remove-visit-btn").attr("class","btn btn-danger");
            $("#add-remove-visit-btn").html('<i class="fas fa-trash-alt"></i><span style="padding-left: 10px;">Remove from plan</span>');
        });
    }

    else if(type == "suggestions"){
        marker.addListener('click', function () {
            viewPOI(suggested_places[this.title]);
            $("#add-remove-visit-btn").attr("class","btn btn-success");
            $("#add-remove-visit-btn").html('<i class="fas fa-calendar-alt"></i><span style="padding-left: 10px;">Add to plan</span>');
        });
    }

    else if(type == "hotels"){
        marker.addListener('click', function () {
            viewPOI(hotels[this.title]);
            $("#add-remove-visit-btn").attr("class","btn btn-success");
            $("#add-remove-visit-btn").html('<i class="fas fa-calendar-alt"></i><span style="padding-left: 10px;">Book hotel</span>');
        });

    }

    
    markers.push(marker);
    marker_list.push(marker.title);
  }

function renderDirections(result) { 
    var directionsRenderer = new google.maps.DirectionsRenderer(); 
    directionsRenderer.setMap(map); 
    directionsRenderer.setDirections(result); 
}     


function calcRoute(start, end, waypts) {
    console.log("calcRoute " + start + end);

    var request = {
        origin: {
            placeId: start
        },
        destination: {
            placeId: end
        },     
        waypoints: waypts, 
        optimizeWaypoints: true,  
        travelMode: 'DRIVING'
    };

    console.log(request);
    
    directionsService.route(request, function(result, status) {
      if (status == 'OK') {
        console.log(result);
        directionsDisplay.setDirections(result);
      }
    });
  }





function loadPlan(plan_array, days){
    plan = plan_array;
    day = 0;
    days = days.split(',');

    for(var i=1; i < days.length ; i+=2){
        plan_days.push(days[i]);
    }

    for(var i=0; i < days.length ; i+=2){
        weekdays.push(days[i] + days[i+1]);
    }

    visits = [];
    for(var j=0 ; j < plan.length ; j++){
        p = JSON.parse(plan[j]);

        places[p.name] = {'id': p.id, 'name': p.name, 'city': p.city, 'place_id': p.place_id, 'address': p.address, 'coordinates': p.coordinates, 'website': p.website, 'phone_number': p.phone_number, 'poi_type': p.poi_type};

        if(p.day.replace(/\s/g, '') == plan_days[day].replace(/\s/g, '')){
            visits.push(p);
        }
    }

}


function loadItinerary(visits, day, checkDay){
    var visits_tmp = [];
    for(var i=0 ; i < visits.length; i++){
        if(visits[i].day.replace(/\s/g, '') == checkDay.replace(/\s/g, '')){
            
            visits_tmp.push(visits[i]);

        }

    }

    var waypoints = [];
    for(var i=1; i < visits_tmp.length - 1; i++){
        waypoints.push({ stopover: true, location: { placeId: visits[i].place_id } });
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

    document.getElementById("poi-info").style.visibility = 'visible';
    document.getElementById("poi-opening-hours").style.visibility = 'visible';
    document.getElementById("add-remove-visit-btn").style.visibility = 'visible';


    document.getElementById('poi-address').innerHTML = place_dict['address'];
    document.getElementById('poi-website').innerHTML = '<a class="poi-labels" href='+place_dict['website']+'>'+place_dict['website']+'</a>';
    document.getElementById('poi-phone-number').innerText = place_dict['phone_number'];


    var request = {
      placeId: place_dict["place_id"],
    };

    var service = new google.maps.places.PlacesService(map);

    service.getDetails(request, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        console.log(place);

        if(place.photos != undefined)
          document.getElementById('image_poi').src = place.photos[0].getUrl({'maxWidth': 300, 'maxHeight': 300});
        else
          document.getElementById('image_poi').src = "";

        createOpeningHoursTable(place.opening_hours.weekday_text);

        document.getElementById('poi-rating').innerText = place.rating + " / 5.0" ;

      }
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