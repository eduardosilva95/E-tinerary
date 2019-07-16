var express = require("express");
var app     = express();
var path    = require("path");
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var mysql = require('mysql');
var http = require('http');
var https = require('https');
var request = require('request');
var cookieParser = require('cookie-parser');
var url = require('url');
var md5 = require('md5');
var multer = require('multer');
var fs = require('fs');
var promise = require('promise-mysql');
const mkdirp = require('mkdirp');
var distance = require('google-distance-matrix');

var GOOGLE_API_KEY = 'AIzaSyAExpmRjci35grh-wAwFxK75c0fV4OHOxw';
var OPEN_WEATHER_API_KEY = '8271fd206ceeef12df4e7bb6063241c3';

distance.key(GOOGLE_API_KEY);


/* store images of users */
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'dist/img/users'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + Math.random().toString(36).substring(2) + path.extname(file.originalname)) //Appending extension
  }
});

/* store images of plans */
var storage_plan = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'dist/img/plans'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() +  '_' + Math.random().toString(36).substring(2) + path.extname(file.originalname)) //Appending extension
  }
});

/* store images of points of interest */
var storage_poi = multer.diskStorage({
  destination: function (req, file, cb) {
  	var dir;
  	if(req.body.poi == undefined)
  		dir = path.join(__dirname, 'dist/img/poi/tmp');
	else
 		dir = path.join(__dirname, 'dist/img/poi/' + req.body.poi);

  	mkdirp(dir, err => cb(err, dir))
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() +  '_' + Math.random().toString(36).substring(2) + path.extname(file.originalname)) //Appending extension
  }
});


var upload = multer({storage: storage});
var upload_plan = multer({storage: storage_plan});
var upload_poi = multer({storage: storage_poi});


var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "placesdb"
});

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//put static files (js, css, images) into /dist directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use(cookieParser());


con.connect(function(err) {
   if (err) throw err;
   console.log("Connected with the DB");
});


// home page 
app.get('/', urlencodedParser, function(req, res){

    var list_cities = [];
    var top_dest = [];
    var top_places = [];
    var recommended_dest = [];

    var number_results = 4; // number of cities and pois to show in the home page sections

    // get the list of cities (name) available in the app
    con.query("call getCities()", function (err, result, fields) {
        if (err) throw err;

        result = result[0];

        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }
    	
    	// get the top N cities with the most plans made
        con.query("call getTopCities(?)", number_results, function (err, result, fields) {
        	if (err) throw err;

        	result = result[0];

        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
        		dest.plans = result[i].plans;
        		top_dest.push(dest);
        	}
    		
    		// get the top N POIs that appear in the most number of plans
        	con.query("call getTopPOIs(?)", number_results, function (err, result, fields) {
	        	if (err) throw err;

	        	result = result[0];

	        	for(var i=0; i<result.length;i++){
	        		var place = new Object();
	        		place.id = result[i].id;
	        		place.place_id = result[i].place_id;
	        		place.name = result[i].name;
	        		place.city = result[i].city;
	        		place.plans = result[i].plans;
	        		top_places.push(place);
	        	}

	        	// get recommended destinations for each user (now its random)
	        	con.query("call getRandomCities(?)", number_results,  function (err, result, fields) {
		        	if (err) throw err;

		        	result = result[0];

		        	for(var i=0; i<result.length;i++){
		        		var dest = new Object();
		        		dest.name = result[i].name;
		        		dest.plans = result[i].plans;
		        		recommended_dest.push(dest);
		        	}

        			res.render(path.join(__dirname+'/templates/index.html'), {cities: list_cities, top_dest: top_dest, top_places: top_places, recommended_dest: recommended_dest});

        		});
        	});
        });     
    });
});


// plan a trip 
app.get('/search',function(req,res){ 

	var list_cities = [];
	var top_dest = [];
    var recommended_dest = [];

    var number_results = 4; // number of cities and pois to show in the home page sections

    // get the list of cities (name) available in the app
    con.query("call getCities()", function (err, result, fields) {
        if (err) throw err;

        result = result[0];

        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }
    	
    	// get the top N cities with the most plans made
        con.query("call getTopCities(?)", number_results, function (err, result, fields) {
        	if (err) throw err;

        	result = result[0];

        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
        		dest.plans = result[i].plans;
        		top_dest.push(dest);
        	}

        	// get recommended destinations for each user (now its random)
        	con.query("call getRandomCities(?)", number_results,  function (err, result, fields) {
	        	if (err) throw err;

	        	result = result[0];

	        	for(var i=0; i<result.length;i++){
	        		var dest = new Object();
	        		dest.name = result[i].name;
	        		dest.plans = result[i].plans;
	        		recommended_dest.push(dest);
	        	}

    			res.render(path.join(__dirname+'/templates/search.html'), {cities: list_cities, top_dest: top_dest, recommended_dest: recommended_dest});

    		});
        });
    });
});




app.get('/search-places',function(req,res){
    con.query("SELECT name FROM City", function (err, result, fields) {
        if (err) throw err;
        var string=JSON.stringify(result);
        var list_cities = []
        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }

        con.query("call GetTopCities(?)", 4, function (err, result, fields) {
        	if (err) throw err;

        	result = result[0];

        	var top_dest = [];
        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
        		dest.plans = result[i].plans;
        		top_dest.push(dest);
        	}

        	res.render(path.join(__dirname+'/templates/search-places.html'), {cities: list_cities, top_dest: top_dest});


    	});
    });
});


// city page
app.get('/places', function (req, res){

	var connection;

	var sort_options = ["az", "za", "reviews", "rating"]; // sort options 
	var default_poi_types = ["Hotel", "Restaurant", "Museum", "Church", "Park"];

	var destination = req.query['dest']; // destination
	var query = ""; // query for a place 
	var page = 1; // current page
	var planId = -1; // ID of plan -> default has no plan 
	var sort = "reviews"; // default sort -> number of reviews
	
	/* filters */
	var hotelsFilter = true;
	var restaurantsFilter = true;
	var museumsFilter = true;
	var churchsFilter = true;
	var parksFilter = true;
	var othersFilter = true;

	var ratingMin = 1.0;
	var ratingMax = 5.0;


	if(req.query['query'] != undefined)
		query = req.query['query'];

	if(req.query['page'] != undefined)
		page = parseInt(req.query['page']);

	if(req.query['plan'] != undefined)
		planId = req.query['plan'];

	if(req.query['sort'] != undefined && sort_options.includes(req.query['sort']))
		sort = req.query['sort'];

	/* check for filters */

	if(req.cookies['hotels_filter'] != undefined){
		if(req.cookies['hotels_filter'] == "false")
			hotelsFilter = false;
	}

	if(req.cookies['restaurants_filter'] != undefined){
		if(req.cookies['restaurants_filter'] == "false")
			restaurantsFilter = false;
	}

	if(req.cookies['museums_filter'] != undefined){
		if(req.cookies['museums_filter'] == "false")
			museumsFilter = false;
	}

	if(req.cookies['churchs_filter'] != undefined){
		if(req.cookies['churchs_filter'] == "false")
			churchsFilter = false;
	}

	if(req.cookies['parks_filter'] != undefined){
		if(req.cookies['parks_filter'] == "false")
			parksFilter = false;
	}

	if(req.cookies['others_filter'] != undefined){
		if(req.cookies['others_filter'] == "false")
			othersFilter = false;
	}

	if(req.cookies['rating_range_filter'] != undefined){
		ratingMin = parseFloat(req.cookies['rating_range_filter'].split('-')[0]);
		ratingMax = parseFloat(req.cookies['rating_range_filter'].split('-')[1]);
	}


	if(isNaN(page))
		return; //send error msg

	var total_results = 9; // number of results per page
	var limit_inf = (page-1) * total_results; // index of first result
	var list_places = [];
	var number_results = 0;
	var list_places_names = [];


	con.query("call getPOIsNamesFromCity(?)", [destination], function (err, result, fields) {
		if (err) throw err;

        result = result[0];

        for(var i=0 ; i < result.length; i++){
        	list_places_names.push(result[i].name);
        }

	});


	con.query("call getPOIsFromCity(?,?,?,?)", [destination, query, planId, sort], function (err, result, fields) {
        if (err) throw err;

        result = result[0];

        if(result[0] == undefined){
			res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
        }

        else if(result[0].id == undefined){
        	city = result[0].city;
        	country = result[0].country;
        } 

        else{
        	city = result[0].city;
        	country = result[0].country;

	        for(var i = 0 ; i < result.length ; i++){

	        	var poi_type = result[i].poi_type.charAt(0).toUpperCase() + result[i].poi_type.slice(1);

	        	var poi_google_rating = null;

	        	if(result[i].rating != null)
	        		poi_google_rating = result[i].rating.toFixed(1);

	        	if(!hotelsFilter && poi_type == "Hotel"){}

	        	else if(!restaurantsFilter && poi_type == "Restaurant"){}

	        	else if(!museumsFilter && poi_type == "Museum"){}

	        	else if(!churchsFilter && poi_type == "Church"){}

	        	else if(!churchsFilter && poi_type == "Church"){}

	        	else if(!parksFilter && poi_type == "Park"){}

	        	else if(!othersFilter && !default_poi_types.includes(poi_type)){}

        		else if(poi_google_rating == null || poi_google_rating < ratingMin || poi_google_rating > ratingMax){}

        		else if(i >= limit_inf && list_places.length < total_results){

		        	var place = new Object();
		        	place["id"] = result[i].id;
		        	place["place_id"] = result[i].place_id;
		            place["name"] = result[i].place;
		            place["type"] = result[i].poi_type.charAt(0).toUpperCase() + result[i].poi_type.slice(1);
		            place["description"] = result[i].description;
		            place["address"] = result[i].address;
		            place["rating"] = result[i].rating;
		            place["num_reviews"] = result[i].num_reviews;
		            place["price_level"] = result[i].price_level;

		            if(result[i].photo != null)
		        		place["photo"] = result[i].photo.replace(/\\/g,"/");
		        	else
		        		place["photo"] = null;

		            if(result[i].start_time != undefined && result[i].end_time != undefined){
		            	st_date = new Date(result[i].start_time);
		            	end_date = new Date(result[i].end_time);

		            	if(st_date.getDate() == "1" || st_date.getDate() == "21" || st_date.getDate() == "31")
		            		day = st_date.getDate() + "st"
		            	else if(st_date.getDate() == "2" || st_date.getDate() == "22")
		            		day = st_date.getDate() + "nd"
		            	else if(st_date.getDate() == "3" || st_date.getDate() == "23")
		            		day = st_date.getDate() + "rd"
		            	else
		            		day = st_date.getDate() + "th"


		            	schedule_str = convertToTextMonth(st_date.getMonth()) +  " " + day + " from " + 
		            	st_date.getHours() + ":" + (st_date.getMinutes()<10?'0':'') + st_date.getMinutes() + " to " + 
		            	end_date.getHours() + ":" + (end_date.getMinutes()<10?'0':'') + end_date.getMinutes();

		            	place["schedule"] = schedule_str;
		            }

		        	list_places.push(place);
		        	number_results++;
		        }

		        else{
		        	number_results++;
		        }

	        }
	    }


    	if(planId != -1){

    		promise.createConnection({
			    host: 'localhost',
			    user: 'root',
			    password: 'password',
			    database: 'placesdb'

			}).then(function(conn){
				connection = conn;

				return connection.query("call isPlanManual(?)", [planId]);

			}).then(function(result){

				var isManual = parseInt(result[0][0].isManual[0]);


				return connection.query("call getVisitTimes(?,?)", [planId, isManual]);


			}).then(function(result){

				result = result[0];

				var start_date = "n/a";
		        var end_date = "n/a";
		        var date_diff = 0;
		        var days = [];

		        // if plan has visits 
		        if(result.length > 0){

		        	start_date = new Date(result[0].start_date);
		        	end_date = new Date(result[0].end_date);

		        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

		        	start_date = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
		        	end_date = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

		        	date_diff = result[0].date_diff;

		        	days = getPlanDays(start_date_aux, parseInt(date_diff));

		        	var list_places_plan = [];
        			var plan = {};

        			for(var i=0 ; i < days.length; i++){
	    				var d = new Date(days[i]);
	    				d = d.getFullYear() + "-" + (d.getMonth()<10?'0':'') + (d.getMonth() + 1)  + "-" + (d.getDate()<10?'0':'') + d.getDate();
	    				plan[d] = [];
	    			}

        			for(var i =0 ; i < result.length; i++){
			        	list_places_plan.push(result[i].poi_id);

    					var visit = new Object();

			        	var start_time = new Date(result[i].start_time);
						var end_time = new Date(result[i].end_time);

						var day = start_time.getFullYear() + "-" + (start_time.getMonth()<10?'0':'') + (start_time.getMonth() + 1)  + "-" + (start_time.getDate()<10?'0':'') + start_time.getDate();

			        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
			        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();

			        	if(plan[day] != undefined){
			        		plan[day].push(visit);
			        	}

			        	else{
			        		plan[day] = [];
			        		plan[day].push(visit);
			        	}
			        }

			        var openslots = getAllOpenSlotsAvailable(plan);

		        	res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, list_places_names: list_places_names, city: city, country: country, number_results: number_results, fromPlan: true, visits: list_places_plan, days: days, openslots: openslots});

		        	return 1;

		        }

		        else{
		        	return 0;
		        }

			}).then(function(result){

				// ignore
				if(result == 1)
					return result;

				return connection.query("call getPlanDates(?)", [planId]);

			}).then(function(result){

				if(result == 1)
					return;

				var start_date = "n/a";
		        var end_date = "n/a";
		        var date_diff = 0;
		        var days = [];

		        if(result.length > 0){

		        	start_date = new Date(result[0].start_date);
		        	end_date = new Date(result[0].end_date);

		        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

		        	start_date = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
		        	end_date = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

		        	date_diff = result[0].date_diff;

		        	days = getPlanDays(start_date_aux, parseInt(date_diff));

		        }

			    var schedules = getSchedules();
			    var openslots = {};

			    for(var i=0 ; i < days.length; i++){
			    	var day = new Date(days[i]);
			    	day = day.getFullYear() + "-" + (day.getMonth()<10?'0':'') + (day.getMonth() + 1)  + "-" + (day.getDate()<10?'0':'') + day.getDate();

			    	for(var j=0; j < schedules.length; j++){
			    		if(openslots[day] != undefined)
							openslots[day].push(schedules[j]);
						else
							openslots[day] = [schedules[j]];
			    	}

			    }
			    
			    res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, list_places_names: list_places_names, city: city, country: country, number_results: number_results, fromPlan: true, visits: [], days: days, openslots: openslots});

			});	        		
    	}


    	else {
			res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, list_places_names: list_places_names, city: city, country: country, number_results: number_results, fromPlan: false, openslots: []});
		}

	});

});


