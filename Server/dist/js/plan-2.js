var map;
var service;
var infowindow;

var plan;
var weekdays = [];
var plan_days = [];
var day;
var place_info = [];

var places = {};

var markers = [];
var marker_list = [];

var colors = ['#ac48db', '#74bb82', '#f7c12e', '#ea7419']


/* load map */
function initMap(city) {
    var coordinates;

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

            map = new google.maps.Map(document.getElementById('map'), coordinatesFromAddress);

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
                    data = {color: '#ac48db', icon: 'fas fa-monument'};
                    createMarker(places[key]['coordinates'], places[key]['name'], data);
                }

            /* Markers clustering */
            var markerCluster = new MarkerClusterer(map, markers,
            {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

            });
        } 

        else {
            alert("Something got wrong " + status);
        }
    });

    infoWindow = new google.maps.InfoWindow;

}


function createMarker(local, name, data){
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

    marker.addListener('click', function () {
        loadModalInMap(places[this.title])
        $("#info-modal").modal();
      });
      
    
    markers.push(marker);
    marker_list.push(marker.title);
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

    var visits = [];
    for(var j=0 ; j < plan.length ; j++){
        p = JSON.parse(plan[j]);

        places[p.name] = {'name': p.name, 'city': p.city, 'place_id': p.place_id, 'address': p.address, 'coordinates': p.coordinates, 'website': p.website, 'phone_number': p.phone_number};

        if(p.day.replace(/\s/g, '') == plan_days[day].replace(/\s/g, '')){
            visits.push(p);
        }
    }

    loadVisits(visits, weekdays[day]);
}


function nextDay(){
    if(day == plan_days.length){
        return;
    }
    day = day + 1;

    var visits = [];
    for(var j=0 ; j < plan.length ; j++){
        p = JSON.parse(plan[j]);

        if(p.day.replace(/\s/g, '') == plan_days[day].replace(/\s/g, '')){
            visits.push(p);
        }
    }

    loadVisits(visits, weekdays[day]);
}

function previousDay(){
    if(day == 0){
        return;
    }
    day = day - 1;

    var visits = [];
    for(var j=0 ; j < plan.length ; j++){
        p = JSON.parse(plan[j]);

        if(p.day.replace(/\s/g, '') == plan_days[day].replace(/\s/g, '')){
            visits.push(p);
        }
    }

    loadVisits(visits, weekdays[day]);
}


function loadVisits(visits, day){
    document.getElementById('visit-day').innerText = day;
    for(var i=0 ; i < visits.length ; i++){
        document.getElementById('place-' + i + '-name').innerText = visits[i].name;
        document.getElementById('place-' + i + '-type').innerText = visits[i].poi_type;
        document.getElementById('place-' + i + '-hours').innerText = visits[i].start_time + ' - ' + visits[i].end_time;

        if(visits[i].weather == 'Sunny'){
            document.getElementById('place-' + i + '-weather').innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>' + visits[i].weather;
        }

        else if(visits[i].weather == 'Rainy'){
            document.getElementById('place-' + i + '-weather').innerHTML = '<i class="fas fa-cloud-rain" aria-hidden="true"></i>' + visits[i].weather;
        }

        else if(visits[i].weather == 'Cloudy'){
            document.getElementById('place-' + i + '-weather').innerHTML = '<i class="fas fa-cloud" aria-hidden="true"></i>' + visits[i].weather;
        }


        
        loadImage(visits[i].place_id, 'place-' + i + '-img');

        place_info[i] = {'name': visits[i].name, 'city': visits[i].city, 'place_id': visits[i].place_id, 'address': visits[i].address, 'coordinates': visits[i].coordinates, 'website': visits[i].website, 'phone_number': visits[i].phone_number}
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

    var request = { 
        placeId: place_dict['place_id'],
    };
    
    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {

        if(place.photos != undefined)
        document.getElementById("info-modal-img").src = place.photos[0].getUrl();
        else
        document.getElementById("info-modal-img").src = "";

    }
    });
    
    $('#modal-info-city').text(place_dict['city']);
    $('#modal-info-addr').text(place_dict['address']);
    $('#modal-info-coord').text(place_dict['coordinates']);
    $('#modal-info-phone').text(place_dict['phone_number']);
    $('#modal-info-website').text(place_dict['website']);
    $('#modal-info-website').attr("href", place_dict['website']);
}


$(function () {
    $('.btn-info-modal').on('click', function () {
        var id = parseInt($(this).attr('id').replace('place-', '').replace('-info', ''));

        $('.modal-title').text(place_info[id]['name']);

        var request = { 
            placeId: place_info[id]['place_id'],
        };
      
        var service = new google.maps.places.PlacesService(document.createElement('places-map'));
    
        service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
    
            if(place.photos != undefined)
            document.getElementById("info-modal-img").src = place.photos[0].getUrl();
            else
            document.getElementById("info-modal-img").src = "";

        }
        });
        
        $('#modal-info-city').text(place_info[id]['city']);
        $('#modal-info-addr').text(place_info[id]['address']);
        $('#modal-info-coord').text(place_info[id]['coordinates']);
        $('#modal-info-phone').text(place_info[id]['phone_number']);
        $('#modal-info-website').text(place_info[id]['website']);
        $('#modal-info-website').attr("href", place_info[id]['website']);
    });
});


$(function () {
    $('.btn-remove-modal').on('click', function () {
        var id = parseInt($(this).attr('id').replace('place-', '').replace('-remove', ''));

        $('#modal-delete-visit-name').text(place_info[id]['name']);

        
    });
});

$(function () {
    $('.btn-edit-modal').on('click', function () {
        var id = parseInt($(this).attr('id').replace('place-', '').replace('-edit', ''));

        $('#modal-title').text(place_info[id]['name']);

       // $('#modal-edit-visit-name').text(place_info[id]['name']);

        
    });
});


function addVisit(city){
    var plan_id = /id=([^&]+)/.exec(location.search)[1]

    var queryString = "?dest=" + city + "&plan=" + plan_id;
    window.location.href = "./places" + queryString;
}