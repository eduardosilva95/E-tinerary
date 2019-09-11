
var slide = 0;


$(function () {
  $('#arrival-date').change(function() { 
    console.log($('#arrival-date').val());
  });
});

$(function () {
  $(document).scroll(function () {
    var $nav = $(".navbar");
    $nav.toggleClass('scrolled', $(this).scrollTop() > $nav.height());
  });
});


$(function () {
    $(".btn-interests-down").click(function() {
        $("#interests-div").slideToggle();
        if(slide == 0){
            $("#btn-interests-icon").attr('class', 'fas fa-chevron-up');
            slide = 1;
        }
        else{
            $("#btn-interests-icon").attr('class', 'fas fa-chevron-down');
            slide = 0;
        }
    });
});

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
        a.setAttribute("class", "autocomplete-items ");
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

  $(function () {
    $('[data-toggle="popover"]').popover()
  });


  function submitDestination(){
    if(document.getElementById('inputDestination').value != undefined && document.getElementById('inputDestination').value != ""){
      var destination = document.getElementById('inputDestination').value;
      var queryString = "?name=" + destination;
      window.location.href = "./city" + queryString;
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
  
  function verify(){
    var user_id = getUserCookie();

    if(user_id == null){
      $("#need-login-error").css("display", "block");
      $("#login-modal").modal();
      return false;
    }

    return true;
  }


  function loadPlaceImage(dest, place_id){
    var request = { 
      placeId: place_id,
    };

    var service = new google.maps.places.PlacesService(document.createElement('places-map'));

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            if(place.photos != undefined && $('#' + dest).attr('src') == null)
              document.getElementById(dest).src = place.photos[Math.floor(Math.random() * place.photos.length)].getUrl();
            else if($('#' + dest).attr('src') == null)
              document.getElementById(dest).src = "img/no-photo-found.png";
        }

        else if($('#' + dest).attr('src') == null)
          document.getElementById(dest).src = "img/no-photo-found.png";
    });
  }
