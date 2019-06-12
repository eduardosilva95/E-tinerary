var map;
var service;
var infowindow;

var plan;
var weekdays = [];
var dif_days;
var plan_days = [];
var day;
var place_info = [];

var places = {};
var suggested_places = {};
var hotels = {};

var markers = [];
var marker_list = [];

var visits_color = '#74bb82';
var suggested_visits_color = '#ac48db';
var hotels_color = '#2079d8';


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
        } 

        else {
            alert("Something got wrong " + status);
        }
    });

    infoWindow = new google.maps.InfoWindow;
    loadNavbar();

    var myPath = window.location.href;
    var plan_id = /id=([^&]+)/.exec(location.search)[1];

    document.cookie = "plan=" + plan_id + ";path=" + myPath;
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
    marker_list.push(marker.title);
  }



function loadPlan(plan_array, days){
    plan = plan_array;
    day = 0;
    days = days.split(',');

    dif_days = days.length / 2 - 1;

    for(var i=1; i < days.length ; i+=2){
        plan_days.push(days[i]);
    }

    for(var i=0; i < days.length ; i+=2){
        weekdays.push(days[i] + days[i+1]);
    }

    var visits = [];

    for(var j=0 ; j < plan.length ; j++){
        p = JSON.parse(plan[j]);

        places[p.name] = {'id': p.id, 'name': p.name, 'city': p.city, 'place_id': p.place_id, 'address': p.address, 'coordinates': p.coordinates, 'website': p.website, 'phone_number': p.phone_number, 'poi_type': p.poi_type};

        visits.push(p); 
    }

    loadVisits(visits, weekdays[day], plan_days[day]);

    document.getElementById('previous-day-btn').disabled = true;

    if(day + 1 >= weekdays.length){
        document.getElementById('next-day-btn').disabled = true;
    }

    loadBottomNavbar();

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

    console.log(start_date, end_date);

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
    console.log(rating,review);

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