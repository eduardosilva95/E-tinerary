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

    loadNavbar();

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

        places[p.name] = {'id': p.id, 'name': p.name, 'city': p.city, 'place_id': p.place_id, 'address': p.address, 'coordinates': p.coordinates, 'website': p.website, 'phone_number': p.phone_number};

        visits.push(p); 
    }

    loadVisits(visits, weekdays[day], plan_days[day]);

    document.getElementById('previous-day-btn').disabled = true;

    if(day + 1 >= weekdays.length){
        document.getElementById('next-day-btn').disabled = true;
    }


}


function nextDay(){
    if(day == plan_days.length){
        return;
    }
    day = day + 1;

    var visits = [];
    for(var j=0 ; j < plan.length ; j++){
        p = JSON.parse(plan[j]);

        visits.push(p);
    }
    
    document.getElementById('visit-day').innerText = weekdays[day];

    for(var i=0 ; i < visits.length ; i++){
        if(visits[i].day.replace(/\s/g, '') == plan_days[day].replace(/\s/g, '')){
            document.getElementById('place-' + i).style.display = 'block';
            loadImage(visits[i].place_id, 'place-' + i + '-img');

        }
        else{
            document.getElementById('place-' + i).style.display = 'none';
        }
    }

    document.getElementById('previous-day-btn').disabled = false;

    if(day + 1 >= weekdays.length){
        document.getElementById('next-day-btn').disabled = true;
    }

}

function previousDay(){
    if(day == 0){
        return;
    }
    day = day - 1;

    var visits = [];
    for(var j=0 ; j < plan.length ; j++){
        p = JSON.parse(plan[j]);

        visits.push(p);
    }
    
    document.getElementById('visit-day').innerText = weekdays[day];

    for(var i=0 ; i < visits.length ; i++){
        if(visits[i].day.replace(/\s/g, '') == plan_days[day].replace(/\s/g, '')){
            document.getElementById('place-' + i).style.display = 'block';
            loadImage(visits[i].place_id, 'place-' + i + '-img');
        }
        else{
            document.getElementById('place-' + i).style.display = 'none';
        }
    }

    document.getElementById('next-day-btn').disabled = false;

    if(day - 1 < 0){
        document.getElementById('previous-day-btn').disabled = true;
    }

}


function loadVisits(visits, day, checkDay){
    document.getElementById('visit-day').innerText = day;
    for(var i=0 ; i < visits.length ; i++){
        document.getElementById('place-' + i + '-name').innerText = visits[i].name;
        document.getElementById('place-' + i + '-type').innerText = visits[i].poi_type;
        document.getElementById('place-' + i + '-hours').innerText = visits[i].start_time + ' - ' + visits[i].end_time;

        if(visits[i].weather == 'Sunny'){
            document.getElementById('place-' + i + '-weather').innerHTML = '<i class="fas fa-sun" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].weather;
        }

        else if(visits[i].weather == 'Rainy'){
            document.getElementById('place-' + i + '-weather').innerHTML = '<i class="fas fa-cloud-rain" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].weather;
        }

        else if(visits[i].weather == 'Cloudy'){
            document.getElementById('place-' + i + '-weather').innerHTML = '<i class="fas fa-cloud" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].weather;
        }

        if(visits[i].poi_type == 'Park'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-tree" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if(visits[i].poi_type == 'Castle'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-chess-rook" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Tower' || visits[i].poi_type == 'Museum'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-archway" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Church'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-church" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Restaurant'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-utensils" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Hotel'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-bed" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Natural Feature'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-umbrella-beach" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Aquarium'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-fish" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Zoo'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-hippo" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Place of Worship'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-place-of-worship" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Amusement Park'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-child" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Stadium'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-futbol" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }
    
        else if (visits[i].poi_type == 'Train Station'){
            document.getElementById('place-' + i + '-type').innerHTML = '<i class="fas fa-train" aria-hidden="true" style="padding-right: 10px;"></i>' + visits[i].poi_type;
        }

        $("#place-" + i + "-remove").attr("data-poi", visits[i].id);
        
        place_info[i] = {'id': visits[i].id, 'name': visits[i].name, 'city': visits[i].city, 'place_id': visits[i].place_id, 'address': visits[i].address, 'coordinates': visits[i].coordinates, 'website': visits[i].website, 'phone_number': visits[i].phone_number}
        
        if(visits[i].day.replace(/\s/g, '') == checkDay.replace(/\s/g, '')){
            document.getElementById('place-' + i).style.display = 'block';
            loadImage(visits[i].place_id, 'place-' + i + '-img');
        }
        else{
            document.getElementById('place-' + i).style.display = 'none';
        }
    
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

    loadImage(place_dict['place_id'], "info-modal-img");

    
    $('#modal-info-city').text(place_dict['city']);
    $('#modal-info-addr').text(place_dict['address']);
    $('#modal-info-coord').text(place_dict['coordinates']);
    $('#modal-info-phone').text(place_dict['phone_number']);
    $('#modal-info-website').text(place_dict['website']);
    $('#modal-info-website').attr("href", place_dict['website']);

    var dest =  '/place?id=' + place_dict['id'] + '&plan=' + /id=([^&]+)/.exec(location.search)[1];
    $('#modal-find-more-btn').attr("onclick", "window.location.href = " + "'" + dest + "'");
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

       // $('#modal-edit-visit-name').text(place_info[id]['name']);

        
    });
});


function addVisit(city){
    var plan_id = /id=([^&]+)/.exec(location.search)[1]

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