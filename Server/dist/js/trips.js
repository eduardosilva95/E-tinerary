
function getCityImage(city, dest){

    var request = {
        query: city,
    };

    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.textSearch(request, function(results, status){
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            var place = results[0];

            if(place.photos != undefined)
                document.getElementById(dest).src = place.photos[0].getUrl();
            else
                document.getElementById(dest).src = "";
        }
    });
}