app.get('/place', function(req,res){  	
	var connection;
	var poi_id = req.query['id'];	
	var user_id = 0;

	if(req.cookies['user'] != undefined && !isNaN(req.cookies['user']))
		user_id = parseInt(req.cookies['user']);

	var planId = -1;

	if(req.query['plan'] != undefined)
		planId = req.query['plan'];


	con.query("call getInfoPOI(?,?)", [poi_id, planId], function (err, result, fields) {
	    if (err) throw err;

	    result = result[0];

	    var id = result[0].id;
	    var place_id = result[0].place_id;
		var name = result[0].name;
		var description = result[0].description;
		var address = result[0].address;
		var lat = result[0].latitude;
		var lon = result[0].longitude;
		var google_rating = result[0].google_rating;
		var type = result[0].poi_type.charAt(0).toUpperCase() + result[0].poi_type.slice(1);

		var schedule;

	 	if(result[0].start_time != undefined && result[0].end_time != undefined){
        	st_date = new Date(result[0].start_time);
        	end_date = new Date(result[0].end_time);

        	if(st_date.getDate() == "1" || st_date.getDate() == "21" || st_date.getDate() == "31")
        		day = st_date.getDate() + "st"
        	else if(st_date.getDate() == "2" || st_date.getDate() == "22")
        		day = st_date.getDate() + "nd"
        	else if(st_date.getDate() == "3" || st_date.getDate() == "23")
        		day = st_date.getDate() + "rd"
        	else
        		day = st_date.getDate() + "th"


        	schedule = convertToTextMonth(st_date.getMonth()) +  " " + day + " from " + 
        	st_date.getHours() + ":" + (st_date.getMinutes()<10?'0':'') + st_date.getMinutes() + " to " + 
        	end_date.getHours() + ":" + (end_date.getMinutes()<10?'0':'') + end_date.getMinutes();
        }

        var website = result[0].website;

		if(website == null)
			website = "No information available";

		var phone_number = result[0].phone_number;
			
		if(phone_number == null)
			phone_number = "No information available";


		var no_plans = result[0].no_plans;

		if(no_plans == null)
			no_plans = 0;

		var rating = result[0].rating;

		if(rating == null)
			rating = "No information available";
		else
			rating = parseFloat(rating).toFixed(1) + " / 5.0";

		var accessibility = result[0].accessibility;

		if(accessibility == null)
			accessibility = "No information available";
		else
			accessibility = parseFloat(accessibility).toFixed(1) + " / 5.0";

		var security = result[0].security;
		
		if(security == null)
			security = "No information available";
		else
			security = parseFloat(security).toFixed(1) + " / 5.0";

		var price = result[0].price;

		if(price == null)
			price = "No information available";
		else
			price = parseFloat(price).toFixed(2);

		var duration = result[0].duration;

		if(duration == null)
			duration = "No information available";
		else
			duration = ((parseInt(duration) / 60)<10?'0':'') + (parseInt(duration) / 60)  + ":" + ((parseInt(duration) % 60)<10?'0':'') + (parseInt(duration) % 60);


		con.query("call getPOIReviews(?)", poi_id, function (err, result, fields) {
	    	if (err) throw err;

	    	result = result[0];

	    	var reviews = [];

	    	for(var i=0 ; i < result.length; i++){
	    		var review = new Object();
	    		review["text"] = result[i].review_text
	    		review["rating"] = result[i].review_rating;
	    		review["user"] = result[i].user;
	    		review["user_pic"] = result[i].picture;
	    		review["date"] = getReviewDate(result[i].review_timestamp);
	    		reviews.push(review);
	    	}

	    	con.query("call getPOIPhotos(?)", poi_id, function (err, result, fields) {
	    		if (err) throw err;

	    		result = result[0];

	    		var photos = [];

	    		for(var i=0 ; i < result.length; i++){
	    			photo = result[i].photo_url.replace(/\\/g,"/");
	    			photos.push(photo);
	    		}

	    		con.query("call getUserType(?)", user_id, function (err, result, fields){
	    			if (err) throw err;

	    			result = result[0];

	    			var isUserPremium = false;
	    			var isUserRegistered = false;

	    			if(result.length > 0 && result[0].type_use == 'Premium'){
	    				isUserPremium = true;
	    				isUserRegistered = true;
	    			}

	    			else if(result.length > 0)
	    				isUserRegistered = true;

		    		if(planId == -1)
						res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, id: id, description: description, address: address, lat: lat, lon: lon, google_rating: google_rating, phone_number: phone_number, website: website, type: type, no_plans: no_plans, rating: rating, accessibility: accessibility, security: security, price: price, duration: duration, reviews: reviews, fromPlan: false, schedule: null, openslots: [], photos: photos, isUserRegistered: isUserRegistered, isUserPremium: isUserPremium});

					else {

						promise.createConnection({
						    host: 'localhost',
						    user: 'root',
						    password: 'password',
						    database: 'placesdb'

						}).then(function(conn){
							connection = conn;

							return connection.query("call isPlanManual(?)", [planId]);

						}).then(function(result){

							var isManual = parseInt(result[0][0].isManual[0]);

							return connection.query("call getVisitTimes(?,?)", [planId, isManual]);

						}).then(function(result){

							result = result[0];

							var start_date = "n/a";
					        var end_date = "n/a";
					        var date_diff = 0;
					        var days = [];

					        // if plan has visits 
					        if(result.length > 0){

					        	start_date = new Date(result[0].start_date);
					        	end_date = new Date(result[0].end_date);

					        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

					        	start_date = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
					        	end_date = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

					        	date_diff = result[0].date_diff;

					        	days = getPlanDays(start_date_aux, parseInt(date_diff));

					        	var list_places_plan = [];
			        			var plan = {};

			        			for(var i=0 ; i < days.length; i++){
				    				var d = new Date(days[i]);
				    				d = d.getFullYear() + "-" + (d.getMonth()<10?'0':'') + (d.getMonth() + 1)  + "-" + (d.getDate()<10?'0':'') + d.getDate();
				    				plan[d] = [];
				    			}

			        			for(var i =0 ; i < result.length; i++){
						        	list_places_plan.push(result[i].poi_id);

		        					var visit = new Object();

						        	var start_time = new Date(result[i].start_time);
		    						var end_time = new Date(result[i].end_time);

		    						var day = start_time.getFullYear() + "-" + (start_time.getMonth()<10?'0':'') + (start_time.getMonth() + 1)  + "-" + (start_time.getDate()<10?'0':'') + start_time.getDate();

						        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
						        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();

						        	if(plan[day] != undefined){
						        		plan[day].push(visit);
						        	}

						        	else{
						        		plan[day] = [];
						        		plan[day].push(visit);
						        	}
						        }

						        var openslots = getAllOpenSlotsAvailable(plan);

						        var inPlan = false;
				        		if (list_places_plan.includes(parseInt(poi_id))){
					        		inPlan = true;
				    			}


					        	res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, id: id, description: description, address: address, lat: lat, lon: lon, google_rating: google_rating, phone_number: phone_number, website: website, type: type, no_plans: no_plans, rating: rating, accessibility: accessibility, security: security, price: price, duration: duration, reviews: reviews, fromPlan: true, schedule: schedule, inPlan: inPlan, days: days, openslots: openslots, photos: photos, isUserRegistered: isUserRegistered, isUserPremium: isUserPremium});

					        	return 1;

					        }

					        else{
					        	return 0;
					        }

						}).then(function(result){

						// ignore
							if(result == 1)
								return result;

							return connection.query("call getPlanDates(?)", [planId]);

						}).then(function(result){

							if(result == 1)
								return;

							result = result[0];

							var start_date = "n/a";
					        var end_date = "n/a";
					        var date_diff = 0;
					        var days = [];

					        if(result.length > 0){

					        	start_date = new Date(result[0].start_date);
					        	end_date = new Date(result[0].end_date);

					        	start_date_aux = (start_date.getDate()<10?'0':'') + start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

					        	start_date = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
					        	end_date = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

					        	date_diff = result[0].date_diff;

					        	days = getPlanDays(start_date_aux, parseInt(date_diff));

					        }

						    var schedules = getSchedules();
						    var openslots = {};

						    for(var i=0 ; i < days.length; i++){
						    	var day = new Date(days[i]);
						    	day = day.getFullYear() + "-" + (day.getMonth()<10?'0':'') + (day.getMonth() + 1)  + "-" + (day.getDate()<10?'0':'') + day.getDate();

						    	for(var j=0; j < schedules.length; j++){
						    		if(openslots[day] != undefined)
										openslots[day].push(schedules[j]);
									else
										openslots[day] = [schedules[j]];
						    	}

						    }
						    
						    res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, id: id, description: description, address: address, lat: lat, lon: lon, google_rating: google_rating, phone_number: phone_number, website: website, type: type, no_plans: no_plans, rating: rating, accessibility: accessibility, security: security, price: price, duration: duration, reviews: reviews, fromPlan: true, schedule: schedule, inPlan: false, days: days, openslots: openslots, photos: photos, isUserRegistered, isUserRegistered, isUserPremium: isUserPremium});

						});	        		
		        	}
		        });

	        });

		});
	
	});

});



