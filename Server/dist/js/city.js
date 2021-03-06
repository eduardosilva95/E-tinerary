
var slideIndex = 1;

var places_list = [];
var photos_list = [];

var city_utc_offset = 0;

$(window).on('load', function() {
    var coordinates = document.getElementById("city-coordinates").innerText;

    var lat = coordinates.split(',')[0];
    var lon = coordinates.split(',')[1];
  
    mapboxgl.accessToken = 'pk.eyJ1IjoiZWR1ZmNwOTUiLCJhIjoiY2p0ZnFrYjhvMW1vYjN6dGZlczMwYWlzNiJ9.GSWPFYjoMMJp5_GAmA2lUQ';
    var map = new mapboxgl.Map({
        container: 'place-map',
        style: 'mapbox://styles/mapbox/streets-v9',
        center: [lon, lat],
        zoom: 14
    });
                  
    map.on('load', function () {
        for(var i=0; i<places_list.length; i++){
            map.addLayer({
                "id": places_list[i].name,
                "type": "symbol",
                "source": {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": [{
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [places_list[i].coordinates.split(', ')[1], places_list[i].coordinates.split(', ')[0]]
                            },
                            "properties": {
                                "icon": "monument"
                            }
                        }]
                    }
                },
                "layout": {
                    "icon-image": "{icon}-15",
                    "icon-size": 1.5,
                    "icon-allow-overlap": true
                }
            });

            var popup = new mapboxgl.Popup()
                .setLngLat([places_list[i].coordinates.split(', ')[1], places_list[i].coordinates.split(', ')[0]])
                .setHTML('<h6>' + places_list[i].name + '</h6>')
                .addTo(map);
        }  
        
        
    });
});



function getPlaceID(){
    var href = new URL(window.location.href);
    var city = href.searchParams.get('name');

    var request = {
        query: city
    };
    
    var service = new google.maps.places.PlacesService(document.createElement('places-map-2'));
    
    service.textSearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            $.post("/update-city-place-id", {city: city, place_id: results[0].place_id}, function(result){
                if(result.result){
                    window.location.reload();
                }
            });
        }
    });

}



function getCityDetails(place_id){

    if(place_id == ''){
        getPlaceID();
        return;
    }

    var request = {
      placeId: place_id,
      fields: ["photos", "utc_offset"]
    };
    
    var merge_photos = photos_list;

    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            if(place.photos != undefined && merge_photos.length < 10){
                var num_photos_from_google_required = 10-merge_photos.length;
                var google_photos = place.photos.slice(0,num_photos_from_google_required);
                merge_photos = merge_photos.concat(google_photos);
                showPhotos(merge_photos);
            }

            else{
                showPhotos(merge_photos);
            }

            if(place.utc_offset != null){
                city_utc_offset = place.utc_offset;
                var current_date = getDateWithUTCOffset(city_utc_offset);
                $("#city-time").html(current_date.getHours() + ":" + current_date.getMinutes());
            }
        }

        else{
            showPhotos(merge_photos);
        }
    });
}

function showPhotos(merge_photos){
    for(var i=0; i<merge_photos.length;i++){

        var img_div = document.createElement("DIV");
        img_div.className = "mySlides slideshow-fade";

        var img = document.createElement("IMG");

        if(i >= photos_list.length){
            img.src = merge_photos[i].getUrl();
        }

        else{
            img.src = merge_photos[i].replace(/"/g,"");
        }

        img.style.width = "100%";

        img_div.appendChild(img);

        document.getElementById("slideshow-div").appendChild(img_div);

        var dot = document.createElement("SPAN");
        dot.className = "dot";
        dot.setAttribute( "onClick", "javascript: currentSlide(" + (i+1) + ");" );

        document.getElementById("dots-div").appendChild(dot);

    }
    
    showSlides(slideIndex);
}



  
// Next/previous controls
function plusSlides(n) {
    showSlides(slideIndex += n);
  }
  
  // Thumbnail image controls
  function currentSlide(n) {
    showSlides(slideIndex = n);
  }
  
  function showSlides(n) {
    var i;
    var slides = document.getElementsByClassName("mySlides");
    var dots = document.getElementsByClassName("dot");
  
    if (n > slides.length) {slideIndex = 1} 
    if (n < 1) {slideIndex = slides.length}
  
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none"; 
    }
  
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" slideshow-active", "");
    }

    slides[slideIndex-1].style.display = "block"; 
    dots[slideIndex-1].className += " slideshow-active";
  }
  

function loadPhoto(place_id, dest){

    var request = {
        placeId: place_id,
        fields: ["photos"]
    };
  
      var service = new google.maps.places.PlacesService(document.createElement('places-map'));
  
      service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          
              if(place.photos != undefined){
                  document.getElementById(dest).src = place.photos[0].getUrl();
              }

              else
                document.getElementById(dest).src = "img/no-photo-found.png";

        }

        else{
            document.getElementById(dest).src = "img/no-photo-found.png";
            //setTimeout(loadPhoto(place_id, dest), 1000); // check again in a second
        }
          
  
      });
  

}

function loadPlacesToMap(places){

    for(var j=0 ; j < places.length ; j++){
        p = JSON.parse(places[j]);
        places_list.push(p);
    }

}


function loadPhotos(photos){
    for(var i=0; i<photos.length;i++){
       photos_list.push(photos[i]);
    }
 }


 /* code from https://stackoverflow.com/questions/37398871/javascript-get-current-date-using-utc-offset */
 function getDateWithUTCOffset(inputTzOffset ){
    var now = new Date(); // get the current time

    var currentTzOffset = -now.getTimezoneOffset() / 60 // in hours, i.e. -4 in NY
    var deltaTzOffset = inputTzOffset / 60 - currentTzOffset; // timezone diff

    var nowTimestamp = now.getTime(); // get the number of milliseconds since unix epoch 
    var deltaTzOffsetMilli = deltaTzOffset * 1000 * 60 * 60; // convert hours to milliseconds (tzOffsetMilli*1000*60*60)
    var outputDate = new Date(nowTimestamp + deltaTzOffsetMilli) // your new Date object with the timezone offset applied.

    return outputDate;
}


function updateTime()
{
    var current_date = getDateWithUTCOffset(city_utc_offset);
    $("#city-time").html((current_date.getHours()<10?'0':'') + current_date.getHours() + ":" + (current_date.getMinutes()<10?'0':'') + current_date.getMinutes());
}

$(function (){
    t = setInterval(updateTime,1000);
});