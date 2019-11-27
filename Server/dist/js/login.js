function loadNavbar(){
  if(hasUserCookies()){
    var user_id = getUserCookie();
    var picture = getPictureCookie();
    var type = getTypeCookie();
    
    if(picture == 'null'){
      picture = 'img/login.png';
    }

    if(document.getElementById("user-id") != null)
      document.getElementById("user-id").value = user_id;

    //if(document.getElementById("my-profile-img") != null)
     // document.getElementById("my-profile-img").src = picture;

      
    document.getElementById("user-profile-pic").src = picture;

    document.getElementById("profile").style.display = 'block';
    document.getElementById("login").style.display = 'none';

    if(type != 'Premium')
      $("#request-poi-btn").addClass("disabled");
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
    });
    attachSignin(document.getElementById('customBtn'));
  });
};

function attachSignin(element) {
  auth2.attachClickHandler(element, {},
      function(googleUser) {
        var profile = googleUser.getBasicProfile();

        $.post("/login-g", {google_id: profile.getId(), name: profile.getName(), username: profile.getEmail(), picture: profile.getImageUrl() + "?sz=250"}, function(result){
          
          setUserCookie(result.user_id, result.picture, result.type);
          window.location.reload();

        });
        

      }, function(error) {
      });
}




function login(type=null) {

  var email;
  var pwd;
  var dest;
  var remember;

  if(type == 'r'){
    email = document.getElementById("inputEmail-2").value;
    pwd = document.getElementById("inputPassword-2").value;
    remember = $('#remember-me-2').is(":checked");
    dest = 'login-error-2';
  }

  else{
    email = document.getElementById("inputEmail").value;
    pwd = document.getElementById("inputPassword").value;
    remember = $('#remember-me').is(":checked");
    dest = 'login-error';
  }


  if(email != "" && pwd != ""){

    $.post("/login-e", {email: email, password: pwd}, function(result){
      
      if(result.user_id == 'error'){
        document.getElementById(dest).style.display = 'block';
      }
      
      else{
        if(remember)
          setUserCookie(result.user_id, result.picture, result.type);
        else
          setSessionCookie(result.user_id, result.picture, result.type);
        
        window.location.href = '/';
      }

    });

  }

}



function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    deleteUserCookie();

    if(document.location.pathname == "/profile" || document.location.pathname == "/trips")
      window.location.href = "/";
    else
      window.location.reload();
  });
}



function setUserCookie(user_id, picture, type){
  var d = new Date();
  d.setTime(d.getTime() + (365*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();

  document.cookie = "user=" + user_id + "; " + expires + ";path=/";
  document.cookie = "picture=" + picture + "; " + expires + ";path=/";
  document.cookie = "type=" + type + "; " + expires + ";path=/";

}


function setSessionCookie(user_id, picture, type){
  document.cookie = "user=" + user_id + ";path=/";
  document.cookie = "picture=" + picture + ";path=/";
  document.cookie = "type=" + type + ";path=/";
}

function hasUserCookies() {
  var user_id = "";
  var picture = "";
  var type = "";

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

    if (c.indexOf("type=") == 0) {
      type = c.substring("type=".length, c.length);
    }
  }

  if(user_id != "" && picture != "" && type != ""){
    return true;
  }

  else{
    return false;
  }


}

function getUserCookie(){
  var user_id = "";

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
  }

  if(user_id != ""){
    return user_id;
  }

  else{
    return null;
  }
}

function getPictureCookie(){
  var picture = "";

  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');

  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];

    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf("picture=") == 0) {
      picture = c.substring("picture=".length, c.length);
    }
  }

  if(picture != ""){
    return picture;
  }

  else{
    return null;
  }
}


function getTypeCookie(){
  var type = "";

  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');

  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];

    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf("type=") == 0) {
      type = c.substring("type=".length, c.length);
    }
  }

  if(type != ""){
    return type;
  }

  else{
    return null;
  }
}

function deleteUserCookie(){
  document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "picture=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "type=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}


/* on enter keyboard click  */

$(function(){
  var input = document.getElementById("inputPassword");

  input.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
    event.preventDefault();
    login();
    }
  });

});