app.get('/search-hotels',function(req,res){  
   con.query("SELECT name FROM City", function (err, result, fields) {
        if (err) throw err;
        var string=JSON.stringify(result);
        var list_cities = []
        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }
        res.render(path.join(__dirname+'/templates/search-hotels.html'), {cities: list_cities});
    });
});


// hotels page
app.get('/hotels', function(req,res){

	var destination = req.query['dest']; // destination
    var list_hotels = []


	con.query("call getHotels(?)", destination, function (err, result, fields) {
        if (err) throw err;

        result = result[0];

        if(result.length == 0){

        } 

        else{

        	var city = result[0].city;

	        for(var i =0 ; i < result.length; i++){

	        	var hotel = new Object();
	        	hotel["id"] = result[i].id;
	        	hotel["place_id"] = result[i].place_id;
	            hotel["name"] = result[i].place;
	            hotel["city"] = result[i].city;
	            hotel["address"] = result[i].address;
	            hotel["rating"] = result[i].rating;
	        	hotel["coordinates"] = result[i].latitude + ", " + result[i].longitude;

	        	// generate random price / offer between 30€ and 150€
	        	hotel["price"] = Math.floor((Math.random() * 150) + 30) + " €";

	        	list_hotels.push(hotel);
	        }

	        res.render(path.join(__dirname+'/templates/hotels.html'), {hotels: list_hotels, city: city});

        }

	});

});




app.get('/create-plan', function(req, res){

	var num_results = 4;

	var list_cities = [];
	var top_dest = [];
	var recommended_dest = [];

	con.query("call getCities()", function (err, result, fields) {
        if (err) throw err;

        result = result[0];

        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }

       
        con.query("call GetTopCities(?)", num_results, function (err, result, fields) {
        	if (err) throw err;

        	result = result[0];

        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
        		dest.plans = result[i].plans;
        		top_dest.push(dest);
        	}

        	
        	con.query("call GetRandomCities(?)", num_results, function (err, result, fields) {
	        	if (err) throw err;

	        	result = result[0];
	        	
	        	for(var i=0; i<result.length;i++){
	        		var dest = new Object();
	        		dest.name = result[i].name;
	        		dest.plans = result[i].plans;
	        		recommended_dest.push(dest);
	        	}

    			res.render(path.join(__dirname+'/templates/create-plan.html'), {cities: list_cities, top_dest: top_dest, recommended_dest: recommended_dest});

    		});

        });
        
    });

});


app.post('/create-plan', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		// send error message
		return;
	}


	var destination = req.body.destination;

	if(destination == null)
		return; // send error message

	var arrival = req.body.arrival;

	if(arrival == null)
		return; // send error message

	var departure = req.body.departure;

	if(departure == null)
		return; // send error message

	var num_adults = req.body.adults;
	var num_children = req.body.children;
	var hasBudgetConstraint = req.body.has_budget;
	var budget = req.body.budget;
	var travel_mode = req.body.travel_mode;

    promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
		connection = conn;

		var values = [destination,
	    	arrival.split('/')[2] + "-" + (arrival.split('/')[1]<10?'0':'') + arrival.split('/')[1] + "-" + (arrival.split('/')[0]<10?'0':'') + arrival.split('/')[0], 
	    	departure.split('/')[2] + "-" + (departure.split('/')[1]<10?'0':'') + departure.split('/')[1] + "-" + (departure.split('/')[0]<10?'0':'') + departure.split('/')[0],
	    	user_id];

	    var result = connection.query("call createPlan(?, ?, ?, ?)", values);

	    return result;

	}).then(function(result){
		plan_id = parseInt(result[0][0].planID);

		var num_days = diffBetweenDays(arrival, departure);

		arrival = arrival.split('/')[0] + "-" + arrival.split('/')[1] + "-" + arrival.split('/')[2];

  		var days = getPlanDays(arrival, parseInt(num_days), false);

  		var start_hours = ["10:00", "13:00", "15:00", "16:15", "18:00"];
  		var end_hours = ["12:00", "14:30", "16:00", "18:00", "20:00"];

  		var start_time_list = [];
  		var end_time_list = [];

  		for(var i=0 ; i < days.length ; i++){
  			day = days[i].split('-')[2] + "-" + (days[i].split('-')[1]<10?'0':'') + days[i].split('-')[1] + "-" + (days[i].split('-')[0]<10?'0':'') + days[i].split('-')[0]
  			for(var j=0 ; j < start_hours.length; j++){
  				start_time_list.push(day + " " + start_hours[j]);
  				end_time_list.push(day + " " + end_hours[j]);
  			}
  		}

  		var i=0;

  		con.query("call getPOIsIDFromCity(?)", destination, function (err, result, fields) {
	        if (err) throw err;

	        result = result[0];

	        var list_pois_in_plan = [];

	        while(i < start_time_list.length){

	        	if(result.length == list_pois_in_plan.length){
        			break;
        		}
	        	
	        	var poiIsValid = false;

	        	while(!poiIsValid){
	        		var poi = result[parseInt(Math.floor((Math.random() * result.length-1) + 1))].poi;

	        		if(!list_pois_in_plan.includes(poi)){
	        			list_pois_in_plan.push(poi);
	        			poiIsValid = true;
	        		}
	        	}

			  	con.query("call addVisitToPlan(?, ?, ?, ?, ?)", [plan_id, poi, start_time_list[i], end_time_list[i], 0], function (err, result) {
			    	if (err) throw err;

			  	});

			  	i++;	
	  		}
	    });

	    connection.end();


    	console.log("PLAN CREATED: ", plan_id);

    	res.render(path.join(__dirname+'/templates/see-plan.html'), {plan: plan_id});
	});

});


// create plan manual
app.post('/create-plan-m', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		// send error message
		return;
	}

	var destination = req.body.destination;

	if(destination == null)
		return; // send error message

	var arrival = req.body.arrival;

	if(arrival == null)
		return; // send error message

	var departure = req.body.departure;

	if(departure == null)
		return; // send error message


	var num_adults = req.body.adults;
	var num_children = req.body.children;
	var hasBudgetConstraint = req.body.has_budget;
	var budget = req.body.budget;
	var travel_mode = req.body.travel_mode;


    promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'


	}).then(function(conn){
		connection = conn;

		var values = [destination,
	    	arrival.split('/')[2] + "-" + (arrival.split('/')[1]<10?'0':'') + arrival.split('/')[1] + "-" + (arrival.split('/')[0]<10?'0':'') + arrival.split('/')[0], 
	    	departure.split('/')[2] + "-" + (departure.split('/')[1]<10?'0':'') + departure.split('/')[1] + "-" + (departure.split('/')[0]<10?'0':'') + departure.split('/')[0],
	    	user_id];

	    var result = connection.query("call createPlanManual(?, ?, ?, ?)", values);

	    return result;

    }).then(function(result){
    	var plan_id = parseInt(result[0][0].planID);

    	console.log("MANUAL PLAN CREATED: ", plan_id);

    	res.redirect('http://localhost:8080/plan-m?id='+ plan_id)

	});

});

// create a plan from a already created plans
app.post('/create-child-plan', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		// send error message
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		// send error message
		return;
	}

	var start_date = req.body.start_date;

	if(start_date == null)
		return; // send error message

	var end_date = req.body.end_date;

	if(end_date == null)
		return; // send error message


	var start_time_list = [];
	var end_time_list = [];

	promise.createConnection({
		host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
		connection = conn;

	    var result = connection.query("call getInfoPlan(?)", [plan_id]);

    	return result;

	}).then(function(result){

		result = result[0];

		var visits = [];
		var city = result[0].city;


		for(var i=0; i<result.length; i++){
			visits.push(result[i]);
		}

		var num_days = diffBetweenDays(start_date.split('/')[2]+"/"+start_date.split('/')[1]+"/"+start_date.split('/')[0], end_date.split('/')[2]+"/"+end_date.split('/')[1]+"/"+end_date.split('/')[0]);
		days = getPlanDays(start_date.split('/')[2]+"-"+start_date.split('/')[1]+"-"+start_date.split('/')[0], parseInt(num_days), false);

		var k=0;
		var current_date = visits[0].start_time.getFullYear() + "/" + ((visits[0].start_time.getMonth()+1).toString()<10?'0':'') + (visits[0].start_time.getMonth()+1).toString() + "/" + (visits[0].start_time.getDate()<10?'0':'') + visits[0].start_time.getDate();

		for(var i=0; i<visits.length; i++){
			var date = visits[i].start_time.getFullYear() + "/" + ((visits[i].start_time.getMonth()+1).toString()<10?'0':'') + (visits[i].start_time.getMonth()+1).toString() + "/" + (visits[i].start_time.getDate()<10?'0':'') + visits[i].start_time.getDate();
			var st_time = (visits[i].start_time.getHours()<10?'0':'') + visits[i].start_time.getHours() + ":" + (visits[i].start_time.getMinutes()<10?'0':'') + visits[i].start_time.getMinutes();
			var end_time = (visits[i].end_time.getHours()<10?'0':'') + visits[i].end_time.getHours() + ":" + (visits[i].end_time.getMinutes()<10?'0':'') + visits[i].end_time.getMinutes();

			if(current_date != date){
				current_date = date;
				k++;
			}

			var day = days[k].split('-')[2]+"/"+days[k].split('-')[1]+"/"+days[k].split('-')[0];

			start_time_list.push(day + " " + st_time);
			end_time_list.push(day + " " + end_time);

		}

		con.query("call createChildPlan(?,?,?,?,?)", [start_date, end_date, user_id, city, plan_id], function(err, result) {
			if (err) throw err;

			result = result[0];

			var child_plan = result[0].planID;

			var i = 0;

			while(i < start_time_list.length){

				con.query("call addVisitToPlan(?,?,?,?, ?);", [child_plan, visits[i].poi_id, start_time_list[i], end_time_list[i], 0], function (err, result) {
			    	if (err) throw err;
			  	});

		  		i++;
			}

			console.log("PLAN CREATED: ", child_plan)

			res.contentType('json');
			res.send({result: 'success', plan: child_plan});

		});
	});
});


app.post('/delete-plan', function(req, res){

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error'});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error'});
		return;
	}


	con.query("call deletePlan(?,?)", [plan_id, user_id], function(err, result) {
		if (err) throw err;

		res.contentType('json');
		res.send({result: 'success'});

	});

});


app.post('/rename-plan', function(req, res){
	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	var name = req.body.name;

	if(name == undefined || name == null || name == ""){
		res.contentType('json');
		res.send({result: 'error', msg: "The name of the trip is not valid."});
		return;
	}


	con.query("call renamePlan(?,?,?)", [plan_id, user_id, name], function(err, result) {
		if (err) throw err;

		res.contentType('json');
		res.send({result: 'success'});

	});

});



app.post('/share-plan', upload_plan.single('picture'), function (req, res, next){
	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	var filename = req.file.filename;
	var description = req.body.description;
	var category = req.body.category;
	var rating = req.body.rating;	


	con.query("call sharePlan(?,?,?,?,?,?)", [plan_id, user_id, description, filename, category, rating], function (err, result, fields) {
		if (err) throw err;

    	res.redirect('http://localhost:8080/trips');

	});

});



