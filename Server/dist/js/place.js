var open_slots = {};
var photos_list = [];

var slideIndex = 1;

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

$(function () {
  $('[data-toggle="popover"]').popover()
})



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

    var poi_id = /id=([^&]+)/.exec(location.search)[1];

    var request = {
      placeId: place_id,
      fields: ["photos", "opening_hours", "review", "name", "price_level", "formatted_address", "user_ratings_total", "rating"]
    };


    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        
        if(place.opening_hours != null){
          createOpeningHoursTable(place.opening_hours.weekday_text);

          $.post("/update-info-poi-automatically", {poi: poi_id, field: "opening_hours", value: JSON.stringify(place.opening_hours.weekday_text)}, function(result){
            // if there are changes, refresh the page
            if(result.result == 1){
              window.location.reload();
            }

          });
        }

        else{
          $("#no-opening-hours").css("display", "block");
        }

        var merge_photos = [];

        
        if(place.photos != undefined && photos_list.length < 10){

          var num_photos_from_google_required = 10-photos_list.length;

          var google_photos = place.photos.slice(0,num_photos_from_google_required);
          
          merge_photos = photos_list.concat(google_photos);

        }

        else {

          merge_photos = photos_list;

        }


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



        if(place.reviews != undefined){
          for(var i=0; i < place.reviews.length; i++){
            var html = '<div class="card">';
            html += '<div class="row">';
            html += '<div class="col-md-3 text-center" style="margin: auto;"> <img src="' + place.reviews[i].profile_photo_url  +'" class="img-fluid review-img" > </div>'
            html += '<div class="col-md-9"><div class="card-body">';
            html += '<div class="text-right"><small>' + place.reviews[i].relative_time_description + '</small></div>';
            html += '<div class="d-flex w-100 justify-content-between"><h5 class="mb-1"><b>' + place.reviews[i].author_name +'</b></h5></div>';
            html += '<p class="mb-1 place-reviews-text">' + place.reviews[i].text +'</p>';
            html += '<div class="text-right" id="google-review-' + i +'-rating"></div>';
            html += '</div></div></div></div><br>';

            document.getElementById("google-reviews").innerHTML += html;
            loadRating(place.reviews[i].rating, "google-review-" + i +"-rating");

          }
        }

        else {
          var html = '<div class="text-center" style="margin: auto;"><i class="fas fa-comment-slash fa-3x" style="color: #dddddd;"></i></html>';
          html += '<div class="card-body text-center empty-review"><p class="mb-1">No reviews available for ' + place.name +'</p></div>';

          document.getElementById("google-reviews").innerHTML += html;
        }


        if(place.price_level != undefined){

          $.post("/update-info-poi-automatically", {poi: poi_id, field: "price_level", value: place.price_level}, function(result){
          });
        }

        if(place.formatted_address != undefined){

          $.post("/update-info-poi-automatically", {poi: poi_id, field: "address", value: place.formatted_address}, function(result){
            
            // if there are changes, refresh the page
            if(result.result == 1){
              window.location.reload();
            }

          });
        }

        if(place.rating != undefined){

          $.post("/update-info-poi-automatically", {poi: poi_id, field: "rating", value: place.rating}, function(result){
            
            // if there are changes, refresh the page
            if(result.result == 1){
              window.location.reload();
            }

          });
        }

        if(place.user_ratings_total != undefined){

          $.post("/update-info-poi-automatically", {poi: poi_id, field: "num_reviews", value: place.user_ratings_total}, function(result){
            
            // if there are changes, refresh the page
            if(result.result == 1){
              window.location.reload();
            }

          });
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

    else{
      document.getElementById(place_icon).className = "fas fa-monument";
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
    $('.btn-add-description-modal').on('click', function () {
        $('#modal-add-description-title').text($(this).data('title'));

        if($(this).data('description') != undefined){
          $('#add-description-text').val($(this).data('description'));
        }

    });
  });

  $(function () {
    $('.btn-update-price-modal').on('click', function () {
        $('#modal-update-price-title').text($(this).data('title'));

        
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
    var value = null;
  
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

  function getAccessibilityValue(){
    var value = null;
  
    if(document.getElementById('share-rating-access-star5').checked)
      value = 5;
    else if(document.getElementById('share-rating-access-star4').checked)
      value = 4;
    else if(document.getElementById('share-rating-access-star3').checked)
      value = 3;
    else if(document.getElementById('share-rating-access-star2').checked)
      value = 2;
    else if(document.getElementById('share-rating-access-star1').checked)
      value = 1;
  
    return value;
  }

  function getSecurityValue(){
    var value = null;
  
    if(document.getElementById('share-rating-security-star5').checked)
      value = 5;
    else if(document.getElementById('share-rating-security-star4').checked)
      value = 4;
    else if(document.getElementById('share-rating-security-star3').checked)
      value = 3;
    else if(document.getElementById('share-rating-security-star2').checked)
      value = 2;
    else if(document.getElementById('share-rating-security-star1').checked)
      value = 1;
  
    return value;

  }



  function changeReviewPage(){
    $('#review-modal-general-info').removeClass('active');
    $('#pills-review-info-tab').removeClass('active');

    $('#review-modal-more-info').tab('show');
    $('#pills-more-info-tab').addClass('active');

    $('#change-review-page-btn').css("display", "none");
    $('#submit-review-btn').css("display", "block");
    $('#return-review-page-btn').css("display", "block");
  }

  $(function () {
    $('#pills-review-info-tab').click(
      function(){ returnReviewPage(); return false;})
  });

  function returnReviewPage(){
    $('#review-modal-general-info').tab('show');
    $('#pills-review-info-tab').addClass('active');

    $('#review-modal-more-info').removeClass('active');
    $('#pills-more-info-tab').removeClass('active');

    $('#change-review-page-btn').css("display", "block");
    $('#submit-review-btn').css("display", "none");
    $('#return-review-page-btn').css("display", "none");

  }

  $(function () {
    $('#pills-more-info-tab').click(
      function(){ changeReviewPage(); return false;})
  });


  function submitReview(){
    var href = new URL(window.location.href);
    var poi_id = parseInt(href.searchParams.get('id'));

    if(document.getElementById("review-text").value == ''){
      $('#review-text').addClass("is-invalid");
      $('#review-text-error-msg').css("display", "block");
      returnReviewPage();
      return;
    }

    var review = document.getElementById("review-text").value;

    var rating = getRatingValue();
    var accessibility = getAccessibilityValue();
    var security = getSecurityValue();

    var price = document.getElementById("review-price").value;

    var duration = $( "#select-visit-duration option:selected" ).text();

    if(duration == "Duration")
      duration = null;

    $.post("/review-poi", {poi: poi_id, review: review, rating: rating, accessibility: accessibility, security: security, price: price, duration: duration}, function(result){
      window.location.reload();
    });
  }

  function editDescription(){
    var href = new URL(window.location.href);
    var poi_id = parseInt(href.searchParams.get('id'));

    if(document.getElementById("add-description-text").value == ''){
      $("#add-description-error").css("display", "block");
      return;
    }

    var description = document.getElementById("add-description-text").value;

    $.post("/edit-description-poi", {poi: poi_id, description: description}, function(result){
        window.location.reload();
    });
  }

  function updatePrice(){
    var href = new URL(window.location.href);
    var poi_id = parseInt(href.searchParams.get('id'));

    var price_adults = document.getElementById("input-adult-price").value;
    var price_children = document.getElementById("input-children-price").value;

    if(price_adults == '' && price_children == ''){
      $("#input-price-error").css("display", "block");
      return;
    }

    $.post("/update-poi-price", {poi: poi_id, price_adults: price_adults, price_children: price_children}, function(result){
      if(result.result == "success"){
        $("#update-price-success").css("display", "block");
      }

      else{
        $("#update-price-error").css("display", "block");
      }
    });
  }

  
  function loadRating(rating, review){

    rating = parseFloat(rating).toFixed(1);

    if(isNaN(rating)){
      document.getElementById(review).innerHTML += "No information available";
      return;
    }

    var count = 0;

    while(count < Math.floor(rating)){
      document.getElementById(review).innerHTML += '<i class="fas fa-star" aria-hidden="true" style="color: #ffc107;"></i>';
      count = count + 1;
    }

    if(rating-count >= 0.5){
      document.getElementById(review).innerHTML += '<i class="fas fa-star-half-alt" aria-hidden="true" style="color: #ffc107;"></i>';
      count = count + 1;
    }

    while(count < 5){
      document.getElementById(review).innerHTML += '<i class="fas fa-star" aria-hidden="true" style="color: #d0cfd1;"></i>';
      count = count + 1;
    }
  }


  function addVisit(poi_id){
    var href = new URL(window.location.href);
    var trip_id = parseInt(href.searchParams.get('trip'));
  
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

        $.post("/add-visit", {trip: trip_id, poi: poi_id, schedule: schedule}, function(result){
        
          if(result.result == 'error'){
            if(result.msg == 'schedule error'){
              $('#add-visit-error').css("display", "block");
              $('#add-visit-error-msg').text("Could not find a schedule for the visit in this trip")
            }
          }
          
          else{
            if(result.isManual == true)
              window.location.href = "/trip-m?id=" + trip_id;
            else
              window.location.href = "/trip?id=" + trip_id;
          
          }
        });

      }
    }

    else{

      $('#schedule-error').css("display", "none");
  
      $.post("/add-visit", {trip: trip_id, poi: poi_id}, function(result){
        
        if(result.result == 'error'){
          if(result.msg == 'schedule error'){
            $('#add-visit-error').css("display", "block");
            $('#add-visit-error-msg').text("Could not find a schedule for the visit in this trip")
          }
        }
        
        else{
          if(result.isManual == true)
            window.location.href = "/trip-m?id=" + trip_id;
          else
            window.location.href = "/trip?id=" + trip_id;
        
        }
      });
  
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


function loadPhotos(photos){
   for(var i=0; i<photos.length;i++){
      photos_list.push(photos[i]);
   }
}
