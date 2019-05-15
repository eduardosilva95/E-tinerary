
var open_slots = {};

$(window).on('load', function() {
    var coordinates = document.getElementById("place-coordinates").innerText;

    var lat = coordinates.split(',')[0];
    var lon = coordinates.split(',')[1];

    var place = document.getElementById("place_name").innerText;
  
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


function createOpeningHoursTable(hours){
    var table = document.getElementById("table-opening-hours");

    for(var i=0; i < hours.length; i++){

        var weekday = hours[i].split(':')[0];
        var opening_hours = hours[i].substring(hours[i].indexOf(':')+1)

        var row = table.insertRow(-1);

        var cell1 = row.insertCell(0);
        cell1.innerText = weekday;

        var cell2 = row.insertCell(1);
        cell2.innerText = opening_hours;
    }

}


function getPlaceDetails(place_id){

    var request = {
      placeId: place_id,
    };


    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {

        if(place.photos != undefined)
          document.getElementById("place-image").src = place.photos[0].getUrl();
        else
          document.getElementById("place-image").src = "";

        if(place.opening_hours != null){
          createOpeningHoursTable(place.opening_hours.weekday_text);
        }

      }
    });

  }

  function loadOpenSlots(openslots){
    openslots = JSON.parse(openslots);
  
    for(day in openslots){
      var list = [];
      for(var i=0; i < openslots[day].length ; i++){
        list.push(openslots[day][i]);
      }
      open_slots[day] = list;
    }

  }

  function loadIcon(poi_type){
    var place_icon = "place_icon";
  
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
  
  
  }

  $(function () {
    $('.btn-add-visit-modal').on('click', function () {
  
        $('#modal-title').text($(this).data('title')); 
        
        document.getElementById('confirm-add-visit-btn').setAttribute( "onClick", "javascript: addVisit("+$(this).data('poi')+");" );
  
    });
  });

  $(function () {
    $('.btn-create-review-modal').on('click', function () {

        $('#modal-review-title').text($(this).data('title'));
    });
  });

  $(function () {
    $("#radio-choose-schedule-man").change(function() {
      $('.dr').slideUp();
      if ($(this).is(':checked')) {
          $("#choose-schedule-man").slideToggle();
      }
    });
  
  
    $("#radio-choose-schedule-auto").change(function() {
      if ($(this).is(':checked')) {
          $("#choose-schedule-man").slideToggle();
      }
    });
  
  
  });
  
  
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
    if(hasUserCookies()){
      var user_id = getUserCookie();
      var poi_id = /id=([^&]+)/.exec(location.search)[1];

      if(document.getElementById("review-text").value == ''){
        alert("The review can't be empty");
        return;
      }
      var review = document.getElementById("review-text").value;

      var rating = getRatingValue();

      $.post("/review-poi", {poi: poi_id, user: user_id, review: review, rating: rating}, function(result){

        window.location.reload();
      });
    }
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


  function addVisit(poi_id){
    var plan = /plan=([^&]+)/.exec(location.search)[1];
  
    var schedule;
  
    if($('#radio-choose-schedule-man').is(':checked')){

      if($('#visit-day option:selected').val() == "null" || $('#visit-start-hour option:selected').val() == "null"){
        $('#schedule-error').css("display", "block");
      }

      else{
        $('#schedule-error').css("display", "none");

        var day = new Date ($('#visit-day option:selected').val());
        day = day.getFullYear() + "-" + (day.getMonth()<10?'0':'') + (day.getMonth() + 1)  + "-" + (day.getDate()<10?'0':'') + day.getDate();
        var hour = $('#visit-start-hour option:selected').val();
        schedule = day + " " + hour;

        $.post("/add-visit", {plan: plan, poi: poi_id, schedule: schedule}, function(result){
        
          if(result.result == 'error'){
            if(result.msg == 'schedule error'){
              $('#add-visit-error').css("display", "block");
              $('#add-visit-error-msg').text("Could not find a schedule for the visit in this plan")
            }
          }
          
          else{
            if(result.isManual == true)
              window.location.href = "/plan-m?id=" + plan;
            else
              window.location.href = "/plan?id=" + plan;
          
          }
        });

      }
    }
  }
  
  $(function () {
    $("#visit-day").on('change', function() {
      var day = new Date(this.value.split(', ')[1]);
      day = day.getFullYear() + "-" + (day.getMonth()<10?'0':'') + (day.getMonth() + 1)  + "-" + (day.getDate()<10?'0':'') + day.getDate();
  
      $('#visit-start-hour')[0].options.length = 1;
  
      if(open_slots[day] != undefined){
        for(var i=0 ; i<open_slots[day].length; i++){
          $('#visit-start-hour').append( '<option value="'+open_slots[day][i]+'">'+open_slots[day][i]+'</option>' );
        }
      }
  
    });
  });