app.post('/review-plan', function(req, res){

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	var review = null;

	if(req.body.review != undefined)
		review = req.body.review;

	var rating = parseInt(req.body.rating);	

	if(isNaN(rating)){
		res.contentType('json');
		res.send({result: 'error', msg: "The rating is not valid."});
		return;
	}

	con.query("call reviewPlan(?,?,?,?)", [plan_id, user_id, rating, review], function (err, result, fields) {
		if (err) throw err;

		res.contentType('json');
		res.send({result: 'success'});

	});
});


app.post('/archive-plan', function(req, res){
	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	con.query("call archivePlan(?,?)", [plan_id, user_id], function (err, result, fields) {
		if (err) throw err;

    	res.contentType('json');
		res.send({result: 'success'});

	});
});




app.post('/save-plan', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}


	promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
		connection = conn;

	    var result = connection.query("call getOwnerOfPlanManual(?)", [plan_id]);

	    return result;
	}).then(function(result){

		if(result[0][0].user == user){
			connection.query("call savePlanManual(?)", [plan_id]);

			connection.end();

			res.contentType('json');
			res.send({result: 'success'});

		}

		else{
			res.contentType('json');
			res.send({result: 'error'});
		}

	});

});


app.post('/favorite-plan', function(req, res){
	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	con.query("call setFavoritePlan(?,?)", [user_id, plan_id], function (err, result, fields) {
    	if (err){
    		throw err;
    		res.send(JSON.stringify('error'));
    	}

    	res.send(JSON.stringify('success'));

    });

});



app.post('/unfavorite-plan', function(req, res){
	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	con.query("call unfavoritePlan(?,?)", [user_id, plan_id], function (err, result, fields) {
    	if (err){
    		throw err;
    		res.send(JSON.stringify('error'));
    	}

    	res.send(JSON.stringify('success'));

    });


});



app.post('/user-interested', function(req, res){

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	con.query("call setUserInterested(?,?)", [user_id, plan_id], function (err, result, fields) {
    	if (err){
    		throw err;
    		res.send(JSON.stringify('error'));
    	}

    	res.send(JSON.stringify('success'));
    });

});




app.post('/user-not-interested', function(req, res){

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	con.query("call unsetUserInterested(?,?)", [user_id, plan_id], function (err, result, fields) {
    	if (err){
    		throw err;
    		res.send(JSON.stringify('error'));
    	}

    	res.send(JSON.stringify('success'));

    });
});



app.post('/add-visit', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	var poi_id = req.body.poi;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The place is not valid."});
		return;
	}

	var schedule = req.body.schedule;

	var isManual;

	promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

    }).then(function(conn){
    	connection = conn;

		return connection.query("call isPlanManual(?)", [plan_id]);

	}).then(function(result){

		isManual = parseInt(result[0][0].isManual[0]);

		return connection.query("call getVisitTimes(?,?)", [plan_id, isManual]);

	}).then(function(result){

		result = result[0];

		var plan = {};

        // if plan has visits 
        if(result.length > 0){

        	for(var i=0; i < result.length; i++){
	        	var visit = new Object();

	        	var start_time = new Date(result[i].start_time);
	        	var end_time = new Date(result[i].end_time);

	        	var day = start_time.getFullYear() + "-" + (start_time.getMonth()<10?'0':'') + (start_time.getMonth() + 1)  + "-" + (start_time.getDate()<10?'0':'') + start_time.getDate();

	        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
	        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();

	        	if(plan[day] != undefined){
	        		plan[day].push(visit);
	        	}

	        	else{
	        		plan[day] = [];
	        		plan[day].push(visit);
	        	}
	        }


	        var chosen_schedule;

	        if(schedule != undefined){
	        	chosen_schedule = getFinalSchedule(schedule.split(" ")[0], schedule.split(" ")[1]);
	        }
	        else
	    		chosen_schedule = getPlanOpenSlot(plan);


	    	if(chosen_schedule != false){

				connection.query("call addVisitToPlan(?,?,?,?,?)", [plan_id, poi_id, chosen_schedule[0], chosen_schedule[1], isManual], function (err, result) {
		    		if (err) throw err;
				  	
		    		res.contentType('json');

		    		if(isManual == 1)
						res.send({result: 'success', isManual: true});
					else
						res.send({result: 'success', isManual: false});
				});

	        }

	        else{
				res.contentType('json');
				res.send({result: 'error', msg: 'schedule error'});
	        }

	        return 1;

        }

        else{
        	return connection.query("call getPlanDates(?)", [plan_id]);

        }

	}).then(function(result){

		if(result == 1)
			return;

		result = result[0];

		var chosen_schedule;

        if(schedule != undefined){
    		chosen_schedule = getFinalSchedule(schedule.split(" ")[0], schedule.split(" ")[1]);
        }

        else{
        	day = new Date(result[0].start_date);
			day = day.getFullYear() + "-" + (day.getMonth()<10?'0':'') + (day.getMonth() + 1)  + "-" + (day.getDate()<10?'0':'') + day.getDate();

			var schedules = getSchedules();
			chosen_schedule = getFinalSchedule(day, schedules[0]);

        }

		if(chosen_schedule != false){
        	
        	connection.query("call addVisitToPlan(?,?,?,?,?)", [plan_id, poi_id, chosen_schedule[0], chosen_schedule[1], isManual], function (err, result) {
	    		if (err) throw err;
			  	
	    		res.contentType('json');

				console.log("ADDED VISIT " + req.body.poi + " TO THE PLAN " + req.body.plan);

	    		if(isManual == 1)
					res.send({result: 'success', isManual: true});
				else
					res.send({result: 'success', isManual: false});
			});

        }

        else{

			res.contentType('json');
			res.send({result: 'error', msg: 'schedule error'});

        }

	});

});




app.post('/delete-visit', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var plan_id = req.body.plan;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	var poi_id = req.body.poi;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The place is not valid."});
		return;
	}

	var isManual;

	promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
    	connection = conn;

		return connection.query("call isPlanManual(?)", [planId]);

	}).then(function(result){

		isManual = parseInt(result[0][0].isManual[0]);

	    var result = connection.query("call getOwnerOfPlan;", [plan_id]);

	    return result;

	}).then(function(result){

		if(result[0][0].user == user){

			result = connection.query("call deleteVisit(?,?,?)", [plan_id, poi_id, isManual]);
	    	connection.end();

			res.contentType('json');
			res.send({result: 'success'});

		}

		else{
			res.contentType('json');
			res.send({result: 'error'});
		}

	});
});




app.get('/plan', function(req, res){
	var connection;

	var user_id = req.cookies['user'];
	var plan_id = parseInt(req.query['id']);
	var view_method = req.query['v'];

	if(isNaN(plan_id)){
		res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
	}

	var start_date = "n/a";
    var end_date = "n/a";
    var city = "";
    var name;
    var date_diff = 0;
    var isPublic = 0;
    var source;
    var num_viewers = 0;

	con.query("call getVisitsFromPlan(?, ?)", [user_id, plan_id], function (err, result, fields) {
		if (err) throw err;

		result = result[0];

		/* atributos do plano */
		if(result.length > 0){

			start_date = new Date(result[0].start_date);
        	end_date = new Date(result[0].end_date);

        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

        	start_date = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
        	end_date = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

        	date_diff = result[0].date_diff;

        	city = result[0].city;

        	city_latitude = result[0].city_latitude;
        	city_longitude = result[0].city_longitude;

        	days = getPlanDays(start_date_aux, parseInt(date_diff));

        	if(result[0].plan_name != null && result[0].plan_name.length > 0)
        		name = result[0].plan_name;
        	else
        		name = 'Your visit to ' + city;

        	isPublic = result[0].isPublic[0];

        	if(parseInt(result[0].user) == parseInt(user_id))
        		source = "author";
        	else
        		source = "viewer";

        	num_viewers = result[0].num_viewers;

		}



		var plan = [];

        for(var i=0; i < result.length; i++){
        	var visit = new Object();

        	/* atributos da visita */
        	var start_time = new Date(result[i].start_time);
        	var end_time = new Date(result[i].end_time);

        	visit["day"] = (start_time.getDate()<10?'0':'') + start_time.getDate() + " " + convertToTextMonth(start_time.getMonth()) + " " + start_time.getFullYear();
        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();
        	
        	/* atributos do POI */

        	visit["id"] = result[i].id;
        	visit["name"] = result[i].name;
        	visit["place_id"] = result[i].place_id;
        	visit["address"] = result[i].address;
        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
        	visit["poi_type"] = result[i].poi_type;
        	visit["city"] = result[i].city; 

        	if(result[i].photo != null)
        		visit["photo"] = result[i].photo.replace(/\\/g,"/");
        	else
        		visit["photo"] = null;

        	var website = result[i].website;
			if(website == null)
				website = "No information available";

        	visit["website"] = website;

        	var phone_number = result[i].phone_number;
			if(phone_number == null)
				phone_number = "No information available";

        	visit["phone_number"] = phone_number;


        	var no_plans = result[i].no_plans;
			if(no_plans == null)
				no_plans = 0;

			visit["no_plans"] = no_plans;

			var rating = result[i].rating;
			if(rating == null)
				rating = "No information available";
			else
				rating = parseFloat(rating).toFixed(1) + " / 5.0";

			visit["rating"] = rating;

			var accessibility = result[i].accessibility;
			if(accessibility == null)
				accessibility = "No information available";
			else
				accessibility = parseFloat(accessibility).toFixed(1) + " / 5.0";

			visit["accessibility"] = accessibility;

			var security = result[i].security;	
			if(security == null)
				security = "No information available";
			else
				security = parseFloat(security).toFixed(1) + " / 5.0";

			visit["security"] = security;

			var price = result[i].price;
			if(price == null)
				price = "No information available";
			else
				price = parseFloat(price).toFixed(2);

			visit["price"] = price;

			var duration = result[i].duration;
			if(duration == null)
				duration = "No information available";
			else
				duration = ((parseInt(duration) / 60)<10?'0':'') + (parseInt(duration) / 60)  + ":" + ((parseInt(duration) % 60)<10?'0':'') + (parseInt(duration) % 60);

			visit["duration"] = duration;

			visit["distance_km"] = null;
			visit["deslocation_duration"] = null;

        	plan.push(visit);
        }


        /* obter o tempo */

        var weather = [];
        var weather_icons = [];
        var count = 0;
        var times = [];

		for(var i=0; i < plan.length; i++){
			times[i] = [plan[i].day, plan[i].start_time];

			var url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + parseFloat(plan[i].coordinates.split(',')[0]) + "&lon=" + parseFloat(plan[i].coordinates.split(',')[1]) + "&appid=" + OPEN_WEATHER_API_KEY + "&units=metric";

			https.get(url, (res) => {
			  	var body ='';
				res.on('data', function(chunk) {
			  		body += chunk;
				});

				res.on('end', function() {
					body = JSON.parse(body);
					var info = body["list"];
					hour = getWeatherClosestHour(times[count]);

					var found = false;
					for(var i=0; i < info.length; i++){
						if(info[i]["dt_txt"] == hour) {
							weather.push(info[i]["weather"][0]["main"] + " " + Math.round(info[0]["main"]["temp"]));
							weather_icons.push(info[i]["weather"][0]["icon"]); 
							found = true;
							break;
						}
					}

					if(!found)
						weather.push(null);

					count++;

				});

			}).on('error', (e) => {
			  console.error(e);
			});
		}


        sleep(500).then(() => {

		    for(var i=0; i < weather.length; i++){
		    	plan[i]["weather"] = weather[i];
		    	plan[i]["weather_icon"] = weather_icons[i];
		    }


		    /* obter a matriz das distancias */

		    /*for(var i=0; i < date_diff + 1; i++){
		    	var day = days[i].split(', ')[1];
		    	var locations = {};

		    	for(var j=0; j<plan.length; j++){
		    		if(plan[j].day == day)

		    	}


		    }*/

		    


		    promise.createConnection({
    			host: 'localhost',
			    user: 'root',
			    password: 'password',
			    database: 'placesdb'

			}).then(function(conn){
				connection = conn;

				var result = connection.query("call getCityIDFromPlan(?)", [plan_id]);

				return result;

			}).then(function(result){
				var city_id = result[0][0].city;

				/* obter sugestões */

		        con.query("call getOtherSuggestionsFromPlan(?, ?)", [plan_id, city_id], function (err, result, fields) {
		        	if (err) throw err;

		        	result = result[0];

		        	var suggested_visits = []; // lista com POIs sugeridos
		        	var suggested_hotels = []; // lista com Hoteis sugeridos
		        	var size = 6; // numero de sugestões
		        	var total_hotels = 0;

		        	if(result.length < size)
		        		size = result.length;

		        	for(var i=0; i < result.length; i++){
		        		if(result[i].poi_type == 'Hotel')
			        		total_hotels++;
			        }

			        var i = 0;

		        	while(suggested_hotels.length + suggested_visits.length < size){
			        	var visit = new Object();
			        	visit["id"] = result[i].id;
			        	visit["name"] = result[i].name;
			        	visit["place_id"] = result[i].place_id;

			        	if(result[i].poi_type == 'Hotel' && suggested_hotels.length < Math.floor(size / 2))
			        		suggested_hotels.push(visit);
			        	else if (suggested_visits.length < Math.ceil(size / 2) || suggested_hotels.length == total_hotels)
			        		suggested_visits.push(visit);

			        	i = (i + 1) % result.length;
			        }

					con.query("call getPlanReviews(?)", plan_id, function (err, result, fields) {
				    	if (err) throw err;

				    	result = result[0];

				    	var reviews = [];

				    	for(var i=0 ; i < result.length; i++){
				    		var review = new Object();
				    		review["text"] = result[i].review_text
				    		review["rating"] = result[i].review_rating;
				    		review["user"] = result[i].user;
				    		review["user_pic"] = result[i].picture;
				    		review["date"] = getReviewDate(result[i].review_timestamp);
				    		reviews.push(review);
				    	}

							    
				        con.query("call getPlanStats(?)", plan_id, function (err, result, fields) {
			        		if (err) throw err;

			        		result = result[0];

			        		var rating = "0.0";
			        		var num_reviews = 0;

			        		if(result.length > 0){
			        			num_reviews = result[0].num_reviews;
			        			if(result[0].rating != null)
			        				rating = result[0].rating.toFixed(1);
			        		}

					        con.query("call getSharedPlansFromPlan(?)", plan_id, function (err, result, fields) {
				        		if (err) throw err;

				        		result = result[0];

				        		var num_plans = 0;

				        		if(result.length > 0)
				        			num_plans = result[0].num_plans;

				        		if(source != "author"){
				        			if(isPublic == "1"){
					        			con.query("call isUserInterested (?, ?)", [user_id, plan_id], function (err, result, fields) {
					        				if (err) throw err;

					        				isInterested = result[0][0].isInterested;

					        				data = {plan_id: plan_id, name: name, plan: plan, start_date: start_date, end_date: end_date, city: city, city_latitude: city_latitude, city_longitude: city_longitude, days: days, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels, source: source, isPublic: isPublic, isManual: 0, reviews: reviews, num_viewers: num_viewers, rating: rating, num_reviews: num_reviews, num_plans: num_plans, isInterested: isInterested};

					        				if(view_method == "full")
					        					res.render(path.join(__dirname+'/templates/full-plan.html'), data);
					        				else if(view_method == "map")
					        					res.render(path.join(__dirname+'/templates/map.html'), data);
					        				else
					        					res.render(path.join(__dirname+'/templates/plan.html'), data);

					        			});
				        			}
						        		
					        		else
						        		res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
				        		}

				        		else{

				        			data = {plan_id: plan_id, name: name, plan: plan, start_date: start_date, end_date: end_date, city: city, city_latitude: city_latitude, city_longitude: city_longitude, days: days, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels, source: source, isPublic: isPublic, isManual: 0, reviews: reviews, num_viewers: num_viewers, rating: rating, num_reviews: num_reviews, num_plans: num_plans, isInterested: 0};

				        			if(view_method == "full")
			        					res.render(path.join(__dirname+'/templates/full-plan.html'), data);
			        				else if(view_method == "map")
			        					res.render(path.join(__dirname+'/templates/map.html'), data);
			        				else
			        					res.render(path.join(__dirname+'/templates/plan.html'), data);
					        		
				        		}

			        		});
		        		});
	        		});
        		});
			}).then(function(result){
			    result = connection.query("call updatePlanViewers (?)", [plan_id]);
			    connection.end();
			});
		});

	});

});





