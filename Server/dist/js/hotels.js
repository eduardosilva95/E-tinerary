var map;
var service;
var infowindow;

var markers = [];
var marker_list = [];

var hotels = {};


/* load map */
function initMap(latitude, longitude) {

    var position = {lat: parseFloat(latitude), lng: parseFloat(longitude)};

    map = new google.maps.Map(document.getElementById('map'), {
        center: position,
        zoom: 12,
    });

    // Style map
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

        for(var key in hotels){
            console.log(hotels);
            data = {color: '#ac48db', icon: 'fas fa-bed'};
            createMarker(hotels[key]['coordinates'], hotels[key]['name'], hotels[key]["price"]);
        }

        /* Markers clustering */
        var markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

    });

    infoWindow = new google.maps.InfoWindow;

    loadNavbar();

}


function createMarker(local, name, price){
    if(marker_list.includes(name))
      return;

    var coordinates = new google.maps.LatLng({lat: parseFloat(local.split(', ')[0]), lng: parseFloat(local.split(', ')[1])}); 
    
    var image = {
        url: '/img/map-marker-hotel.jpg',
        // This marker is 35 pixels wide by 35 pixels high.
        size: new google.maps.Size(67, 38),
        // The origin for this image is (0, 0).
        origin: new google.maps.Point(0, 0),
        // The anchor for this image is the base of the flagpole at (0, 32).
        anchor: new google.maps.Point(0, 35),
      };

    var marker = new google.maps.Marker({
    position: coordinates,
    map: map,
    title: name,
    draggable: true,
    icon: image,
    label: {
        text: price,
        color: 'white',
        fontSize: '15px',
        fontWeight: 'bold'
    }
    });


    marker.addListener('click', function () {
        loadModalInMap(hotels[this.title])
        $("#info-modal").modal();
      });
    
    marker.addListener('mouseover', function () {

    });
    
    markers.push(marker);
    marker_list.push(marker.title);
  }


function loadHotels(hotels_list){

    for(var i=0 ; i < hotels_list.length ; i++){

        hotel = JSON.parse(hotels_list[i]);

        hotels[hotel.name] = hotel;

        $("#hotel-" + i + "-link").attr("data-title", hotel.name);

        document.getElementById('hotel-' + i + '-name').innerText = hotel.name;
        document.getElementById('hotel-' + i + '-name').title = hotel.name;

        if(hotel.photo != null){
            document.getElementById('hotel-' + i + '-img').src = hotel.photo;
        }

        else{
            loadImage(hotel.place_id, 'hotel-' + i + '-img');
        }
        

        document.getElementById('hotel-' + i + '-price').innerText = hotel.price;

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
                document.getElementById(dest).src = "img/no-photo-found.png";

        }

        else{
            document.getElementById(dest).src = "img/no-photo-found.png";
        }
    });
}

function loadModalInMap(hotels_dict){
    $('.modal-title').text(hotels_dict['name']);

    if(hotels_dict['photo'] != null){
        document.getElementById("info-modal-img").src = hotels_dict['photo'];
    }

    else{
        loadImage(hotels_dict['place_id'], "info-modal-img");
    }    
    
    $('#modal-info-city').text(hotels_dict['city']);
    $('#modal-info-addr').text(hotels_dict['address']);
    $('#modal-info-coord').text(hotels_dict['coordinates']);
    $('#modal-info-phone').text(hotels_dict['phone_number']);
    $('#modal-info-website').text(hotels_dict['website']);
    $('#modal-info-website').attr("href", hotels_dict['website']);

    var dest =  '/place?id=' + hotels_dict['id'];
    $('#modal-find-more-btn').attr("onclick", "window.location.href = " + "'" + dest + "'");
}

$(function () {
    $('.hotel-link').on('click', function () {
        
        hotels_dict = hotels[$(this).data('title')];

        $('.modal-title').text(hotels_dict['name']);

        if(hotels_dict['photo'] != null){
            document.getElementById("info-modal-img").src = hotels_dict['photo'];
        }
    
        else{
            loadImage(hotels_dict['place_id'], "info-modal-img");
        }    
    
        $('#modal-info-city').text(hotels_dict['city']);
        $('#modal-info-addr').text(hotels_dict['address']);
        $('#modal-info-coord').text(hotels_dict['coordinates']);
        $('#modal-info-phone').text(hotels_dict['phone_number']);
        $('#modal-info-website').text(hotels_dict['website']);
        $('#modal-info-website').attr("href", hotels_dict['website']);

        var dest =  '/place?id=' + hotels_dict['id'];
        $('#modal-find-more-btn').attr("onclick", "window.location.href = " + "'" + dest + "'");
        
    });
});