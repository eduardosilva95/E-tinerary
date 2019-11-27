
$(function () {
    $("#help-div").mouseover(function(){
        $("#help-sub-div").css("display", "block");
    });

    $("#help-div").mouseout(function(){
        $("#help-sub-div").css("display", "none");
    });
});


$(function () {
    $("#help-plan-trip-btn" ).click(function() {
        $("#help-breadcrumb-help-page-text").text("> How to plan a trip using e-tinerary ?");
        $("#help-sections").css("display", "none");
        $("#plan-trip-help").css("display", "block");
    });



});