app.get('/plan-m', function(req,res){
	var connection;

	var user_id = req.cookies['user'];
	var plan_id = parseInt(req.query['id']);

	if(isNaN(plan_id)){
		res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
		return;
	}

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var start_date = "n/a";
    var end_date = "n/a";
    var city = "";
    var name;
    var date_diff = 0;
    var isPublic = 0;
    var source;
    var num_viewers = 0;


	con.query("call getVisitsFromPlan(?, ?)", [user_id, plan_id], function (err, result, fields) {
		if (err) throw err;

		result = result[0];

		/* atributos do plano */
		if(result.length > 0){

			start_date = new Date(result[0].start_date);
        	end_date = new Date(result[0].end_date);

        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

        	start_date = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
        	end_date = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

        	date_diff = result[0].date_diff;

        	city = result[0].city;

        	city_latitude = result[0].city_latitude;
        	city_longitude = result[0].city_longitude;

        	days = getPlanDays(start_date_aux, parseInt(date_diff));

        	if(result[0].plan_name != null && result[0].plan_name.length > 0)
        		name = result[0].plan_name;
        	else
        		name = 'Your visit to ' + city;

        	isPublic = result[0].isPublic[0];

        	if(parseInt(result[0].user) == parseInt(user_id))
        		source = "author";
        	else
        		source = "viewer";

        	num_viewers = result[0].num_viewers;

		}

		else{

			con.query("call getPlanDates(?)", [plan_id], function (err, result, fields) {
		        if (err) throw err;

		        result = result[0];

		        if(result.length > 0){
		        	start_date = new Date(result[0].start_date);
		        	end_date = new Date(result[0].end_date);

		        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

		        	start_date = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
		        	end_date = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

		        	date_diff = result[0].date_diff;

		        	city = result[0].city;

		        	days = getPlanDays(start_date_aux, parseInt(date_diff));

		        	if(result[0].plan_name != null && result[0].plan_name.length > 0)
		        		name = result[0].plan_name;
		        	else
		        		name = 'Your visit to ' + city;
	        	}


	        	else{
					res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
					return;
	        	}
	        });

		}

		var plan = [];

        for(var i=0; i < result.length; i++){
        	var visit = new Object();

        	/* atributos da visita */
        	var start_time = new Date(result[i].start_time);
        	var end_time = new Date(result[i].end_time);

        	visit["day"] = (start_time.getDate()<10?'0':'') + start_time.getDate() + " " + convertToTextMonth(start_time.getMonth()) + " " + start_time.getFullYear();
        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();
        	
        	/* atributos do POI */

        	visit["id"] = result[i].id;
        	visit["name"] = result[i].name;
        	visit["place_id"] = result[i].place_id;
        	visit["address"] = result[i].address;
        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
        	visit["poi_type"] = result[i].poi_type;
        	visit["city"] = result[i].city; 

        	if(result[i].photo != null)
        		visit["photo"] = result[i].photo.replace(/\\/g,"/");
        	else
        		visit["photo"] = null;

        	var website = result[i].website;
			if(website == null)
				website = "No information available";

        	visit["website"] = website;

        	var phone_number = result[i].phone_number;
			if(phone_number == null)
				phone_number = "No information available";

        	visit["phone_number"] = phone_number;


        	var no_plans = result[i].no_plans;
			if(no_plans == null)
				no_plans = 0;

			visit["no_plans"] = no_plans;

			var rating = result[i].rating;
			if(rating == null)
				rating = "No information available";
			else
				rating = parseFloat(rating).toFixed(1) + " / 5.0";

			visit["rating"] = rating;

			var accessibility = result[i].accessibility;
			if(accessibility == null)
				accessibility = "No information available";
			else
				accessibility = parseFloat(accessibility).toFixed(1) + " / 5.0";

			visit["accessibility"] = accessibility;

			var security = result[i].security;	
			if(security == null)
				security = "No information available";
			else
				security = parseFloat(security).toFixed(1) + " / 5.0";

			visit["security"] = security;

			var price = result[i].price;
			if(price == null)
				price = "No information available";
			else
				price = parseFloat(price).toFixed(2);

			visit["price"] = price;

			var duration = result[i].duration;
			if(duration == null)
				duration = "No information available";
			else
				duration = ((parseInt(duration) / 60)<10?'0':'') + (parseInt(duration) / 60)  + ":" + ((parseInt(duration) % 60)<10?'0':'') + (parseInt(duration) % 60);

			visit["duration"] = duration;

			visit["distance_km"] = null;
			visit["deslocation_duration"] = null;

        	plan.push(visit);
        }

        promise.createConnection({
			host: 'localhost',
		    user: 'root',
		    password: 'password',
		    database: 'placesdb'

		}).then(function(conn){
			connection = conn;

			var result = connection.query("call getCityIDFromPlan(?)", [plan_id]);

			return result;

		}).then(function(result){
			var city_id = result[0][0].city;

			/* obter sugestões */

	        con.query("call getOtherSuggestionsFromPlan(?, ?)", [plan_id, city_id], function (err, result, fields) {
	        	if (err) throw err;

	        	result = result[0];

	        	var suggested_visits = []; // lista com POIs sugeridos
	        	var suggested_hotels = []; // lista com Hoteis sugeridos
	        	var size = 6; // numero de sugestões
	        	var total_hotels = 0;

	        	if(result.length < size)
	        		size = result.length;

	        	for(var i=0; i < result.length; i++){
	        		if(result[i].poi_type == 'Hotel')
		        		total_hotels++;
		        }

		        var i = 0;

	        	while(suggested_hotels.length + suggested_visits.length < size){
		        	var visit = new Object();
		        	visit["id"] = result[i].id;
		        	visit["name"] = result[i].name;
		        	visit["place_id"] = result[i].place_id;

		        	if(result[i].poi_type == 'Hotel' && suggested_hotels.length < Math.floor(size / 2))
		        		suggested_hotels.push(visit);
		        	else if (suggested_visits.length < Math.ceil(size / 2) || suggested_hotels.length == total_hotels)
		        		suggested_visits.push(visit);

		        	i = (i + 1) % result.length;
		        }

		        res.render(path.join(__dirname+'/templates/full-plan.html'), {plan_id: plan_id, name: name, plan: plan, start_date: start_date, end_date: end_date, city: city, days: days, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels, source: "author", isPublic: 0, isManual: 1, reviews: [], num_viewers: 0, rating: 0, num_reviews: 0, num_plans: 0});

		    });

	    });

    });

});





app.get('/calendar', function(req, res){
	res.render(path.join(__dirname+'/templates/calendar.html'),);
});





