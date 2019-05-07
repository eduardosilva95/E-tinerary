
function verify(){
    if (!document.forms["register-form"].checkValidity()) {
        alert("The input data isn't correct. Verify again and submit");
        return false;
    }

    var gender = document.forms["register-form"]["gender"].value;

    if(gender != "M" && gender != "F"){
        alert("Must specify the gender");
        return false;
    }

    var birthday = document.forms["register-form"]["birthday"].value;

    var minYear = 1902;
    var maxYear = (new Date()).getFullYear();

    var errorMsg = "";

    // regular expression to match required date format
    re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

    if(birthday != '') {
      if(regs = birthday.match(re)) {
        if(regs[1] < 1 || regs[1] > 31) {
          errorMsg = "Invalid value for day: " + regs[1];
        } else if(regs[2] < 1 || regs[2] > 12) {
          errorMsg = "Invalid value for month: " + regs[2];
        } else if(regs[3] < minYear || regs[3] > maxYear) {
          errorMsg = "Invalid value for year: " + regs[3] + " - must be between " + minYear + " and " + maxYear;
        } 
      } else {
        errorMsg = "Invalid date format: " + birthday;
      }
    }

    if(errorMsg != "") {
      alert(errorMsg);
      document.forms["register-form"]["birthday"].focus();
      return false;
    }

    var pwd = document.forms["register-form"]["password"].value;
    var rep_pwd = document.forms["register-form"]["password_repeat"].value;

    if(pwd != rep_pwd){
        alert("Passwords do not match !!");
        return false;
    }


    return true;

}


