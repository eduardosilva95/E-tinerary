
var slide = 0;

$(function () {
  if($('#arrival-date').length > 0){
    $('#arrival-date').datepicker({
      uiLibrary: 'bootstrap4',
      format: 'dd/mm/yyyy',
      minDate: new Date(),
    });

    $('#departure-date').datepicker({
      uiLibrary: 'bootstrap4',
      format: 'dd/mm/yyyy',
      minDate: new Date(),
    });

    $('#arrival-date').change(function() { 
      arr_date = $('#arrival-date').val().split('/')[1] + '/' + $('#arrival-date').val().split('/')[0] + '/' + $('#arrival-date').val().split('/')[2];
      arr_date = new Date(arr_date);

      def_dep_date = new Date(arr_date.getTime()+1000*60*60*24);    
      dep_date = (def_dep_date.getDate()<10?'0':'') + def_dep_date.getDate().toString()  + "/" + ((def_dep_date.getMonth()+1)<10?'0':'') + (def_dep_date.getMonth() + 1).toString() + "/" + def_dep_date.getFullYear();

      $("#departure-date").val(dep_date);
    });
  }
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
    document.getElementById('input-budget').disabled = false;
}
  
function disableBudgetBox(){
    document.getElementById('input-budget').disabled = true;
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


  function verify(){
    var user_id = getUserCookie();
    var isChecked = true;

    if(user_id == null){
      $("#need-login-error").css("display", "block");
      $("#login-modal").modal();
      return false;
    }

    var destination = $("#inputDestination").val();
    var arrival_date = $("#arrival-date").val();
    var departure_date = $("#departure-date").val();
    var num_adults = parseInt($("#select-adults").val());
    var num_children = parseInt($("#select-children").val());
    
    /* check if destination is valid */
    if(!list_cities.includes(destination)){
      $("#invalid-destination").css("display", "block");
      document.getElementById("inputDestination").classList.add("is-invalid");
      isChecked = false;
    }

    var errorMsg = checkDate(arrival_date);

    if(errorMsg != ""){
      $("#invalid-arrival-date").css("display", "block");
      $("#invalid-arrival-date").html(errorMsg);
      document.getElementById("arrival-date").classList.add("is-invalid");
      isChecked = false;
    }

    errorMsg = checkDate(departure_date)

    if(errorMsg != ""){
      $("#invalid-departure-date").css("display", "block");
      $("#invalid-departure-date").html(errorMsg);
      document.getElementById("departure-date").classList.add("is-invalid");
      isChecked = false;
    }

    if(errorMsg == "" && !compareDates(arrival_date, departure_date)){
      $("#invalid-arrival-date").css("display", "block");
      $("#invalid-departure-date").css("display", "block");
      $("#invalid-arrival-date").html('Arrival must occur before departure');
      $("#invalid-departure-date").html('Departure must occur after arrival');
      document.getElementById("arrival-date").classList.add("is-invalid");
      document.getElementById("departure-date").classList.add("is-invalid");
      isChecked = false;
    }

    if(isNaN(num_adults) || num_adults < 1 || num_adults > 8){
      $("#invalid-adults").css("display", "block");
      document.getElementById("select-adults").classList.add("is-invalid");
      isChecked = false;
    }

    if(isNaN(num_children) || num_children < 0 || num_children > 5){
      $("#invalid-children").css("display", "block");
      document.getElementById("select-children").classList.add("is-invalid");
      isChecked = false;
    }

    return isChecked;
  }


  $(function () {
    $('#arrival-date').change(function() { 
      arr_date = $('#arrival-date').val().split('/')[1] + '/' + $('#arrival-date').val().split('/')[0] + '/' + $('#arrival-date').val().split('/')[2];
      arr_date = new Date(arr_date);
  
      def_dep_date = new Date(arr_date.getTime()+1000*60*60*24);    
      dep_date = (def_dep_date.getDate()<10?'0':'') + def_dep_date.getDate().toString()  + "/" + ((def_dep_date.getMonth()+1)<10?'0':'') + (def_dep_date.getMonth() + 1).toString() + "/" + def_dep_date.getFullYear();
  
      $("#departure-date").val(dep_date);
    });
  });


  function checkDate(date){
    var minYear = (new Date()).getFullYear();
    var maxYear = 2030;
    var errorMsg = "";

    // regular expression to match required date format
    re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

    if(date != '') {
      if(regs = date.match(re)) {
        if(regs[1] < 1 || regs[1] > 31) {
          errorMsg = "Invalid value for day: " + regs[1];
        } else if(regs[2] < 1 || regs[2] > 12) {
          errorMsg = "Invalid value for month: " + regs[2];
        } else if(regs[3] < minYear || regs[3] > maxYear) {
          errorMsg = "Invalid value for year: " + regs[3] + " - must be between " + minYear + " and " + maxYear;
        } 
      } else {
        errorMsg = "Invalid date format: " + date;
      }
    }

    if(errorMsg != "") {
      return errorMsg;
    }

    else{
      date = new Date(date.split('/')[1]+"/"+date.split('/')[0]+"/"+date.split('/')[2]);
      if(date < new Date())
        return "Invalid date";
      else
        return errorMsg
    }
  }


  function compareDates(arrival, departure){
    arrival = new Date(arrival.split('/')[1]+"/"+arrival.split('/')[0]+"/"+arrival.split('/')[2]);
    departure = new Date(departure.split('/')[1]+"/"+departure.split('/')[0]+"/"+departure.split('/')[2]);

    if(arrival > departure)
      return false;

    return true;
  }


  /* on enter keyboard click  */

$(function(){
  var input = document.getElementById("inputDestination");

  input.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
    event.preventDefault();
    $('#btn-search-place').trigger('click');
    }
  });

});