app.get('/trips', function(req, res){

	var user_id = -1;

	if(req.cookies['user'] != undefined && !isNaN(parseInt(req.cookies['user'])))
		user_id = parseInt(req.cookies['user']);

	if(user_id != -1){

		con.query("call getUserPlans(?)", user_id, function (err, result, fields) {
	        if (err) throw err;

	        result = result[0];

	        var scheduled_trips = [];
	        var past_trips = [];

	        for(var i=0 ; i < result.length; i++){

	        	var plan = new Object();
	        	plan["id"] = result[i].plan_id;

	        	if(result[i].name != null && result[i].name.length > 0)
	        		plan["name"] = result[i].name;
	        	else
	        		plan["name"] = 'Visit to ' + result[i].city;

	        	plan["city"] = result[i].city;

	        	plan["isPublic"] = result[i].isPublic[0];
	        	plan["isFavorite"] = result[i].isFavorite[0];

	        	plan["photo"] = result[i].photo;

	        	start_date = new Date(result[i].start);
	        	end_date = new Date(result[i].end);
	        	now = new Date();

	        	plan["start"] = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
	        	plan["end"] = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

	        	if(start_date < now){
	        		past_trips.push(plan);
	        	}

	        	else{
	        		scheduled_trips.push(plan);
	        	}
	        }

	        sortTrips(scheduled_trips,"cresc");
	        sortTrips(past_trips,"desc");

			res.render(path.join(__dirname+'/templates/trips.html'),  {past_trips: past_trips, scheduled_trips: scheduled_trips});
	    });
	}

	else{

		// mensagem a dizer que tem estar logado
		
		res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
	}


});


// login usando o GOOGLE
app.post('/login-g', function(req, res){

	var googleID = req.body.google_id;
	var username = req.body.username;
	var name = req.body.name;
	var picture = req.body.picture;

	con.query("call loginWithGoogle(?,?,?,?)", [googleID, username, name, picture], function (err, result, fields) {
    	if (err) throw err;

    	result = result[0];

    	if(result[0].error != undefined){
    		console.log("ERROR " + result[0].error);
    		return;
    	}

	 	var user_id = result[0].id;
       	var picture = result[0].picture;

		res.contentType('json');
		res.send({user_id: user_id, picture: picture});

	});

});




app.post('/login-e', function(req, res){
	var username = req.body.email;
	var password = md5(req.body.password);

	con.query("call login(?)", [username], function (err, result, fields) {
    	if (err) throw err;

    	result = result[0];

    	if(parseInt(result.length) == 1){

			if(result[0].password == password){

	    	 	var user_id = result[0].id;
		       	var picture = result[0].picture;

      			res.contentType('json');
				res.send({user_id: user_id, picture: picture});

			}

			else{
				res.contentType('json');
				res.send({user_id: 'error', picture: 'wrong password'});
			}

		}

		else{

      		res.contentType('json');
			res.send({user_id: 'error', picture: 'email not found'});

		}
	});
});



app.get('/register', function(req, res){
	res.render(path.join(__dirname+'/templates/register.html'), {isRegistered: false, alreadyExists: false});
});



app.post('/register', upload.single('photo'), function (req, res, next){

	var username = req.body.email;
	var name = req.body.fname + " " + req.body.lname;
	var country = req.body.country;
	var phone_number = req.body.phone;

	if(phone_number == '')
		phone_number = null;
	
	var picture = null;

	if(req.file)
		picture = req.file.path.split('dist')[1];

	var birthday = req.body.birthday;

	if(birthday != null)
		birthday = birthday.split('/')[2] + "-" + birthday.split('/')[1] + "-" + birthday.split('/')[0];

	var gender = req.body.gender;

	if(gender != 'M' || gender != 'F')
		gender = null;


	var password = md5(req.body.password);

	con.query("call register(?,?,?,?,?,?,?,?)", [username, name, picture, birthday, gender, country, phone_number, password], function (err, result, fields) {
    	if (err) throw err;

    	result = result[0];

    	if(result[0].error != undefined){
    		console.log("ERROR " + result[0].error);

    		res.render(path.join(__dirname+'/templates/register.html'), {isRegistered: false, alreadyExists: true});

    	}

    	else{

		 	var user_id = result[0].id;
	       	var picture = result[0].picture;

	       	res.render(path.join(__dirname+'/templates/register.html'), {isRegistered: true, alreadyExists: false});

		}

	});
});




app.get('/profile', function(req, res){

	var user_id = req.cookies['user'];

	var sql = "call getInfoUser(?)";
	var values = [user_id];

	con.query(sql, values, function (err, result, fields) {
        if (err) throw err;

        result = result[0][0];

        var name = "";
        var picture = "";
        var birthday = "";
        var address = "";
        var phone_number = "";
        var gender = "";
        var country = "";
        var username = "";


        name = result.name;
        picture = result.picture;
        username = result.username;

        if(result.birthday != null)
        	birthday = result.birthday;

        if(result.address != null)
        	address = result.address;

        if(result.phone_number != null)
        	phone_number = result.phone_number;

        if(result.gender != null)
        	gender = result.gender;

        if(result.country != null)
        	country = result.country;


        res.render(path.join(__dirname+'/templates/profile.html'), {name: name, picture: picture, birthday: birthday, address: address, phone_number: phone_number, gender: gender, country: country, username: username});

	});
	
});


app.post('/edit-profile', function(req, res){

	var user_id = req.cookies['user'];
	var field = req.body['field'];
	var value = req.body['value'];

	if(field == "Name"){
		var sql = "select editUserName(?, ?);";
		var values = [value, user_id];

		con.query(sql, values, function (err, result, fields) {
        	if (err){
        		throw err;
        		res.send(JSON.stringify('error'));
        	}

        	res.send(JSON.stringify('success'));

        });
	}

	else if(field == "Birthday"){

		if(value.split('/').length != 3){
			res.send(JSON.stringify('error'));
			return;
		}

		value = value.split('/')[2] + "-" + value.split('/')[1] + "-" + value.split('/')[0];

		var sql = "select editUserBirthday(?, ?);";
		var values = [value, user_id];

		con.query(sql, values, function (err, result, fields) {
        	if (err){
        		throw err;
        		res.send(JSON.stringify('error'));
        	}

        	res.send(JSON.stringify('success'));

        });
	}

	else if(field == "Country"){
		var sql = "select editUserCountry(?, ?);";
		var values = [value, user_id];

		con.query(sql, values, function (err, result, fields) {
        	if (err){
        		throw err;
        		res.send(JSON.stringify('error'));
        	}

        	res.send(JSON.stringify('success'));

        });
	}

	else if(field == "Address"){
		var sql = "select editUserAddress(?, ?);";
		var values = [value, user_id];

		con.query(sql, values, function (err, result, fields) {
        	if (err){
        		throw err;
        		res.send(JSON.stringify('error'));
        	}

        	res.send(JSON.stringify('success'));

        });
	}

	if(field == "Phone Number"){
		var sql = "select editUserPhoneNumber(?, ?);";
		var values = [value, user_id];

		con.query(sql, values, function (err, result, fields) {
        	if (err){
        		throw err;
        		res.send(JSON.stringify('error'));
        	}

        	res.send(JSON.stringify('success'));

        });
	}



});


app.post('/edit-profile-picture', upload.single('photo'), function (req, res, next){

	var user_id = req.cookies['user'];

	var picture_url = req.file.path.split('dist')[1];

	var sql = "select Edit_User_Picture(?, ?);";
	var values = [picture_url, user_id];

	con.query(sql, values, function (err, result, fields) {
    	if (err){
    		throw err;
    		//res.send(JSON.stringify('error'));
    	}

    	res.cookie('picture', picture_url);

    	res.redirect('http://localhost:8080/profile');

    });

});


app.get('/request-poi', function(req, res){

	con.query("call getCities();", function (err, result, fields) {
    	if (err) throw err;

    	result = result[0];

    	cities = [];

    	for(var i=0; i < result.length; i++){
    		cities.push(result[i].name);
    	}


    	res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: cities, wasSubmitedWithSuccess: -1});

    });

});

app.post('/request-poi', upload_poi.single('photo'), function(req, res){

	var user_id = req.cookies['user'];

	var poi_id;

	// verificar se o utilizador pode submeter

	var poi_name = req.body.title;
	var poi_description = req.body.description;
	var poi_latitude = parseFloat(req.body.latitude);
	var poi_longitude = parseFloat(req.body.longitude);
	var poi_address = req.body.address;
	var poi_type = req.body.poi_type;
	var poi_website = req.body.website;
	var poi_phone_number = req.body.phone_number;
	var poi_photo = req.file.path;
	var poi_city = req.body.city;

	if(isNaN(poi_latitude)){
		res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: [], wasSubmitedWithSuccess: -1});
		return;
	}

	if(isNaN(poi_longitude)){
		res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: [], wasSubmitedWithSuccess: -1});
		return;
	}

	if(poi_description == "")
		poi_description = null;

	if(poi_website == "")
		poi_website = null;

	if(poi_phone_number == "")
		poi_phone_number = null;
	else if(isNaN(parseInt(poi_phone_number))){
		res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: [], wasSubmitedWithSuccess: -1});
		return;
	}


	var sql = "call submitPOI(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
	var values = [poi_name, poi_description, poi_latitude, poi_longitude, poi_address, poi_type, poi_website, poi_phone_number, poi_city, user_id];

	con.query(sql, values, function (err, result, fields) {
		if (err){
			throw err;
			res.send(JSON.stringify('error'));
		}

		else{
			poi_id = result[0][0].poiID;

			var newPath = path.join(__dirname, 'dist/img/poi/' + poi_id + "/" + Date.now() + Math.random().toString(36).substring(2) + path.extname(poi_photo));
			var newPath_rel = newPath.split('dist')[1];

			mkdirp(path.join(__dirname, 'dist/img/poi/' + poi_id), function(err) {
				if (err) throw err;

			});

			fs.rename(poi_photo, newPath, function (err) {
			  if (err) throw err;
			});


			sql = "call uploadPOIPhoto(?, ?, ?);";
			values = [poi_id, user_id, newPath_rel];

			con.query(sql, values, function (err, result, fields) {
		    	if (err) throw err;

		    	res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: [], wasSubmitedWithSuccess: 1});

		    });
		}
	});

});


app.get('/review-poi', function(req, res){

	var user_id = req.cookies['user'];
	var poi_id = req.query['id'];

	if(poi_id == undefined){
		con.query("call getSubmittedPOIs(?);", user_id, function (err, result, fields) {
	    	if (err) throw err;

	    	result = result[0];

	    	poi_list = [];

	    	for(var i=0; i < result.length; i++){
	    		poi = new Object();
	    		poi["id"] = result[i].id;
	    		poi["name"] = result[i].name;
	    		poi["photo"] = result[i].photo_url.replace(/\\/g,"/");
	    		poi["city"] = result[i].city;
	    		poi_list.push(poi);
	    	}


	    	res.render(path.join(__dirname+'/templates/review-poi-list.html'), {poi_list: poi_list});

	    });
	}

	else{

		con.query("call getSubmittedPOIByID(?, ?);", [user_id, poi_id], function (err, result, fields) {
	    	if (err) throw err;

	    	result = result[0];

	    	if(result.length > 0){
	    		var id = result[0].id;
	    		var name = result[0].name;
	    		var photo = result[0].photo_url.replace(/\\/g,"/");
	    		var city = result[0].city;
	    		var latitude = result[0].latitude;
	    		var longitude = result[0].longitude;
	    		var address = result[0].address;
	    		var poi_type = result[0].poi_type;
	    		var description = result[0].description;
	    		var website = result[0].website;
	    		var phone_number = result[0].phone_number;

	    		if(description == null)
	    			description = "No description provided";
	    		if(website == null)
	    			website = "No website provided";
	    		if(phone_number == null)
    				phone_number = "No phone number provided"; 

	    		res.render(path.join(__dirname+'/templates/review-poi.html'), {id: id, name: name, photo: photo, city: city, latitude: latitude, longitude: longitude, address: address, poi_type: poi_type, description: description, website: website, phone_number: phone_number});

	    	}

	    	else{

	    	}

	    });
	}
});


