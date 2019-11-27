
 var map;


 function initMap() {
   map = new google.maps.Map(document.getElementById('contacts-map'), {
     center: {lat: 40.6330166, lng: -8.659487},
     zoom: 15
   });

   var marker = new google.maps.Marker({position: {lat: 40.6330166, lng: -8.659487}, map: map})


   loadNavbar();

 }