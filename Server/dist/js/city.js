
var slideIndex = 1;

$(window).on('load', function() {
    var coordinates = document.getElementById("city-coordinates").innerText;

    var lat = coordinates.split(',')[0];
    var lon = coordinates.split(',')[1];

    var place = document.getElementById("city-name").innerText;
  
    mapboxgl.accessToken = 'pk.eyJ1IjoiZWR1ZmNwOTUiLCJhIjoiY2p0ZnFrYjhvMW1vYjN6dGZlczMwYWlzNiJ9.GSWPFYjoMMJp5_GAmA2lUQ';
    var map = new mapboxgl.Map({
        container: 'place-map',
        style: 'mapbox://styles/mapbox/streets-v9',
        center: [lon, lat],
        zoom: 14
    });
                  
    map.on('load', function () {
        map.addLayer({
            "id": "points",
            "type": "symbol",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [lon, lat]
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
                      
        var popup = new mapboxgl.Popup({closeOnClick: false})
            .setLngLat([lon, lat])
            .setHTML('<h6>' + place + '</h6>')
            .addTo(map);
    });
  
});

function getCityDetails(place_id){

    var request = {
      placeId: place_id,
      fields: ["photos"]
    };


    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
        
            if(place.photos != undefined){
                for(var i=0; i<place.photos.length;i++){

                    var img_div = document.createElement("DIV");
                    img_div.className = "mySlides slideshow-fade";

                    var img = document.createElement("IMG");
                    img.src = place.photos[i].getUrl();
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
        
        }

    });

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
          
          }
  
      });
  

}