app.post('/accept-poi', function(req, res){
	var user_id = req.cookies['user'];
	var poi_id = parseInt(req.body.poi);

	if(isNaN(poi_id)){
		res.send(JSON.stringify('error'));
		return;
	}

	var google_place_id = req.body.google_place_id;
	var google_rating = parseFloat(req.body.google_rating).toFixed(1);
	var google_num_reviews = parseInt(req.body.google_reviews);
	var poi_description = req.body.description;
	var poi_website = req.body.website;
	var poi_phone_number = req.body.phone_number;

	if(isNaN(google_rating)){
		res.send(JSON.stringify('error'));
		return;
	}

	if(isNaN(google_num_reviews)){
		res.send(JSON.stringify('error'));
		return;
	}

	if(poi_description == "")
		poi_description = null;

	if(poi_website == "")
		poi_website = null;

	if(poi_phone_number == "")
		poi_phone_number = null;
	else if(isNaN(parseInt(poi_phone_number))){
		res.send(JSON.stringify('error'));
		return;
	}

	con.query("call acceptPOI(?, ?, ?, ?, ?, ?, ?, ?);", [user_id, poi_id, google_place_id, google_rating, google_num_reviews, poi_description, poi_website, poi_phone_number], function (err, result, fields) {
    	if (err){
    		throw err;
			res.send(JSON.stringify('error'));
    	} 

    	res.redirect('http://localhost:8080/place?id=' + poi_id);
    
    });

});




app.post('/reject-poi', function(req, res){
	var user_id = req.cookies['user'];
	var poi_id = parseInt(req.body.poi);

	if(isNaN(poi_id)){
		res.send(JSON.stringify('error'));
		return;
	}

	con.query("call rejectPOI(?, ?);", [user_id, poi_id], function (err, result, fields) {
    	if (err){
    		throw err;
			res.send(JSON.stringify('error'));
    	} 

    	res.redirect('http://localhost:8080/review-poi');
    
    });

});




app.get('/recover', function(req, res){
	res.render(path.join(__dirname+'/templates/recover-password.html'),);
});


app.get('/about-us', function(req, res){
	res.render(path.join(__dirname+'/templates/under-construction.html'), );
});

app.get('/help', function(req, res){
	res.render(path.join(__dirname+'/templates/under-construction.html'), );
});




app.post('/review-poi', function(req, res){
	var user_id = req.cookies['user'];

	var poi_id = parseInt(req.body.poi);

	if(isNaN(poi_id)){
		res.send(JSON.stringify('error'));
		return;
	}

	var review_txt = req.body.review;
	var review_rating = req.body.rating;
	var review_accessibility = req.body.accessibility;
	var review_security = req.body.security;
	var review_price = req.body.price;
	var review_duration = req.body.duration;

	if(review_rating == "")
		review_rating = null;

	else{
		review_rating = parseInt(review_rating);

		if(review_rating < 1 || review_rating > 5){
			res.send(JSON.stringify('error'));
			return;
		}
	}

	if(review_accessibility == "")
		review_accessibility = null;

	else{
		review_accessibility = parseInt(review_accessibility);

		if(review_accessibility < 1 || review_accessibility > 5){
			res.send(JSON.stringify('error'));
			return;
		}
	}

	if(review_security == "")
		review_security = null;

	else{
		review_security = parseInt(review_security);

		if(review_security < 1 || review_rating > 5){
			res.send(JSON.stringify('error'));
			return;
		}
	}

	if(review_price == "")
		review_price = null;

	else{
		review_price = parseFloat(review_price).toFixed(2);

		if(isNaN(review_price)){
			res.send(JSON.stringify('error'));
			return;
		}
	}


	if(review_duration == "")
		review_duration = null;

	else{
		review_duration = parseInt(review_duration.split(':')[0]) * 60 + parseInt(review_duration.split(':')[1]);

		if(isNaN(review_duration)){
			res.send(JSON.stringify('error'));
			return;
		}
	}


	var sql = "call reviewPOI(?, ?, ?, ?, ?, ?, ?, ?);";
	var values = [user_id, poi_id, review_txt, review_rating, review_accessibility, review_security, review_price, review_duration];

	con.query(sql, values, function (err, result, fields) {
		if (err){
			throw err;
			res.send(JSON.stringify('error'));
		}

		else{
			console.log("ADD POI REVIEW");
			res.send(JSON.stringify('success'));
		}
	});
	
});


/* edit the description of a POI */

