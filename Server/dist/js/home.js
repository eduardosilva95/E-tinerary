
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
  

  function login(){
    
  }
  
  function logout(){
  }
  
  
  function loadNavbar(){
    if(getUserCookie()){
      document.getElementById("profile").style.display = 'block';
      document.getElementById("login").style.display = 'none';
    }
  
    else{
      document.getElementById("profile").style.display = 'none';
      document.getElementById("login").style.display = 'block';
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
    auth2.attachClickHandler(element, {},
        function(googleUser) {
          var profile = googleUser.getBasicProfile();
  
  
          //setUserCookie(profile.getEmail(), profile.getImageUrl());
            
          $.post("/login-g", {google_id: profile.getId(), name: profile.getName(), username: profile.getEmail(), picture: profile.getImageUrl()}, function(result){
            
            setUserCookie(result.user_id, result.picture);
            window.location.href = "/";

          });
          
  
        }, function(error) {
        });
  }
  
  
  function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      deleteUserCookie();
      window.location.href = "/";
    });
  }
  
  
  
  function setUserCookie(user_id, picture){
    var d = new Date();
    d.setTime(d.getTime() + (365*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
  
    document.cookie = "user=" + user_id + "; " + expires + ";path=/";
    document.cookie = "picture=" + picture + "; " + expires + ";path=/";
  
  }
  
  function getUserCookie() {
    var user_id = "";
    var picture = "";
  
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
  
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
  
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf("user=") == 0) {
        user_id = c.substring("user=".length, c.length);
      }
  
      if (c.indexOf("picture=") == 0) {
        picture = c.substring("picture=".length, c.length);
      }
    }
  
    if(user_id != "" && picture != ""){
      document.getElementById("user-id").value = user_id;
      document.getElementById("user-profile-pic").src = picture;
      document.getElementById("profile-trips").href = "/trips?id=" + user_id;

      return true;
    }
  
    else{
      return false;
    }
  
  
  }
  
  
  function deleteUserCookie(){
    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "picture=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }


  function loadPlaceImage(dest, place_id){
    var request = { 
      placeId: place_id,
    };

    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {

            if(place.photos != undefined)
            document.getElementById(dest).src = place.photos[0].getUrl();
            else
            document.getElementById(dest).src = "";

        }
    });

  }