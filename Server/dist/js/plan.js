function loadIcon(place, poi_type){
    var place_icon = 'visit-' +  place + "-icon";
  
    if(poi_type == 'Park'){
      document.getElementById(place_icon).className = "fas fa-tree";
    }
  
    else if(poi_type == 'Castle'){
      document.getElementById(place_icon).className = "fas fa-chess-rook";
    }
  
    else if (poi_type == 'Tower' || poi_type == 'Museum'){
      document.getElementById(place_icon).className = "fas fa-archway";
    }
  
    else if (poi_type == 'Church'){
      document.getElementById(place_icon).className = "fas fa-church";
    }
  
    else if (poi_type == 'Restaurant'){
      document.getElementById(place_icon).className = "fas fa-utensils";
    }
  
    else if (poi_type == 'Hotel'){
      document.getElementById(place_icon).className = "fas fa-bed";
    }
  
    else if (poi_type == 'Natural Feature'){
      document.getElementById(place_icon).className = "fas fa-umbrella-beach";
    }
  
    else if (poi_type == 'Aquarium'){
      document.getElementById(place_icon).className = "fas fa-fish";
    }
  
    else if (poi_type == 'Zoo'){
      document.getElementById(place_icon).className = "fas fa-hippo";
    }
  
    else if (poi_type == 'Place of Worship'){
      document.getElementById(place_icon).className = "fas fa-place-of-worship";
    }
  
    else if (poi_type == 'Amusement Park'){
      document.getElementById(place_icon).className = "fas fa-child";
    }
  
    else if (poi_type == 'Stadium'){
      document.getElementById(place_icon).className = "fas fa-futbol";
    }
  
    else if (poi_type == 'Train Station'){
      document.getElementById(place_icon).className = "fas fa-train";
    }
  
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

        $('#modal-info-addr').text($(this).data('addr'));
        $('#modal-info-coord').text($(this).data('coord'));
        $('#modal-info-phone').text($(this).data('phone'));
        $('#modal-info-website').text($(this).data('website'));
        $('#modal-info-website').attr("href", $(this).data('website'));
    

    });
});