app.post('/edit-description-poi', function(req, res){
	
	var user_id = req.cookies['user'];
	var plan_id = parseInt(req.body.poi);
	var description = req.body.description;

	if(isNaN(plan_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The POI does not exist."});
		return;
	}

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	if(description == "" || description == null){
		res.contentType('json');
		res.send({result: 'error', msg: "Please provide a valid description."});
		return;
	}

	con.query("call editPOIDescription(?,?,?)", [user_id, plan_id, description], function (err, result, fields) {
		if (err){
			throw err;
			res.send(JSON.stringify('error'));
		}

		else{
			res.send(JSON.stringify('success'));
		}
	});
});


app.post('/upload-poi-photo', upload_poi.single('photo'), function(req, res){

	var user_id = req.cookies['user'];
	var poi_id = req.body['poi'];

	var picture_url = req.file.path.split('dist')[1];

	var sql = "call uploadPOIPhoto(?, ?, ?);";
	var values = [poi_id, user_id, picture_url];

	con.query(sql, values, function (err, result, fields) {
    	if (err){
    		throw err;
    		//res.send(JSON.stringify('error'));
    	}

    	res.redirect('http://localhost:8080/place?id=' + poi_id);

    	//res.send(JSON.stringify('success'));

    });

});


// update POI DB from data collected from Google
app.post('/update-info-poi-automatically', function(req, res){

	var poi_id = parseInt(req.body['poi']);

	if(isNaN(poi_id))
		return;

	var poi_field_name = req.body['field'];
	var poi_field_value = req.body['value'];

	// update price level 
	if(poi_field_name == "price_level"){
		price_level = parseInt(poi_field_value);

		if(isNaN(price_level))
			return;

		con.query("call updatePOIPriceLevel(?,?)", [poi_id, price_level], function (err, result, fields) {
    		if (err) throw err;

		});
	}


	// update address 
	else if(poi_field_name == "address"){
		address = poi_field_value;

		if(address == "" || address == null)
			return;

		con.query("call updatePOIAddress(?,?)", [poi_id, address], function (err, result, fields) {
    		if (err) throw err;

			res.contentType('json');
			res.send({result: result[0][0].result});


		});
	}

});




app.get('/discover', function(req, res){

	var sql = "select * from \
	((select plan.id as id, plan.name, plan.description, plan.photo, plan.plan_timestamp, plan.num_viewers, user.name as user, user.type_use as type, city.name as city, avg(review_rating) as rating \
	from plan join user on plan.user = user.id join city on plan.city = city.id left outer join review_plan on plan.id = review_plan.plan_id \
	where isPublic = 1 group by id) \
	union distinct \
	(select plan.id as id, plan.name, plan.description, plan.photo, plan.plan_timestamp, plan.num_viewers, user.name as user, user.type_use as type, city.name as city, review_rating as rating \
	from plan join user on plan.user = user.id join city on plan.city = city.id left outer join review_plan on plan.id = review_plan.plan_id \
	where isPublic = 1 and review_rating is null)) t1 \
	left outer join \
	(select plan.id as id2, count(plan2.id) as num_plans \
	from plan join user on plan.user = user.id join city on plan.city = city.id join plan as plan2 on plan.id = plan2.parent_plan \
	where plan.isPublic = 1 group by id2) t2 \
	on t1.id = t2.id2;"; 

	con.query(sql, function (err, result, fields) {
		if (err) throw err;

		var trips = [];

		for(var i=0; i < result.length; i++){
			var trip = new Object();
			trip["id"] = result[i].id;
			trip["name"] = result[i].name;
			trip["description"] = result[i].description;
			trip["photo"] = result[i].photo;
			trip["creation_date"] = result[i].plan_timestamp.toJSON().slice(0,10);
			trip["num_viewers"] = result[i].num_viewers;
			trip["author"] = result[i].user;
			trip["city"] = result[i].city;

			if(result[i].type == "Premium")
				trip["isPremium"] = 1;

			else
				trip["isPremium"] = 0;

			if(result[i].rating == null)
				trip["rating"] = "0.0";
			else
				trip["rating"] = result[i].rating.toFixed(1);

			if(result[i].num_plans == null)
				trip["num_plans"] = 0;
			else
				trip["num_plans"] = result[i].num_plans;

			trips.push(trip);
		}


		res.render(path.join(__dirname+'/templates/discover.html'),  {trips: trips});

	}); 

});






app.get('/teste', function(req, res){

	getPoiOpeningHours();

});


app.get('*', function(req, res){
	res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
});

	
app.listen(8080);



console.log("Running at Port 8080");






/* Auxiliar Functions */

function getPlanDays(start_date, number_days, convert=true){
	days = [];

	days.push(start_date);

	while(number_days > 0){
		var sd = start_date.split('-');
		var day = parseInt(sd[0]);
		var month = parseInt(sd[1]);
		var year = parseInt(sd[2]);

		var next_day = parseInt(day) + 1;
		var next_month = month;
		var next_year = year;

		if(month == 2 && !isYearEven(year) && next_day > 28){
			next_day = 1;
			next_month = parseInt(month) + 1;
		}

		else if(month == 2 && isYearEven(year) && next_day > 29){
			next_day = 1;
			next_month = parseInt(month) + 1;
		}

		else if(!is31daysMonth(month) && next_day > 30){
			next_day = 1;
			next_month = parseInt(month) + 1;
		}

		else if(is31daysMonth(month) && next_day > 31){
			next_day = 1;
			next_month = parseInt(month) + 1;
			if(next_month > 12){
				next_month = 1;
				next_year = parseInt(year) + 1;
			}
		}


		start_date = next_day + '-' + next_month + '-' + next_year;
		days.push(start_date);
		number_days--;		

	}

	if(convert)
		days = convertToDate(days);

	return days;

}

// convert month from number to text (ex: 01 -> January)
function convertToTextMonth(month){
	var months = new Array();
	months[0] = "January";
	months[1] = "February";
	months[2] = "March";
	months[3] = "April";
	months[4] = "May";
	months[5] = "June";
	months[6] = "July";
	months[7] = "August";
	months[8] = "September";
	months[9] = "October";
	months[10] = "November";
	months[11] = "December";

	return months[month];
}



function isYearEven(year){
	return year % 4 == 0 && year % 100 != 0 || (year % 100 == 0 && year % 400 == 0)
}

function is31daysMonth(month){
	var months_31days = [1,3,5,7,8,10,12];

	for(var i=0; i < months_31days.length; i++){
		if(month == months_31days[i])
			return true;
	}

	return false;

}

function convertToDate(days){
	var month = new Array();
	month[0] = "January";
	month[1] = "February";
	month[2] = "March";
	month[3] = "April";
	month[4] = "May";
	month[5] = "June";
	month[6] = "July";
	month[7] = "August";
	month[8] = "September";
	month[9] = "October";
	month[10] = "November";
	month[11] = "December";


	for(var i=0; i < days.length ; i++){
		days[i] = (days[i].split('-')[0]<10?'0':'') + days[i].split('-')[0] + " " + month[parseInt(days[i].split('-')[1])-1] + " " + days[i].split('-')[2];
		days[i] = getWeekDay(days[i]) + ", " + days[i];
	}

	return days;
}


function convertToDateFormat(date){
	var month = new Array();
	month[0] = "January";
	month[1] = "February";
	month[2] = "March";
	month[3] = "April";
	month[4] = "May";
	month[5] = "June";
	month[6] = "July";
	month[7] = "August";
	month[8] = "September";
	month[9] = "October";
	month[10] = "November";
	month[11] = "December";


	date = date.split(" ")[2] + "-" + ((parseInt(month.indexOf(date.split(" ")[1]))+1)<10?'0':'') + (parseInt(month.indexOf(date.split(" ")[1]))+1) + "-" + date.split(" ")[0];

	return date;
}





function getWeekDay(date){
	var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	var d = new Date(date);
	return days[d.getDay()];
}

function diffBetweenDays(day1, day2){
	day1 = day1.split('/');
	day2 = day2.split('/');

	var date1 = new Date(day1[1] + "-" + day1[0] + "-" + day1[2]);
	var date2 = new Date(day2[1] + "-" + day2[0] + "-" + day2[2]);

	var diffTime = Math.abs(date2.getTime() - date1.getTime());
	var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

	return diffDays;
}

function convertToSQLTimestamp(date){
	var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds

    return new Date(date - tzoffset).toISOString().slice(0, 19).replace('T', ' ');;
}


function getReviewDate(date){
	var now = new Date();

	var diff = now - date;

	if(diff / (1000 * 60 * 60 * 24 * 365) < 1){
		if(diff / (1000 * 60 * 60 * 24 * 30) < 1){
			if(diff / (1000 * 60 * 60 * 24 ) < 1){
				if(diff / (1000 * 60 * 60 ) < 1){
					if(diff / (1000 * 60) < 1){
						return "less than one minute ago";
					}

					else{
						if(Math.floor(diff / (1000 * 60)) == 1)
							return Math.floor(diff / (1000 * 60)) + " minute ago";

						return Math.floor(diff / (1000 * 60)) + " minutes ago";
					}

				}

				else{
					if(Math.floor(diff / (1000 * 60 * 60)) == 1)
						return Math.floor(diff / (1000 * 60 * 60)) + " hour ago";

					return Math.floor(diff / (1000 * 60 * 60)) + " hours ago";
				}

			}

			else{
				if(Math.floor(diff / (1000 * 60 * 60 * 24)) == 1)
					return Math.floor(diff / (1000 * 60 * 60 * 24)) + " day ago";

				return Math.floor(diff / (1000 * 60 * 60 * 24)) + " days ago";
			}
		
		}
		
		else{
			if(Math.floor(diff / (1000 * 60 * 60 * 24 * 30)) == 1)
				return Math.floor(diff / (1000 * 60 * 60 * 24 * 30)) + " month ago";

			return Math.floor(diff / (1000 * 60 * 60 * 24 * 30)) + " months ago";
		}

	}


	else{
		if(Math.floor(diff / (1000 * 60 * 60 * 24 * 365)) == 1)
			return Math.floor(diff / (1000 * 60 * 60 * 24 * 365)) + " year ago";

		return Math.floor(diff / (1000 * 60 * 60 * 24 * 365)) + " years ago";
	}

}


function sortTrips(trips, order){
	var i,j, troca;
	var n = trips.length;

	for(i=0; i< n-1 ; i++){
		troca = false;
		for(j=0; j < n-i-1; j++){
			var d1 = new Date(trips[j]["start"]);
			var d2 = new Date(trips[j+1]["start"]);
			if(d1 > d2 && order=="cresc"){
				tmp = trips[j];
				trips[j] = trips[j+1];
				trips[j+1] = tmp;
				troca = true;
			}
			else if(d1 < d2 && order=="desc"){
				tmp = trips[j];
				trips[j] = trips[j+1];
				trips[j+1] = tmp;
				troca = true;
			}
		}

		if(!troca)
			break;
	}
}

function getSchedules(){
	var start_start_hour = 9;
	var end_start_hour = 19;

	var times = [];


	for(var i=start_start_hour; i < end_start_hour; i++){
		times.push(i.toString() + ':00');
		times.push(i.toString() + ':15');
		times.push(i.toString() + ':30');
		times.push(i.toString() + ':45');
	}

	return times;
}


function isValid(){

}

function isTimeSmaller(time1, time2){
	var h1, h2, m1, m2;

	h1 = parseInt(time1.split(':')[0]);
	m1 = parseInt(time1.split(':')[1]);
	h2 = parseInt(time2.split(':')[0]);
	m2 = parseInt(time2.split(':')[1]);

	if(h1 < h2)
		return true;
	else if(h1 > h2)
		return false;
	else{
		if(m1 < m2)
			return true;
		else
			return false;
	}

}

function getScheduleTimes(schedule){
	var h = parseInt(schedule.split(':')[0]);
	var m = parseInt(schedule.split(':')[1]);

	var st, end;

	if(m == 0){
		st = (h-1).toString() + ":50";
		end = (h+1).toString() + ":10"; 
	}

	else{
		st = (h).toString() + ":" + ((m-10)<10?'0':'') + (m-10).toString();
		end = (h+1).toString() + ":" + (m+10).toString();
	}

	return [st, end];

}


function getFinalSchedule(day, schedule){
	var start_time = day + " " + schedule;
	var end_time = day + " " + (parseInt(schedule.split(':')[0]) + 1).toString() + ":" + schedule.split(':')[1];

	return [start_time, end_time];
}


function getPlanOpenSlot(plan){

	var schedules = getSchedules();

	for(var day in plan){
		for(var i=0; i < schedules.length; i++){
			var sch = getScheduleTimes(schedules[i]);
			var st = sch[0];
			var end = sch[1];

			var isValid = true;

			for(var j=0; j<plan[day].length ; j++){
				if(isTimeSmaller(st, plan[day][j]['start_time']) && isTimeSmaller(plan[day][j]['start_time'], end))
					isValid = false;

				if(isTimeSmaller(st, plan[day][j]['end_time']) && isTimeSmaller(plan[day][j]['end_time'], end))
					isValid = false;

				if(isTimeSmaller(plan[day][j]['start_time'], st) && isTimeSmaller(end, plan[day][j]['end_time']))
					isValid = false;

			}


			// ir buscar horario do POI e ver se tem disponibilidade


			if(isValid)
				return getFinalSchedule(day, schedules[i]);

		}

	}

	return false;

}



function getAllOpenSlotsAvailable(plan){

	var schedules = getSchedules();
	var openslots = {};

	for(var day in plan){
		for(var i=0; i < schedules.length; i++){
			var sch = getScheduleTimes(schedules[i]);
			var st = sch[0];
			var end = sch[1];

			var isValid = true;

			for(var j=0; j<plan[day].length ; j++){
				if(isTimeSmaller(st, plan[day][j]['start_time']) && isTimeSmaller(plan[day][j]['start_time'], end))
					isValid = false;

				if(isTimeSmaller(st, plan[day][j]['end_time']) && isTimeSmaller(plan[day][j]['end_time'], end))
					isValid = false;

				if(isTimeSmaller(plan[day][j]['start_time'], st) && isTimeSmaller(end, plan[day][j]['end_time']))
					isValid = false;

			}


			// ir buscar horario do POI e ver se tem disponibilidade


			if(isValid){
				if(openslots[day] != undefined)
					openslots[day].push(schedules[i]);
				else
					openslots[day] = [schedules[i]];

			}

		}

	}

	return openslots;

}


function getWeather(plan){

	var weather = [];

	for(var i=0; i < plan.length; i++){

		var url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + parseFloat(plan[i].coordinates.split(',')[0]) + "&lon=" + parseFloat(plan[i].coordinates.split(',')[1]) + "&appid=" + OPEN_WEATHER_API_KEY + "&units=metric";

		https.get(url, (res) => { // <- this is a function that is called when there's a response. Waiting for a response is as easy as writing code inside this function (or use async await)
		  	var body ='';
			res.on('data', function(chunk) {
		  		body += chunk;
			});

			res.on('end', function() {
				body = JSON.parse(body);

				var info = body["list"];

				//console.log(plan, visit, info[0]["dt_txt"]);

				//return info[0]["dt_txt"];

				weather.push(info[0]["main"]["temp"]); 


			});

		}).on('error', (e) => { //the https.get function returns a request that can emit an error event. this is an eventlistener for that. try an invalid url to test this branch of your code
		  console.error(e);
		});


	}

	// Usage!
	sleep(500).then(() => {
	    // Do something after the sleep!

	    for(var i=0; i < weather.length; i++){
	    	plan[i]["weather"] = weather[i];
	    }

	    return plan;
	});


}

function getWeatherClosestHour(visit_schedule){
	visit_day = convertToDateFormat(visit_schedule[0]);
	visit_hour = visit_schedule[1];

	weather_times = ["00:00:00", "03:00:00", "06:00:00", "09:00:00", "12:00:00", "15:00:00", "18:00:00", "21:00:00"];

	visit_hour_min = parseInt(visit_hour.split(':')[0]) * 60 + parseInt(visit_hour.split(':')[1]);

	var best_diff = Infinity;
	var best_time = null;

	for(var i=0; i < weather_times.length; i++){
		weather_time_min = parseInt(weather_times[i].split(':')[0]) * 60 + parseInt(weather_times[i].split(':')[1]);

		if(Math.abs(weather_time_min - visit_hour_min) < best_diff){
			best_diff = Math.abs(weather_time_min - visit_hour_min);
			best_time = weather_times[i];
		}
	}


	return visit_day + " " + best_time;

}






function getPoiOpeningHours(place_id){
	place_id = 'ChIJLU7jZClu5kcR4PcOOO6p3I0';

	var url = "https://maps.googleapis.com/maps/api/place/details/json?" + "key=" + GOOGLE_API_KEY + "&placeid=" + place_id + "&fields=opening_hours";
	console.log(url);

	https.get(url, function(response) {
    	var body ='';
    	response.on('data', function(chunk) {
      		body += chunk;
		});

		response.on('end', function() {
      		var places = JSON.parse(body);

      		var opening_hours = places['result']['opening_hours']['weekday_text'];

      		return parsePoiOpeningHours(opening_hours);
    	});
 	 }).on('error', function(e) {
    	console.log("Got error: " + e.message);
    	return null;
  	});
}


function parsePoiOpeningHours(poi_op_hours){

	var poi_hours = {};

	for(var i=0; i<poi_op_hours.length;i++){
        var weekday = poi_op_hours[i].split(':')[0];
        var opening_hours = poi_op_hours[i].substring(poi_op_hours[i].indexOf(':')+1);

        if(opening_hours == 'Closed')
        	poi_hours[weekday] = 'Closed';
        else if(opening_hours == 'Open 24 hours')
        	poi_hours[weekday] = 'Open';
        else{
        	var start_time = opening_hours.split('–')[0];
        	if(start_time.includes('PM'))
        		start_time = (parseInt(start_time.split(':')[0]) + 12).toString() + ":" + start_time.split(':')[1].replace(' PM', '');
        	else if(start_time.includes('AM'))
        		start_time = start_time.split(':').replace(' AM', '');


        	var end_time = opening_hours.split('–')[1];
        	if(end_time.includes('PM'))
        		end_time = (parseInt(end_time.split(':')[0]) + 12).toString() + ":" + end_time.split(':')[1].replace(' PM', '');
        	else if(end_time.includes('AM'))
        		end_time = end_time.split(':').replace(' AM', '');


        	poi_hours[weekday] = [start_time, end_time];
        
        }

	}

	console.log(poi_hours);



}


function sleep (time) {
	  return new Promise((resolve) => setTimeout(resolve, time));
}


