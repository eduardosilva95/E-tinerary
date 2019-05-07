function loadNavbar(){
  if(hasUserCookies()){
    var user_id = getUserCookie();
    var picture = getPictureCookie();

    console.log(picture);
    
    if(picture == 'null'){
      picture = 'img/login.png';
    }

    if(document.getElementById("user-id") != null){
      document.getElementById("user-id").value = user_id;
    }
      
    document.getElementById("user-profile-pic").src = picture;
    document.getElementById("profile-trips").href = "/trips?id=" + user_id;

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
          
        $.post("/login-g", {google_id: profile.getId(), name: profile.getName(), username: profile.getEmail(), picture: profile.getImageUrl()}, function(result){
          
          setUserCookie(result.user_id, result.picture);
          window.location.reload();

        });
        

      }, function(error) {
      });
}


function login(type=null) {

  var email;
  var pwd;
  var dest

  if(type == 'r'){
    email = document.getElementById("inputEmail-2").value;
    pwd = document.getElementById("inputPassword-2").value;
    dest = 'login-error-2';
  }

  else{
    email = document.getElementById("inputEmail").value;
    pwd = document.getElementById("inputPassword").value;
    dest = 'login-error';
  }


  if(email != "" && pwd != ""){

    $.post("/login-e", {email: email, password: pwd}, function(result){
      
      if(result.user_id == 'error'){
        document.getElementById(dest).style.display = 'block';
      }
      
      else{
        setUserCookie(result.user_id, result.picture);
        window.location.reload();
      }

    });

  }


}



function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    deleteUserCookie();
    window.location.reload();
  });
}



function setUserCookie(user_id, picture){
  var d = new Date();
  d.setTime(d.getTime() + (365*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();

  document.cookie = "user=" + user_id + "; " + expires + ";path=/";
  document.cookie = "picture=" + picture + "; " + expires + ";path=/";

}

function hasUserCookies() {
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
    if(document.getElementById("user-id") != null){
      document.getElementById("user-id").value = user_id;
    }
    
    document.getElementById("user-profile-pic").src = picture;
    document.getElementById("profile-trips").href = "/trips?id=" + user_id;

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

function deleteUserCookie(){
  document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "picture=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
