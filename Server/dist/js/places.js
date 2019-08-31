var total_number_pages;

var open_slots = {};

$(function () {
  $(document).scroll(function () {
    var $nav = $(".navbar");
    $nav.toggleClass('scrolled', $(this).scrollTop() > $nav.height());
  });
});



function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
              b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = this.getElementsByTagName("input")[0].value;
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
          });
          a.appendChild(b);
        }
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
      x[i].parentNode.removeChild(x[i]);
    }
  }
}
/*execute a function when someone clicks in the document:*/
document.addEventListener("click", function (e) {
    closeAllLists(e.target);
});
}


function loadPage(){
  loadNavbar(); 
  loadPageButtons();
  getCityImage(/dest=([^&]+)/.exec(location.search)[1]);
  loadSortOption();
  loadFilters();
}

function loadPageButtons(){
  var page = 1;

  if(window.location.href.includes('page')){
    var href = new URL(window.location.href);
    page = parseInt(href.searchParams.get('page'));
  }

  if(total_number_pages == 0)
    document.getElementById('change-pages').style.visibility = 'hidden';


  /* if it's the first page */
  if(page == 1){
    document.getElementById('button-previous-page').className = 'page-item disabled';
    document.getElementById('button-first-page').className = 'page-item disabled';

    /* switch page buttons values = [1, 2, 3] */
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

  /* if it's the last page */
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


function getPlaceDetails(place_id, dest, photo){
  
  if(photo == null || photo == ""){

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
          document.getElementById(dest).src = "img/no-photo-found.png";
      }

    else{
        document.getElementById(dest).src = "img/no-photo-found.png";
    }
  });

  }

  else{
    document.getElementById(dest).src = photo;

  }



}


