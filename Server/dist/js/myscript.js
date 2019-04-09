
  var map;
  var service;
  var infowindow;
  var poi_dict = {};
  var marker_list = [];
  
  var countries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Anguilla","Antigua &amp; Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia &amp; Herzegovina","Botswana","Brazil","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central Arfrican Republic","Chad","Chile","China","Colombia","Congo","Cook Islands","Costa Rica","Cote D Ivoire","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Polynesia","French West Indies","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauro","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Reunion","Romania","Russia","Rwanda","Saint Pierre &amp; Miquelon","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","St Kitts &amp; Nevis","St Lucia","St Vincent","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor L'Este","Togo","Tonga","Trinidad &amp; Tobago","Tunisia","Turkey","Turkmenistan","Turks &amp; Caicos","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Virgin Islands (US)","Yemen","Zambia","Zimbabwe"];


  function initMap(mapID='map') {

    if (checkMobile()){
      document.getElementById('sidebar').className = 'col-md-0 col-xs-0';
    }   

    var coordinates;


    var city = loadDestination();

    
    document.getElementById("poi-name").innerHTML = city;
    document.getElementById("poi-info").style.visibility = 'hidden';
    document.getElementById("poi-opening-hours").style.visibility = 'hidden';
    document.getElementById("add-remove-btn").style.visibility = 'hidden';

    var request = {
      query: city,
    };

    // show map in the city specified 
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
      'address': city
    }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var Lat = results[0].geometry.location.lat();
        var Lng = results[0].geometry.location.lng();
        var coordinatesFromAddress = {
          zoom: 16,
          center: new google.maps.LatLng(Lat, Lng)
        };
        map = new google.maps.Map(document.getElementById(mapID), coordinatesFromAddress);
        // Apply new JSON when the user chooses to hide/show features.
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

        service = new google.maps.places.PlacesService(map);
    
        service.textSearch(request,function callback(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            var place = results[i];
            document.getElementById('image_poi').src = place.photos[0].getUrl();
          }
        }
        });

        showLocals(coordinatesFromAddress['center']);
      } 

      else {
        alert("Something got wrong " + status);
      }
    });

    infoWindow = new google.maps.InfoWindow;

  }


  function showLocals(location){
    showHotels(location);
    showRestaurants(location);
    showParks(location);
    showShops(location);
    showPOIs(location);
  }
   

  function showPOIs(location){
    var request = {
      location: location,
      radius: '10000',
      type: 'point_of_interest'
    };

    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, function(results, status){
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          var place = results[i];
          if(place.rating > 4.0 && place.user_ratings_total > 5){
            poi_dict[place.name] = place.place_id;
            data = {color: '#13b5c7', icon: 'fas fa-archway'};
            createMarker(place.geometry.location, place.name, data);
          }
        }
      }
    });

    var request = {
      location: location,
      radius: '10000',
      query: 'church'
    };

    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, function(results, status){
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          var place = results[i];
          if(place.rating > 4.0 && place.user_ratings_total > 5){
            poi_dict[place.name] = place.place_id;
            data = {color: '#13b5c7', icon: 'fas fa-church'};
            createMarker(place.geometry.location, place.name, data);
          }
        }
      }
    });

    var request = {
      location: location,
      radius: '10000',
      query: 'museum'
    };

    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, function(results, status){
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          var place = results[i];
          if(place.rating > 4.0 && place.user_ratings_total > 5){
            poi_dict[place.name] = place.place_id;
            data = {color: '#13b5c7', icon: 'fas fa-archway'};
            createMarker(place.geometry.location, place.name, data);
          }
        }
      }
    });

  }

  function showHotels(location){
    var request = {
      location: location,
      radius: '10000',
      query: 'hotel',
    };

    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, function(results, status){
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          var place = results[i];
          if(place.rating > 4.0 && place.user_ratings_total > 5){
            poi_dict[place.name] = place.place_id;
            data = {color: '#ea7419', icon: 'fas fa-bed'};
            createMarker(place.geometry.location, place.name, data);
          }
        }
      }
    });
  }

  function showRestaurants(location){
    var request = {
      location: location,
      radius: '10000',
      query: 'restaurant'
    };

    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, function(results, status){
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          var place = results[i];
          if(place.rating > 3.0 && place.user_ratings_total > 5){
            poi_dict[place.name] = place.place_id;
            data = {color: '#f7c12e', icon: 'fas fa-utensils'};
            createMarker(place.geometry.location, place.name, data);
          }
        }
      }
    });
  }


  function showParks(location){
    var request = {
      location: location,
      radius: '5000',
      query: 'park'
    };

    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, function(results, status){
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          var place = results[i];
          if(place.rating > 4.0 && place.user_ratings_total > 5){
            poi_dict[place.name] = place.place_id;
            data = {color: '#74bb82', icon: 'fas fa-tree'};
            createMarker(place.geometry.location, place.name, data);
          }
        }
      }
    });
  }

  function showShops(location){
    var request = {
      location: location,
      radius: '10000',
      query: 'shop',
    };

    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, function(results, status){
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          var place = results[i];
          if(place.rating > 4.0 && place.user_ratings_total > 5){
            poi_dict[place.name] = place.place_id;
            data = {color: '#ac48db', icon: 'fas fa-shopping-bag'};
            createMarker(place.geometry.location, place.name, data);
          }
        }
      }
    });
  }




  function createMarker(local, name, data){

    if(marker_list.includes(name))
      return;

    
    marker = new Marker({
      position: local,
      map: map,
      title: name,
      icon: {
          path: MAP_PIN,
          fillColor: data.color,
          fillOpacity: 1,
          strokeColor: '',
          strokeWeight: 0
      },
      map_icon_label: '<i class="'+data.icon+'"></i>'
    });

    marker.addListener('click', function () {
      document.getElementById('sidebar').style.visibility = "visible";
      document.getElementById('map').className  = 'col-md-9 col-xs-12';
      viewPOI(this);
    });

    
    console.log(marker);

    marker_list.push(marker.title);

  }



  function viewPOI(marker_clicked){
    $("#poi-info-table").children().remove();

    if (checkMobile()){

      document.getElementById('map').className = 'col-md-0 col-xs-0';
      document.getElementById('sidebar').className = 'col-md-12 col-xs-12';
    }

    else{
      document.getElementById('map').className = 'col-md-9 col-xs-9';
      document.getElementById('sidebar').className = 'col-md-3 col-xs-3';
    }


    document.getElementById('poi-name').innerHTML = marker_clicked.title;

    
    document.getElementById("poi-info").style.visibility = 'visible';
    document.getElementById("poi-opening-hours").style.visibility = 'visible';
    document.getElementById("add-remove-btn").style.visibility = 'visible';

    var request = {
      placeId: poi_dict[marker_clicked.title],
    };


    var service = new google.maps.places.PlacesService(map);

    service.getDetails(request, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        console.log(place);

        if(place.photos != undefined)
          document.getElementById('image_poi').src = place.photos[0].getUrl({'maxWidth': 300, 'maxHeight': 300});
        else
          document.getElementById('image_poi').src = "";
        
        var address = place.adr_address.split('<span class="country-name"')[0];
        document.getElementById('poi-address').innerHTML =  address.substring(0, address.length - 2);


        if(place.website != undefined){
          document.getElementById('poi-website').innerHTML = '<a class="poi-labels" href='+place.website+'>'+place.website+'</a>';
        }

        else{
          document.getElementById('website').innerHTML = "n/a";
        }


        createOpeningHoursTable(place.opening_hours.weekday_text);

        document.getElementById('poi-rating').innerText = place.rating + " / 5.0" ;

        if (place.formatted_phone_number != undefined){
          document.getElementById('poi-phone-number').innerText = place.formatted_phone_number;
        }

        else{
          document.getElementById('poi-phone-number').innerText = "n/a";
        }

      }
    });

  }

  function createOpeningHoursTable(hours){
    var table = document.getElementById("table-opening-hours");
    
    table.innerHTML = "";

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


  function closeInfo(){
    if (checkMobile()){

      document.getElementById('map').className = 'col-md-12 col-xs-12';
      document.getElementById('sidebar').className = 'col-md-0 col-xs-0';
      
    }

    else{
      
      document.getElementById('map').className = 'col-md-12 col-xs-12';
      document.getElementById('sidebar').className = 'col-md-0 col-xs-0';
    }
  }



function checkMobile(){
  if ( navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
  ){

  return true;

  }   

  else{
    return false;
  }


}

function processDestination()
  {
    if(document.getElementById("inputDestination").value != ""){
      var destination = document.getElementById("inputDestination").value;
      var queryString = "?dest=" + destination;
      window.location.href = "./map.html" + queryString;
    }
  }

function loadDestination(){
  var queryString = decodeURIComponent(window.location.search);
  queryString = queryString.substring(1);
  var queries = queryString.split("&");
  var city = queries[0].replace("dest=", "");

  return city;
}

function enableBudgetBox(){
  document.getElementById('inputBudget').disabled = false;
}

function disableBudgetBox(){
  document.getElementById('inputBudget').disabled = true;
}


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


function submitDestination(){
  if(document.getElementById('inputDestination').value != undefined && document.getElementById('inputDestination').value != ""){
    var destination = document.getElementById('inputDestination').value;
    var queryString = "?dest=" + destination;
    window.location.href = "./places" + queryString;
  }
  else{
    alert("Must select a valid destination !");
  }
}


function submitHotelDestination(){
  if(document.getElementById('inputDestination').value != undefined && document.getElementById('inputDestination').value != ""){
    var destination = document.getElementById('inputDestination').value;
    var queryString = "?dest=" + destination;
    window.location.href = "./hotels" + queryString;
  }
  else{
    alert("Must select a valid destination !");
  }
}

function submitRestaurantDestination(){
  if(document.getElementById('inputDestination').value != undefined && document.getElementById('inputDestination').value != ""){
    var destination = document.getElementById('inputDestination').value;
    var queryString = "?dest=" + destination;
    window.location.href = "./restaurants" + queryString;
  }
  else{
    alert("Must select a valid destination !");
  }
}

function login(){
  
}

function logout(){
}


function loadNavbar(){
  var username = sessionStorage.getItem("username");

  if(username == "null"){
    document.getElementById("profile").style.display = 'none';
    document.getElementById("login").style.display = 'block';
  }

  else{
    document.getElementById("user-profile-pic").src = sessionStorage.getItem("user-pic");
    document.getElementById("profile").style.display = 'block';
    document.getElementById("login").style.display = 'none';
  }


}

var googleUser = {};
var startGoogleSignIn = function() {
  gapi.load('auth2', function(){
    // Retrieve the singleton for the GoogleAuth library and set up the client.
    auth2 = gapi.auth2.init({
      client_id: '947355014175-rts1345qm9jq3ohmbqhr9dl7ujt297sc.apps.googleusercontent.com',
      cookiepolicy: 'single_host_origin',
      // Request scopes in addition to 'profile' and 'email'
      //scope: 'additional_scope'
    });
    attachSignin(document.getElementById('customBtn'));
  });
};

function attachSignin(element) {
  console.log(element.id);
  auth2.attachClickHandler(element, {},
      function(googleUser) {
        var profile = googleUser.getBasicProfile();
        console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
        console.log('Name: ' + profile.getName());
        console.log('Image URL: ' + profile.getImageUrl());
        console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

        
        sessionStorage.setItem("username", profile.getEmail());
        sessionStorage.setItem("user-pic", profile.getImageUrl());
        window.location.href = "/";

      }, function(error) {
      });
}


function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    sessionStorage.setItem("username", null);
    window.location.href = "/";
  });
}


