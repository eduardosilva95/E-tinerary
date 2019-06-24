//Set up some of our variables.
var map; //Will contain map object.

/* load map */
function initMap(latitude, longitude) {
    var position = {lat: parseFloat(latitude), lng: parseFloat(longitude)};

    console.log(position);

    map = new google.maps.Map(document.getElementById('map'), {
        center: position,
        zoom: 17,
        mapTypeId: 'satellite'
    });
    infoWindow = new google.maps.InfoWindow;

    var marker = new google.maps.Marker({position: position, map: map});

    loadNavbar();
}