function updatePlaceLink(dest){
  var href = new URL(window.location.href);
  var trip_id = parseInt(href.searchParams.get('trip'));

  if(isNaN(trip_id)){
    document.getElementById(dest).getElementsByClassName("places-poi-find-more")[0].href += "&trip=" + trip_id;

  }

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

  var href = new URL(window.location.href);
  var trip_id = parseInt(href.searchParams.get('trip'));

  if(isNaN(trip_id))
    queryString = queryString + "&trip=" + trip_id;

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


function queryPlace(){
  var query = document.getElementById("search-place-input").value;

  var href = new URL(window.location.href);
  href.searchParams.set('query', query);
  
  window.location.href = href;

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


function loadRating(rating, dest){

  rating = parseFloat(rating).toFixed(1);

  if(isNaN(rating)){
    document.getElementById(dest).innerHTML += "No information available";
    return;
  }

  var count = 0;

  while(count < Math.floor(rating)){
    document.getElementById(dest).innerHTML += '<i class="fas fa-star" aria-hidden="true" style="color: #ffc107;"></i>';
    count = count + 1;
  }

  if(rating-count >= 0.5){
    document.getElementById(dest).innerHTML += '<i class="fas fa-star-half-alt" aria-hidden="true" style="color: #ffc107;"></i>';
    count = count + 1;
  }

  while(count < 5){
    document.getElementById(dest).innerHTML += '<i class="fas fa-star" aria-hidden="true" style="color: #d0cfd1;"></i>';
    count = count + 1;
  }
}

function loadPriceRating(rating, dest){

  rating = parseInt(rating);

  if(isNaN(rating)){
    //document.getElementById(dest).innerHTML += "No information available";
    return;
  }

  var count = 0;

  while(count < rating){
    document.getElementById(dest).innerHTML += '<i class="fas fa-euro-sign" aria-hidden="true" style="color: #ffc107;"></i>';
    count = count + 1;
  }

  while(count < 5){
    document.getElementById(dest).innerHTML += '<i class="fas fa-euro-sign" aria-hidden="true" style="color: #d0cfd1;"></i>';
    count = count + 1;
  }
}




$(function () {
  $("#sort-alph-az-btn" ).click(function() {
    var href = new URL(window.location.href);
    href.searchParams.set('sort', 'az');
    window.location.href = href;

  });

  $("#sort-alph-za-btn" ).click(function() {
    var href = new URL(window.location.href);
    href.searchParams.set('sort', 'za');
    window.location.href = href;
  });

  $("#sort-num-reviews-btn" ).click(function() {
    var href = new URL(window.location.href);
    href.searchParams.set('sort', 'reviews');
    window.location.href = href;

  });

  $("#sort-rating-btn" ).click(function() {
    var href = new URL(window.location.href);
    href.searchParams.set('sort', 'rating');
    window.location.href = href;
  });

});

function loadSortOption(){
  var href = new URL(window.location.href);

  if(href.searchParams.get('sort') == "az"){
    $("#sort-alph-az-btn").addClass("active");
    $("#sort-alph-az-btn").prop("disabled",true);
  }

  else if(href.searchParams.get('sort') == "za"){
    $("#sort-alph-za-btn").addClass("active");
    $("#sort-alph-za-btn").prop("disabled",true);
    
  }

  else if(href.searchParams.get('sort') == "rating"){
    $("#sort-rating-btn").addClass("active");
    $("#sort-rating-btn").prop("disabled",true);
    
  }

  else{
    $("#sort-num-reviews-btn").addClass("active");
    $("#sort-num-reviews-btn").prop("disabled",true);
  }
}



$( function() {
  $( "#slider-range" ).slider({
    range: true,
    min: 1.0,
    max: 5.0,
    step: 0.1,
    values: [1.0, 5.0],
    slide: function( event, ui ) {
      $("#rating-range").val(ui.values[ 0 ].toFixed(1) + " - " + ui.values[ 1 ].toFixed(1));
    }
  });
  
  $("#rating-range").val($("#slider-range").slider("values", 0).toFixed(1) +
    " - " + $("#slider-range").slider("values", 1).toFixed(1));
} );

$(function () {
  $("#places-filter-btn" ).click(function() {

    if($("#hotels-filter").is(':checked'))
      document.cookie = "hotels_filter=" + true;
    else
      document.cookie = "hotels_filter=" + false;

    if($("#restaurants-filter").is(':checked'))
      document.cookie = "restaurants_filter=" + true;
    else
      document.cookie = "restaurants_filter=" + false;

    if($("#museums-filter").is(':checked'))
      document.cookie = "museums_filter=" + true;
    else
      document.cookie = "museums_filter=" + false;

    if($("#churchs-filter").is(':checked'))
      document.cookie = "churchs_filter=" + true;
    else
      document.cookie = "churchs_filter=" + false;

    if($("#parks-filter").is(':checked'))
      document.cookie = "parks_filter=" + true;
    else
      document.cookie = "parks_filter=" + false;

    if($("#others-filter").is(':checked'))
      document.cookie = "others_filter=" + true;
    else
      document.cookie = "others_filter=" + false;

    document.cookie = "rating_range_filter=" + $("#rating-range").val();
  

    window.location.reload();

  });

});

function loadFilterCookie(filtername){
  var filter_value = "";

  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');

  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];

    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf((filtername+"=")) == 0) {
      filter_value = c.substring((filtername+"=").length, c.length);
    }
  }

  if(filter_value != ""){
    return filter_value;
  }

  else{
    return null;
  }
}



function loadFilters(){
  if(loadFilterCookie("hotels_filter") == "false")
    $("#hotels-filter").prop( "checked", false );

  document.cookie = "hotels_filter=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  if(loadFilterCookie("restaurants_filter") == "false")
    $("#restaurants-filter").prop( "checked", false );
    
  document.cookie = "restaurants_filter=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  if(loadFilterCookie("museums_filter") == "false")
    $("#museums-filter").prop( "checked", false );

  document.cookie = "museums_filter=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  if(loadFilterCookie("churchs_filter") == "false")
    $("#churchs-filter").prop( "checked", false );
    
  document.cookie = "churchs_filter=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  if(loadFilterCookie("parks_filter") == "false")
    $("#parks-filter").prop( "checked", false );
    
  document.cookie = "parks_filter=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  if(loadFilterCookie("others_filter") == "false")
    $("#others-filter").prop( "checked", false );
    
  document.cookie = "others_filter=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  var rating_range_filter = loadFilterCookie("rating_range_filter");


  if(rating_range_filter != null){
    $("#rating-range").val(rating_range_filter);

    $( "#slider-range" ).slider({
      values: [rating_range_filter.split('-')[0], rating_range_filter.split('-')[1]]
    });
  }

  document.cookie = "rating_range_filter=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

}

$(function () {
  $('[data-toggle="popover"]').popover()
})
