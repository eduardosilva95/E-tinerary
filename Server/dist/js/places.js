var total_number_pages;

var open_slots = {};

$(function () {
  $(document).scroll(function () {
    var $nav = $(".navbar");
    $nav.toggleClass('scrolled', $(this).scrollTop() > $nav.height());
  });
});


function loadPage(){
  loadNavbar(); 
  loadPageButtons();

  getCityImage(/dest=([^&]+)/.exec(location.search)[1])

}

function loadPageButtons(){
  var page = 1;

  if(location.search.includes('page')){
    page = parseInt(/page=([^&]+)/.exec(location.search)[1]);
  }

  if(page == 1){
    document.getElementById('button-previous-page').className = 'page-item disabled';
    document.getElementById('button-first-page').className = 'page-item disabled';


    document.getElementById('button-page-1').childNodes[0].innerText = 1;
    document.getElementById('button-page-1').childNodes[0].value = 1;

    document.getElementById('button-page-2').childNodes[0].innerText = 2;
    document.getElementById('button-page-2').childNodes[0].value = 2;
    document.getElementById('button-page-3').childNodes[0].innerText = 3;
    document.getElementById('button-page-3').childNodes[0].value = 3;

    if(total_number_pages == 1){
      document.getElementById('change-pages').style.visibility = 'hidden';
    }

    else if(total_number_pages == 2){
      document.getElementById('button-page-3').className = 'page-item disabled';

    }
    
      
    activePage(document.getElementById('button-page-1'));
  }

  else if(page == total_number_pages){
    document.getElementById('button-next-page').className = 'page-item disabled';
    document.getElementById('button-last-page').className = 'page-item disabled';

    if(total_number_pages == 2){
      document.getElementById('button-page-1').childNodes[0].innerText = 1;
      document.getElementById('button-page-1').childNodes[0].value = 1;
      document.getElementById('button-page-2').childNodes[0].innerText = 2;
      document.getElementById('button-page-2').childNodes[0].value = 2;
      document.getElementById('button-page-3').childNodes[0].innerText = 3;
      document.getElementById('button-page-3').childNodes[0].value = 3;

      document.getElementById('button-page-3').className = 'page-item disabled';

      activePage(document.getElementById('button-page-2'))
    }

    else{
      document.getElementById('button-page-1').childNodes[0].innerText = total_number_pages - 2;
      document.getElementById('button-page-1').childNodes[0].value = total_number_pages - 2;
      document.getElementById('button-page-2').childNodes[0].innerText = total_number_pages - 1;
      document.getElementById('button-page-2').childNodes[0].value = total_number_pages - 1;
      document.getElementById('button-page-3').childNodes[0].innerText = total_number_pages;
      document.getElementById('button-page-3').childNodes[0].value = total_number_pages;

      activePage(document.getElementById('button-page-3'))
    }

  }

  else{
    document.getElementById('button-previous-page').className = 'page-item';

    document.getElementById('button-page-1').childNodes[0].innerText = page - 1;
    document.getElementById('button-page-1').childNodes[0].value = page - 1;
    document.getElementById('button-page-2').childNodes[0].innerText = page;
    document.getElementById('button-page-2').childNodes[0].value = page;
    document.getElementById('button-page-3').childNodes[0].innerText = page + 1;
    document.getElementById('button-page-3').childNodes[0].value = page + 1;
    
    activePage(document.getElementById('button-page-2'));
  }

}

function activePage(elem){
  elem.className = 'page-item active';

  var x = document.createElement("SPAN");
  x.className = 'sr-only';
  x.innerText = '(current)';

  elem.childNodes[0].appendChild(x);
}

function deactivateButtons(page1, page2){
  document.getElementById('button-page-' + page1).className = 'page-item';
  document.getElementById('button-page-' + page1).childNodes[0].removeChild(document.getElementById('button-page-1').childNodes[0].childNodes[0]);
  document.getElementById('button-page-' + page2).className = 'page-item';
  document.getElementById('button-page-' + page2).childNodes[0].removeChild(document.getElementById('button-page-1').childNodes[0].childNodes[0]);
}

function filterPage(total_results){
  total_number_pages = Math.ceil(total_results / 9);
}


