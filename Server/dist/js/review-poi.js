var map; 

/* load map with a marker in the coordinates submitted */
function initMap(latitude, longitude) {
    var position = {lat: parseFloat(latitude), lng: parseFloat(longitude)};

    map = new google.maps.Map(document.getElementById('map'), {
        center: position,
        zoom: 17,
        mapTypeId: 'satellite'
    });
    infoWindow = new google.maps.InfoWindow;

    var marker = new google.maps.Marker({position: position, map: map});

    loadNavbar();
}


$(function () {
    $('#btn-reject-modal').on('click', function () {
        $('#modal-reject-trip-title').text($(this).data('title'));
    });

    $('#btn-accept-modal').on('click', function () {
        $('#modal-accept-trip-title').text($(this).data('title'));
    });
});


function acceptPOI(){

}


function rejectPOI(){

}