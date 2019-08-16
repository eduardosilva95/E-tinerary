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
    var poi_id = /id=([^&]+)/.exec(location.search)[1];
    var place_id = $("#input-google-place-id").val();
    var google_rating = $("#input-google-rating").val();
    var google_num_reviews = $("#input-google-reviews").val();
    var description = $("#input-description").val();
    var website = $("#input-website").val();
    var phone_number = $("#input-phone-number").val();

    $.post("/accept-poi", {poi: poi_id, google_place_id: place_id, google_rating: google_rating, google_reviews: google_num_reviews,description: description, website: website, phone_number: phone_number });
}


function rejectPOI(){

}