function getPlaceDetails(place_id, dest){

    var request = { 
      placeId: place_id,
      fields: ['photos']
    };


    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {

        if(place.photos != undefined)
          document.getElementById(dest).src = place.photos[0].getUrl({'maxWidth': 200, 'maxHeight': 180});
        else
          document.getElementById(dest).src = "";


        //console.log(place.opening_hours);
      }
    });

  }


function getCityImage(city){

    var request = {
        query: city,
    };

    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.textSearch(request, function(results, status){
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            var place = results[0];

            if(place.photos != undefined){
              document.body.style.backgroundImage = 'url(' + place.photos[0].getUrl() + ')';
              document.body.style.backgroundSize = "cover";
              document.body.style.backgroundPosition = "center";
              document.body.style.height = "400px";
            }
            
        }
      });
}

function loadIcon(dest, poi_type){
  
  document.getElementById(dest).className = getIcon(poi_type);
}


function getIcon(type){

  type = type.toLowerCase();

  if(type == 'park'){
      return "fas fa-tree";
  }

  else if(type == 'castle'){
      return "fas fa-chess-rook";
  }

  else if (type == 'tower' || type == 'museum'){
      return "fas fa-archway";
  }

  else if (type == 'church'){
      return "fas fa-church";
  }

  else if (type == 'restaurant'){
      return "fas fa-utensils";
  }

  else if (type == 'hotel'){
      return "fas fa-bed";
  }

  else if (type == 'natural feature'){
      return "fas fa-umbrella-beach";
  }

  else if (type == 'aquarium'){
      return "fas fa-fish";
  }

  else if (type == 'zoo'){
      return "fas fa-hippo";
  }

  else if (type == 'place of worship'){
      return "fas fa-place-of-worship";
  }

  else if (type == 'amusement park'){
      return "fas fa-child";
  }

  else if (type == 'stadium'){
      return "fas fa-futbol";
  }

  else if (type == 'train station'){
      return "fas fa-train";
  }

}


function loadPlace(place_id){
  var queryString = "?id=" + place_id;

  if(/plan=([^&]+)/.exec(location.search) != null)
    queryString = queryString + "&plan=" + /plan=([^&]+)/.exec(location.search)[1];

  window.location.href = "./place" + queryString;
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


function queryPlace(city_id){
  var destination = /dest=([^&]+)/.exec(location.search)[1]

  var query = document.getElementById("search-place-input").value;
  var queryString = "?dest=" + destination + "&query=" + query;
  window.location.href = "./places" + queryString;
}

function queryHotel(city_id){
  var destination = /dest=([^&]+)/.exec(location.search)[1];

  var query = document.getElementById("search-place-input").value;
  var queryString = "?dest=" + destination + "&query=" + query;
  window.location.href = "./hotels" + queryString;
}

function queryRestaurant(city_id){
  var destination = /dest=([^&]+)/.exec(location.search)[1]

  var query = document.getElementById("search-place-input").value;
  var queryString = "?dest=" + destination + "&query=" + query;
  window.location.href = "./restaurants" + queryString;
}


function changePage(value){
  if(value == 'next'){
    if(location.search.includes('page')){
      value = parseInt(/page=([^&]+)/.exec(location.search)[1]) + 1;
    }
    else{
      value = 2;
    }
  }

  else if(value == 'previous'){
    if(location.search.includes('page')){
      value = parseInt(/page=([^&]+)/.exec(location.search)[1]) - 1;
    }
  }

  else if(value == 'first'){
    value = 1;
  }

  else if(value == 'last'){
    value = total_number_pages;
  }

  var queryString = location.search.split('&page')[0] + "&page=" + value;
  window.location.href = "./places" + queryString;
}

function filterSearch(){
  var destination = /dest=([^&]+)/.exec(location.search)[1]

  if(/query=([^&]+)/.exec(location.search) != null){
    var query = /query=([^&]+)/.exec(location.search)[1];

  }

}



$(function () {
  $('.btn-add-visit-modal').on('click', function () {

      $('#modal-title').text($(this).data('title')); 
      
      document.getElementById('confirm-add-visit-btn').setAttribute( "onClick", "javascript: addVisit("+$(this).data('poi')+");" );

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

  else{

    $('#schedule-error').css("display", "none");

    $.post("/add-visit", {plan: plan, poi: poi_id}, function(result){
      
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