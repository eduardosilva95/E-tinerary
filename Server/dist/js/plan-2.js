var map;
var service;
var infowindow;

var plan;
var weekdays = [];
var plan_days = [];
var day;


function initMap(city) {
    var coordinates;

    //var city = 'Aveiro';

    var request = {
        query: city,
    };

    // show map in the city specified 
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'address': city
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
        var Lat = results[0].geometry.location.lat();
        var Lng = results[0].geometry.location.lng();
        var coordinatesFromAddress = {
            zoom: 13,
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
        } 

        else {
        alert("Something got wrong " + status);
        }
    });

    infoWindow = new google.maps.InfoWindow;

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

    console.log(day);

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
        document.getElementById('place-' + i + '-weather').innerText = visits[i].weather;
        loadImage(visits[i].place_id, 'place-' + i + '-img');
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


            //console.log(place.opening_hours);
        }
    });


}


$(function () {
    $('.btn-info-modal').on('click', function () {
        $('.modal-title').text($(this).data('title'));

        console.log($(this));

        var request = { 
            placeId: $(this).data('place_id'),
        };
      
        var service = new google.maps.places.PlacesService(document.createElement('places-map'));
    
        service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
    
            if(place.photos != undefined)
            document.getElementById("info-modal-img").src = place.photos[0].getUrl();
            else
            document.getElementById("info-modal-img").src = "";
    
    
            //console.log(place.opening_hours);
        }
        });
        
        $('#modal-info-city').text($(this).data('city'));
        $('#modal-info-addr').text($(this).data('addr'));
        $('#modal-info-coord').text($(this).data('coord'));
        $('#modal-info-phone').text($(this).data('phone'));
        $('#modal-info-website').text($(this).data('website'));
        $('#modal-info-website').attr("href", $(this).data('website'));
    

    });
});

/*
function loadPlanDay(days){
    days = days.split(',');

    for(var i=1; i < days.length / 2 ; i++){
        document.getElementById('plan-day-' + i).style.display = "none";    
        document.getElementById('plan-day-' + i).children.style.display = "none";
    }


}*/