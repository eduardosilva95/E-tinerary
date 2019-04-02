var total_number_pages;

function loadPage(){
  loadPageButtons();
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


function getPlaceDetails(place_id, place_name){

    var request = { 
      placeId: place_id,
    };


    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {

        if(place.photos != undefined)
          document.getElementById(place_name + " Image").src = place.photos[0].getUrl({'maxWidth': 200, 'maxHeight': 180});
        else
          document.getElementById(place_name + " Image").src = "";


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

            if(place.photos != undefined)
                document.getElementById("places-header").style.backgroundImage = 'url(' + place.photos[0].getUrl() + ')';
            else
                document.getElementById("places-header").style.backgroundImage = "";
        }
      });



}

function loadIcon(place, poi_type){
  var place_icon = place + "_icon";

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


function loadPlace(place_id){
  var queryString = "?id=" + place_id;
  window.location.href = "./place" + queryString;
}

function queryPlace(city_id){
  var destination = /dest=([^&]+)/.exec(location.search)[1]

  var query = document.getElementById("search-place-input").value;
  var queryString = "?dest=" + destination + "&query=" + query;
  window.location.href = "./places" + queryString;
}

function queryHotel(city_id){
  var destination = /dest=([^&]+)/.exec(location.search)[1]

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


  //var queryString = "?dest=" + destination + "&query=" + query;
  //window.location.href = "./places" + queryString;

}


function classify(){
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

  console.log(value);
}


/*
$(document).ready(function(){
  var $bg = $('#places-header'),
      origin = {x: 0, y: 0},
      start = {x: 0, y: 0},
      movecontinue = false;
  
  function move (e){
      var moveby = {
          x: origin.x - e.clientX, 
          y: origin.y - e.clientY
      };

      console.log(e);
      
      if (movecontinue === true) {
          start.x = start.x - moveby.x;
          start.y = start.y - moveby.y;
          
          $(this).css('background-position', start.x + 'px ' + start.y + 'px');
      }
      
      origin.x = e.clientX;
      origin.y = e.clientY;
      
      e.stopPropagation();
      return false;
  }
  
  function handle (e){
      movecontinue = false;
      $bg.unbind('mousemove', move);
      
      if (e.type == 'mousedown') {
          origin.x = e.clientX;
          origin.y = e.clientY;
          movecontinue = true;
          $bg.bind('mousemove', move);
      } else {
          $(document.body).focus();
      }
      
      e.stopPropagation();
      return false;
  }
  
  function reset (){
      start = {x: 0, y: 0};
      $(this).css('backgroundPosition', '0 0');
  }
  
  $bg.bind('mousedown mouseup mouseleave', handle);
  $bg.bind('dblclick', reset);
});*/