/* 


*/


/* NODE JS Modules Required */
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
var builder = require('xmlbuilder');
var edge = require('edge-js');
var open = require('open');

/* API KEYS FOR GOOGLE AND OPEN WEATHER MAP */

const GOOGLE_API_KEY = 'AIzaSyAExpmRjci35grh-wAwFxK75c0fV4OHOxw';
const OPEN_WEATHER_API_KEY = '8271fd206ceeef12df4e7bb6063241c3';

distance.key(GOOGLE_API_KEY); // set GOOGLE API KEY to Google Distance Matrix Module

/* Constant Variables */
const RELIGION_TYPES = ['CHURCH', 'PLACE OF WORSHIP'];
const HISTORIC_TYPES = ['CHURCH', 'CASTLE', 'MUSEUM', 'PALACE'];
const RECREATION_TYPES = ['AMUSEUMENT PARK', 'AQUARIUM', 'ZOO'];
const NATURE_TYPES = ['PARK', 'NATURAL FEATURE'];
const CULTURE_TYPES = ['THEATER', 'THEATRE', 'MUSEUM'];

const MANUAL_TRIP_TOTAL_TIME = "2 hours";

/* store users's images  */
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'dist/img/users'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + Math.random().toString(36).substring(2) + path.extname(file.originalname)) //Appending extension
  }
});

/* store trips's images */
var trip_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'dist/img/trips'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() +  '_' + Math.random().toString(36).substring(2) + path.extname(file.originalname)) //Appending extension
  }
});

/* store POI's images */
var poi_storage = multer.diskStorage({
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

/* store city's images */
var city_storage = multer.diskStorage({
  destination: function (req, file, cb) {
  	var dir;
  	if(req.body.city == undefined)
  		dir = path.join(__dirname, 'dist/img/city/tmp');
	else
 		dir = path.join(__dirname, 'dist/img/city/' + req.body.city);

  	mkdirp(dir, err => cb(err, dir))
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() +  '_' + Math.random().toString(36).substring(2) + path.extname(file.originalname)) //Appending extension
  }
});

var upload = multer({storage: storage});
var upload_trip = multer({storage: trip_storage});
var upload_poi = multer({storage: poi_storage});
var upload_city = multer({storage: city_storage});


/* CREATE CONNECTION WITH THE MYSQL DB */
var con = mysql.createConnection({
  host: "e-tinerarydb.mysql.database.azure.com",
  user: "etinerary_user@e-tinerarydb",
  password: "Ers1995.",
  database: "placesdb"
});

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//put static files (js, css, images) into /dist directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use(cookieParser());


// connect with the DB
con.connect(function(err) {
   if (err) throw err;
   console.log("Connected with the DB");
});


// home page 
app.get('/', function(req, res){

    var list_cities = [];
    var top_dest = [];
    var top_places = [];
    var recommended_dest = [];

    var number_results = 4; // number of cities and pois to show in the home page sections

    // get the list of cities (name) available
    con.query("call getCities()", function (err, result, fields) {
        if (err) throw err;

        result = result[0];

        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }
    	
    	// get the top N cities with the most trips made
        con.query("call getTopCities(?)", number_results, function (err, result, fields) {
        	if (err) throw err;

        	result = result[0];

        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
        		dest.place_id = result[i].place_id;
        		dest.photo = result[i].photo;
        		dest.trips = result[i].trips;
        		top_dest.push(dest);
        	}
    		
    		// get the top N POIs that appear in the most number of trips
        	con.query("call getTopPOIs(?)", number_results, function (err, result, fields) {
	        	if (err) throw err;

	        	result = result[0];

	        	for(var i=0; i<result.length;i++){
	        		var place = new Object();
	        		place.id = result[i].id;
	        		place.place_id = result[i].place_id;
	        		place.name = result[i].name;
        			place.photo = result[i].photo;
	        		place.city = result[i].city;
	        		place.trips = result[i].trips;
	        		top_places.push(place);
	        	}

	        	// get recommended destinations for each user (for now its random)
	        	con.query("call getRandomCities(?)", number_results,  function (err, result, fields) {
		        	if (err) throw err;

		        	result = result[0];

		        	for(var i=0; i<result.length;i++){
		        		var dest = new Object();
		        		dest.name = result[i].name;
        				dest.place_id = result[i].place_id;
        				dest.photo = result[i].photo;
		        		dest.trips = result[i].trips;
		        		recommended_dest.push(dest);
		        	}

        			res.render(path.join(__dirname+'/templates/index.html'), {cities: list_cities, top_dest: top_dest, top_places: top_places, recommended_dest: recommended_dest});

        		});
        	});
        });     
    });
});


// plan a trip / advanced search
app.get('/search', function(req,res){ 

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
    	
    	// get the top N cities with the most trips made
        con.query("call getTopCities(?)", number_results, function (err, result, fields) {
        	if (err) throw err;

        	result = result[0];

        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
				dest.place_id = result[i].place_id;
        		dest.photo = result[i].photo;
        		dest.trips = result[i].trips;
        		top_dest.push(dest);
        	}

        	// get recommended destinations for each user (now its random)
        	con.query("call getRandomCities(?)", number_results,  function (err, result, fields) {
	        	if (err) throw err;

	        	result = result[0];

	        	for(var i=0; i<result.length;i++){
	        		var dest = new Object();
        			dest.name = result[i].name;
    				dest.place_id = result[i].place_id;
        			dest.photo = result[i].photo;
	        		dest.trips = result[i].trips;
	        		recommended_dest.push(dest);
	        	}

    			res.render(path.join(__dirname+'/templates/search.html'), {cities: list_cities, top_dest: top_dest, recommended_dest: recommended_dest});

    		});
        });
    });
});



// search places page
app.get('/search-places',function(req,res){
    var list_cities = [];
	var top_dest = [];
    var number_results = 4; // number of cities and pois to show in the home page sections

	// get the list of cities (name) available in the app    
    con.query("call getCities()", function (err, result, fields) {
        if (err) throw err;

        result = result[0];

        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }

        // get the top N cities with the most trips made
        con.query("call GetTopCities(?)", number_results, function (err, result, fields) {
        	if (err) throw err;

        	result = result[0];

        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
				dest.place_id = result[i].place_id;
        		dest.photo = result[i].photo;
        		dest.trips = result[i].trips;
        		top_dest.push(dest);
        	}

        	res.render(path.join(__dirname+'/templates/search-places.html'), {cities: list_cities, top_dest: top_dest});

    	});
    });
});


// city page
app.get('/city', function(req, res){
	var connection;

	var city_name = req.query['name'];	// name of the city provided in the URL (ex: /city?name=Aveiro)
	var user_id = 0; // ID of the user -> default = 0

	if(req.cookies['user'] != undefined && !isNaN(req.cookies['user']))
		user_id = parseInt(req.cookies['user']);

	// get general information from city (name, coordinates, description, Google PlaceID to get photos)
	con.query("call getInfoCity(?)", [city_name], function (err, result, fields) {
	    if (err) throw err;

	    result = result[0];

	    /* if the name provided by the user does not exits in the DB, return 404 page */
	    if(result.length == 0){
	    	res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
	    	return;
	    }

	    // city attributes
	    var city = result[0].name;
	    var city_id = result[0].id;
	    var place_id = result[0].place_id;
	    var coordinates = result[0].latitude + ", " + result[0].longitude;
	    var description = result[0].description;
	    var address = result[0].name + ", " + result[0].country;


	    /* Get 8 POIs of the City (not Hotels and Restaurants) */
	    con.query("call getPOIsFromCity(?,?,?,?)", [city, '', -1, 'reviews'], function(err, result, fields){
	    	if (err) throw err;

	    	result = result[0];

	    	var places = [];
	    	var num_pois_toSearch = 8;

	    	var i = 0;
	    	while(places.length < num_pois_toSearch && i < result.length){
	    		if(result[i].poi_type.toUpperCase() != 'Hotel'.toUpperCase() && result[i].poi_type.toUpperCase() != 'Restaurant'.toUpperCase()){
	    			var place = new Object();
		    		place["id"] = result[i].id;
		        	place["place_id"] = result[i].place_id;
		            place["name"] = result[i].place;
		            place["coordinates"] = result[i].latitude + ", " + result[i].longitude;

		    		if(result[i].photo != null)
		        		place["photo"] = result[i].photo.replace(/\\/g,"/");
		        	else
		        		place["photo"] = null;

		        	places.push(place);
	    		}
	    		i++;
	    	}

	    	/* Get the Photos of the City Stored */
	    	con.query("call getCityPhotos(?)", city_id, function (err, result, fields) {
	    		if (err) throw err;

	    		result = result[0];

	    		var photos = [];

	    		for(var i=0 ; i < result.length; i++){
	    			photo = result[i].photo_url.replace(/\\/g,"/");
	    			photos.push(photo);
	    		}

	    		/* Get the Top 4 Hotels in the City */
	    	 	con.query("call getHotels(?)", [city], function(err, result, fields){
			    	if (err) throw err;

			    	result = result[0];

			    	var hotels = [];
			    	var num_hotels_toSearch = 4;

			    	var i = 0;
			    	while(hotels.length < num_hotels_toSearch && i < result.length){
			    		if(result[i].poi_type.toUpperCase() == 'Hotel'.toUpperCase()){
			    			var hotel = new Object();
				    		hotel["id"] = result[i].id;
				        	hotel["place_id"] = result[i].place_id;
				            hotel["name"] = result[i].place;

				    		if(result[i].photo != null)
				        		hotel["photo"] = result[i].photo.replace(/\\/g,"/");
				        	else
				        		hotel["photo"] = null;

				        	hotels.push(hotel);
			    		}

			    		i++;
			    	}

			    	/* Get the Trips Created in the City (maximum = 4) */
			    	con.query("call getCityTrips(?)", [city_id], function(err, result, fields){
			    		if (err) throw err;

			    		result = result[0];

			    		var trips = [];

			    		var max_num_trips = 4;

			    		if(result.length < 4)
			    			max_num_trips = result.length;

			    		for(var i=0; i < max_num_trips; i++){
			    			var trip = new Object();

			    			trip["id"] = result[i].id;

			    			if(result[i].name != null && result[i].name.length > 0)
				        		trip["name"] = result[i].name;
				        	else
				        		trip["name"] = 'Visit to ' + result[i].city;


				        	trip["photo"] = result[i].photo;
				        	trip["description"] = result[i].description;

				        	trips.push(trip);
			    		}


			    		/* Get the Stats (number of POI, number of Hotels, number of Trips) of the City */
			    		con.query("call getCityStats(?)", [city_id], function(err, result, fields){
			    			if (err) throw err;

			    			result = result[0][0];

			    			var num_pois = result.num_pois;
			    			var num_hotels = result.num_hotels;
			    			var num_trips = result.num_trips;

			    			/* Check the User type to enable / disable premium actions */
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


				    			/* Get data of the current weather in the City from Open Weather Map */

				    			var temperature;
				    			var weather;
				    			var icon;

				    			var url = "https://api.openweathermap.org/data/2.5/weather?lat=" + parseFloat(coordinates.split(',')[0]) + "&lon=" + parseFloat(coordinates.split(',')[1]) + "&appid=" + OPEN_WEATHER_API_KEY + "&units=metric";

								https.get(url, (res) => {
								  	var body ='';
									res.on('data', function(chunk) {
								  		body += chunk;
									});

									res.on('end', function() {
										body = JSON.parse(body);
										
										temperature = Math.round(body.main.temp) + " ºC";
										weather = body.weather[0].main;
										icon = "http://openweathermap.org/img/w/" + body.weather[0].icon + ".png";
									});
								}).on('error', (e) => {
								  console.error(e);
								});

							 	sleep(500).then(() => {

			    					res.render(path.join(__dirname+'/templates/city.html'), {id: city_id, city: city, place_id: place_id, coordinates: coordinates, description: description, address: address, photos: photos, places: places, hotels: hotels, trips: trips, num_pois: num_pois, num_hotels: num_hotels, num_trips: num_trips, isUserRegistered: isUserRegistered, isUserPremium: isUserPremium, temperature: temperature, weather: weather, icon: icon});

		    					});
		    				});
			    		});
		    		});
		    	});
			});
	    });

	});

});



/* List of POIs in a city */
app.get('/places', function (req, res){

	var connection;

	var sort_options = ["az", "za", "reviews", "rating"]; // sort options 
	var default_poi_types = ["Hotel", "Restaurant", "Museum", "Church", "Park"]; // default POI types

	var destination = req.query['dest']; // destination (name of the city)
	var query = ""; // query for a place 
	var page = 1; // current page
	var tripID = -1; // ID of trip -> default = no trip 
	var sort = "reviews"; // default sort = number of reviews
	
	/* filters */
	var hotelsFilter = true;
	var restaurantsFilter = true;
	var museumsFilter = true;
	var churchsFilter = true;
	var parksFilter = true;
	var othersFilter = true;

	var ratingMin = 1.0;
	var ratingMax = 5.0;

	var reviewsMin = 1;
	var reviewsMax = 500000;

	/* check URL parameters (query, page, ID of trip, sort)  */
	if(req.query['query'] != undefined)
		query = req.query['query'];

	if(req.query['page'] != undefined)
		page = parseInt(req.query['page']);

	if(req.query['trip'] != undefined)
		tripID = parseInt(req.query['trip']);

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

	if(req.cookies['reviews_range_filter'] != undefined){
		reviewsMin = parseFloat(req.cookies['reviews_range_filter'].split('-')[0]);
		reviewsMax = parseFloat(req.cookies['reviews_range_filter'].split('-')[1]);
	}

	if(tripID != -1)
		hotelsFilter = false;


	if(isNaN(page)){
		res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
    	return;
	}

	if(isNaN(tripID)){
		res.redirect(req.baseUrl + '/places?dest='+ destination);
		return;
	}

	var total_results = 9; // number of results per page
	var limit_inf = (page-1) * total_results; // index of first result
	var list_places = [];
	var number_results = 0;
	var list_places_names = [];
	var num_max_reviews = 0;


	/* If tripID is provided, check if trip exists */
	con.query("call tripExists(?)", tripID, function (err, result, fields) {
		if (err) throw err;

		result = result[0];

		if(tripID != -1 && result[0].trip_exists == 0){
			res.redirect(req.baseUrl + '/places?dest='+ destination); // if trip doesn't exist, refresh page without tripID
			return;
		}


		/* get the names of all POIs in the City */
		con.query("call getPOIsNamesFromCity(?)", [destination], function (err, result, fields) {
			if (err) throw err;

	        result = result[0];

	        for(var i=0 ; i < result.length; i++){
	        	list_places_names.push(result[i].name);
	        }

		});

		/* get all POIs in the City from DB, and then filter the results */
		con.query("call getPOIsFromCity(?,?,?,?)", [destination, query, tripID, sort], function (err, result, fields) {
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

	        	// the maximum number of reviews of a POI in the city is needed in the interface (filter by number of reviews)
	        	for(var i = 0 ; i < result.length ; i++){
	        		if(result[i].num_reviews != null && result[i].num_reviews > num_max_reviews)
	        			num_max_reviews = result[i].num_reviews;
	        	}


		        for(var i = 0 ; i < result.length ; i++){

		        	var poi_type = result[i].poi_type.charAt(0).toUpperCase() + result[i].poi_type.slice(1);

		        	var poi_google_rating = null;
		        	var poi_num_reviews = null;

		        	if(result[i].rating != null)
		        		poi_google_rating = result[i].rating.toFixed(1);

		        	if(result[i].num_reviews != null)
		        		poi_num_reviews = result[i].num_reviews;

		        	if(!hotelsFilter && poi_type == "Hotel"){} // ignore if the POI is an Hotel, and the filter is not selected

		        	else if(!restaurantsFilter && poi_type == "Restaurant"){} // ignore if the POI is a Restaurant, and the filter is not selected

		        	else if(!museumsFilter && poi_type == "Museum"){} // ignore if the POI is a Museum, and the filter is not selected

		        	else if(!churchsFilter && poi_type == "Church"){} // ignore if the POI is a Church, and the filter is not selected

		        	else if(!parksFilter && poi_type == "Park"){} // ignore if the POI is a Park, and the filter is not selected

		        	else if(!othersFilter && !default_poi_types.includes(poi_type)){} // ignore if the POI type is not in the default list, and the filter by 'Other Places' is not selected

	        		else if(poi_google_rating == null || poi_google_rating < ratingMin || poi_google_rating > ratingMax){} // ignore if the POI rating is not in the range selected by the user

        			else if(poi_num_reviews == null || poi_num_reviews < reviewsMin || poi_num_reviews > reviewsMax){} // ignore if the POI number of reviews is not in the range selected by the user


        			/* if the POI meets all requirements, return it*/
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

			            if(result[i].price != null)
			           		place["price"] = Math.round(result[i].price);

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

		    /* If the request has tripID, check all openslots where a visit can be added in the trip*/

	    	if(tripID != -1){

	    		var isManual;

	    		promise.createConnection({
				    host: 'localhost',
				    user: 'root',
				    password: 'password',
				    database: 'placesdb'

				}).then(function(conn){
					connection = conn;

					return connection.query("call isTripManual(?)", [tripID]);

				}).then(function(result){

					isManual = parseInt(result[0][0].isManual[0]);

					return connection.query("call getVisitTimes(?,?)", [tripID, isManual]);


				}).then(function(result){

					result = result[0];

					var start_date = "n/a";
			        var end_date = "n/a";
			        var date_diff = 0;
			        var days = [];

			        // if trip has visits 
			        if(result.length > 0){

			        	start_date = new Date(result[0].start_date);
			        	end_date = new Date(result[0].end_date);

			        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

			        	start_date = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
			        	end_date = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

			        	date_diff = result[0].date_diff;

			        	days = getTripDays(start_date_aux, parseInt(date_diff));

			        	var list_places_trip = [];
	        			var trip = {};

	        			for(var i=0 ; i < days.length; i++){
		    				var d = new Date(days[i]);
		    				d = d.getFullYear() + "-" + (d.getMonth()<10?'0':'') + (d.getMonth() + 1)  + "-" + (d.getDate()<10?'0':'') + d.getDate();
		    				trip[d] = [];
		    			}

	        			for(var i =0 ; i < result.length; i++){
				        	list_places_trip.push(result[i].poi_id);

	    					var visit = new Object();

				        	var start_time = new Date(result[i].start_time);
							var end_time = new Date(result[i].end_time);

							var day = start_time.getFullYear() + "-" + (start_time.getMonth()<10?'0':'') + (start_time.getMonth() + 1)  + "-" + (start_time.getDate()<10?'0':'') + start_time.getDate();

				        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
				        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();

				        	if(trip[day] != undefined){
				        		trip[day].push(visit);
				        	}

				        	else{
				        		trip[day] = [];
				        		trip[day].push(visit);
				        	}
				        }

				        var openslots = getAllOpenSlotsAvailable(trip);

			        	res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, list_places_names: list_places_names, city: city, country: country, number_results: number_results, fromTrip: true, isManual: isManual, visits: list_places_trip, days: days, openslots: openslots, num_max_reviews: num_max_reviews});

			        	return 1;

			        }

			        else{
			        	return 0;
			        }

				}).then(function(result){

					// ignore
					if(result == 1)
						return result;

					return connection.query("call getTripDates(?)", [tripID]);

				}).then(function(result){

					if(result == 1)
						return;

					/* if trip has no visits yet */

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

			        	days = getTripDays(start_date_aux, parseInt(date_diff));

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
				    
				    res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, list_places_names: list_places_names, city: city, country: country, number_results: number_results, fromTrip: true, isManual: isManual, visits: [], days: days, openslots: openslots, num_max_reviews: num_max_reviews});

				});	        		
	    	}


	    	else {
				res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, list_places_names: list_places_names, city: city, country: country, number_results: number_results, fromTrip: false, openslots: [], num_max_reviews: num_max_reviews});
			}
		});

	});
});


/* return the page of a POI */
app.get('/place', function(req,res){  	
	var connection;
	var user_id = 0; // ID of the user -> default = 0
	var tripID = -1; // ID of trip -> default = no trip 

	var poi_id = parseInt(req.query['id']); // ID of the POI (provided in the URL)

	/* if the POI ID is not a integer number, doesn't exist (404 page) */
	if(isNaN(poi_id)){
		res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
		return;
	}

	/* get the user ID (cookies) */
	if(req.cookies['user'] != undefined && !isNaN(req.cookies['user']))
		user_id = parseInt(req.cookies['user']);


	/* get the tripID (provided in the URL) */
	if(req.query['trip'] != undefined)
		tripID = parseInt(req.query['trip']);

	/* if the trip ID is not a integer number, ignore it */	
	if(isNaN(tripID)){
		res.redirect(req.baseUrl + '/place?id='+ poi_id);
		return;
	}

	/* check if trip exists */
	con.query("call tripExists(?)", tripID, function (err, result, fields) {
		if (err) throw err;

		result = result[0];

		if(tripID != -1 && result[0].trip_exists == 0){ // ignore trip, if not exists
			res.redirect(req.baseUrl + '/place?id='+ poi_id);
			return;
		}

		/* Get all the POI info stored in the DB */
		con.query("call getInfoPOI(?,?)", [poi_id, tripID], function (err, result, fields) {
		    if (err) throw err;

		    result = result[0];

		    if(result.length == 0){
				res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
				return;
		    }

			/* POI attributes */
		    var id = result[0].id;
		    var place_id = result[0].place_id;
			var name = result[0].name;
			var description = result[0].description;
			var address = result[0].address;
			var lat = result[0].latitude;
			var lon = result[0].longitude;
			var google_rating = result[0].google_rating;
			var num_reviews = result[0].num_reviews;
			var type = result[0].poi_type.charAt(0).toUpperCase() + result[0].poi_type.slice(1);

			var price = result[0].price;
			if(price != null)
				price = price.toFixed(2) + " €";

			var price_children = result[0].price_children;
			if(price_children != null)
				price_children = price_children.toFixed(2) + " €";

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


			var no_trips = result[0].no_trips;

			if(no_trips == null)
				no_trips = 0;

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

			var rating_price = result[0].rating_price;

			if(rating_price == null)
				rating_price = "No information available";
			else
				rating_price = parseFloat(rating_price).toFixed(2);

			var duration = result[0].duration;

			if(duration == null)
				duration = "No information available";
			else
				duration = ((parseInt(duration) / 60)<10?'0':'') + (parseInt(duration) / 60)  + ":" + ((parseInt(duration) % 60)<10?'0':'') + (parseInt(duration) % 60);

			// get Reviews of the POI */
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

				/* get Photos of the POI */
		    	con.query("call getPOIPhotos(?)", poi_id, function (err, result, fields) {
		    		if (err) throw err;

		    		result = result[0];

		    		var photos = [];

		    		for(var i=0 ; i < result.length; i++){
		    			photo = result[i].photo_url.replace(/\\/g,"/");
		    			photos.push(photo);
		    		}

					/* check user's type to enable/disabled actions */
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

						/* If the request has tripID, check all openslots where a visit can be added in the trip*/

			    		if(tripID == -1)
							res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, id: id, description: description, address: address, lat: lat, lon: lon, google_rating: google_rating, num_reviews: num_reviews, phone_number: phone_number, website: website, type: type, price: price, price_children: price_children, no_trips: no_trips, rating: rating, accessibility: accessibility, security: security, rating_price: rating_price, duration: duration, reviews: reviews, fromTrip: false, schedule: null, openslots: [], photos: photos, isUserRegistered: isUserRegistered, isUserPremium: isUserPremium});

						else {

							var isManual;

							promise.createConnection({
							    host: 'localhost',
							    user: 'root',
							    password: 'password',
							    database: 'placesdb'

							}).then(function(conn){
								connection = conn;

								return connection.query("call isTripManual(?)", [tripID]);

							}).then(function(result){

								isManual = parseInt(result[0][0].isManual[0]);

								return connection.query("call getVisitTimes(?,?)", [tripID, isManual]);

							}).then(function(result){

								result = result[0];

								var start_date = "n/a";
						        var end_date = "n/a";
						        var date_diff = 0;
						        var days = [];

						        // if trip has visits 
						        if(result.length > 0){

						        	start_date = new Date(result[0].start_date);
						        	end_date = new Date(result[0].end_date);

						        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

						        	start_date = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
						        	end_date = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

						        	date_diff = result[0].date_diff;

						        	days = getTripDays(start_date_aux, parseInt(date_diff));

						        	var list_places_trip = [];
				        			var trip = {};

				        			for(var i=0 ; i < days.length; i++){
					    				var d = new Date(days[i]);
					    				d = d.getFullYear() + "-" + (d.getMonth()<10?'0':'') + (d.getMonth() + 1)  + "-" + (d.getDate()<10?'0':'') + d.getDate();
					    				trip[d] = [];
					    			}

				        			for(var i =0 ; i < result.length; i++){
							        	list_places_trip.push(result[i].poi_id);

			        					var visit = new Object();

							        	var start_time = new Date(result[i].start_time);
			    						var end_time = new Date(result[i].end_time);

			    						var day = start_time.getFullYear() + "-" + (start_time.getMonth()<10?'0':'') + (start_time.getMonth() + 1)  + "-" + (start_time.getDate()<10?'0':'') + start_time.getDate();

							        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
							        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();

							        	if(trip[day] != undefined){
							        		trip[day].push(visit);
							        	}

							        	else{
							        		trip[day] = [];
							        		trip[day].push(visit);
							        	}
							        }

							        var openslots = getAllOpenSlotsAvailable(trip);

							        var inTrip = false;
					        		if (list_places_trip.includes(parseInt(poi_id))){
						        		inTrip = true;
					    			}


						        	res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, id: id, description: description, address: address, lat: lat, lon: lon, google_rating: google_rating, num_reviews: num_reviews, phone_number: phone_number, website: website, type: type, price: price, price_children: price_children, no_trips: no_trips, rating: rating, accessibility: accessibility, security: security, rating_price: rating_price, duration: duration, reviews: reviews, fromTrip: true, isManual: isManual, schedule: schedule, inTrip: inTrip, days: days, openslots: openslots, photos: photos, isUserRegistered: isUserRegistered, isUserPremium: isUserPremium});

						        	return 1;

						        }

						        else{
						        	return 0;
						        }

							}).then(function(result){

							// ignore
								if(result == 1)
									return result;

								return connection.query("call getTripDates(?)", [tripID]);

							}).then(function(result){

								if(result == 1)
									return;

								/* if trip has no visits yet */


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

						        	days = getTripDays(start_date_aux, parseInt(date_diff));

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
							    
							    res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, id: id, description: description, address: address, lat: lat, lon: lon, google_rating: google_rating, num_reviews: num_reviews, phone_number: phone_number, website: website, type: type, price: price, price_children: price_children, no_trips: no_trips, rating: rating, accessibility: accessibility, security: security, rating_price: rating_price, duration: duration, reviews: reviews, fromTrip: true, isManual: isManual, schedule: schedule, inTrip: false, days: days, openslots: openslots, photos: photos, isUserRegistered, isUserRegistered, isUserPremium: isUserPremium});

							});	        		
			        	}
			        });
				});
	        });

		});
	
	});

});


// search hotels page
app.get('/search-hotels',function(req,res){  

   	var list_cities = [];
	var top_dest = [];
    var number_results = 4; // number of cities and pois to show in the home page sections

	// get the list of cities (name) available
	con.query("call getCities()", function (err, result, fields) {
	    if (err) throw err;

	    result = result[0];

	    for(var i =0 ; i < result.length; i++){
	    	list_cities.push(result[i].name);
	    }

		// get the top N cities with the most trips made
	    con.query("call GetTopCities(?)", number_results, function (err, result, fields) {
	    	if (err) throw err;

	    	result = result[0];

	    	for(var i=0; i<result.length;i++){
	    		var dest = new Object();
	    		dest.name = result[i].name;
				dest.place_id = result[i].place_id;
        		dest.photo = result[i].photo;
	    		dest.trips = result[i].trips;
	    		top_dest.push(dest);
	    	}

	    	res.render(path.join(__dirname+'/templates/search-hotels.html'), {cities: list_cities, top_dest: top_dest});

		});
	});
});


// list of hotels in a city 
app.get('/hotels', function(req,res){

	var destination = req.query['dest']; // destination (name of the city)
    var list_hotels = [];

	// get all Hotels in a city
	con.query("call getHotels(?)", destination, function (err, result, fields) {
        if (err) throw err;

        result = result[0];

		/* if the list of hotels in the destination provided is empty , return 404 page */
        if(result.length == 0){
			res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
	    	return;
        } 

        else{
        	var city = result[0].city;
        	var city_latitude = result[0].city_latitude;
        	var city_longitude = result[0].city_longitude;

	        for(var i =0 ; i < result.length; i++){

				// hotel main attributes
	        	var hotel = new Object();
	        	hotel["id"] = result[i].id;
	        	hotel["city"] = result[i].city;
	        	hotel["place_id"] = result[i].place_id;
	            hotel["name"] = result[i].place;
	            hotel["address"] = result[i].address;
	            hotel["rating"] = result[i].rating;
	        	hotel["coordinates"] = result[i].latitude + ", " + result[i].longitude;
	        	hotel["phone_number"]= result[i].phone_number;
	        	hotel["website"] = result[i].website;

	        	// if price is unavailable -> generate random price between 30€ and 150€
	        	if(result[i].price != null)
	        		hotel["price"] = result[i].price + " €";
        		else
	        		hotel["price"] = Math.floor((Math.random() * 150) + 30) + " €";

	        	if(result[i].photo != null)
	        		hotel["photo"] = result[i].photo.replace(/\\/g,"/");
	        	else
	        		hotel["photo"] = null;

	        	// remove hotels that don't have rating
	        	if(result[i].rating != null)
	        		list_hotels.push(hotel);
	        }

	        res.render(path.join(__dirname+'/templates/hotels.html'), {hotels: list_hotels, city: city, city_latitude: city_latitude, city_longitude: city_longitude});

        }
	});
});



// create manual trip page (step 1)
app.get('/create-trip', function(req, res){

	var num_results = 4; // number of cities and pois to show in the home page sections
	var list_cities = [];
	var top_dest = [];
	var recommended_dest = [];

	// get the list of cities (name) available
	con.query("call getCities()", function (err, result, fields) {
        if (err) throw err;

        result = result[0];

        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }

       	// get the top N cities with the most trips made
        con.query("call getTopCities(?)", num_results, function (err, result, fields) {
        	if (err) throw err;

        	result = result[0];

        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
        		dest.trips = result[i].trips;
        		top_dest.push(dest);
        	}

			// get recommended destinations for each user (for now its random)
        	con.query("call getRandomCities(?)", num_results, function (err, result, fields) {
	        	if (err) throw err;

	        	result = result[0];
	        	
	        	for(var i=0; i<result.length;i++){
	        		var dest = new Object();
	        		dest.name = result[i].name;
	        		dest.trips = result[i].trips;
	        		recommended_dest.push(dest);
	        	}

    			res.render(path.join(__dirname+'/templates/create-trip.html'), {cities: list_cities, top_dest: top_dest, recommended_dest: recommended_dest});

    		});

        });
        
    });

});


/* CREATE A TRIP:
1) create a trip in DB
2) select POI based on user preferences, rating and number of reviews
3) select hotel based on location, rating and number of reviews
4) insert visits chosen in DB
*/
app.post('/create-trip', function(req, res){
	var connection;

	// check user ID (cookies)
	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		// send error message
		return;
	}

	var destination = req.body.destination; // name of the city 

	if(destination == null)
		return; // send error message

	var arrival = req.body.arrival_date;

	if(arrival == null)
		return; // send error message

	var departure = req.body.departure_date;

	if(departure == null)
		return; // send error message

	var num_days = diffBetweenDays(arrival, departure); // compute number of days of the trip 

	// attributes of the trip
	var num_adults = req.body.adults;
	var num_children = req.body.children;
	var hasBudgetConstraint = req.body.has_budget;
	var budget = req.body.budget;
	var travel_mode = 'DRIVING'; // travel mode -> default = DRIVING

	if(req.body.travel_mode != null)
		travel_mode = travel_mode.toUpperCase();

	// check user preferences
	var isReligionSitesInterestChecked = false;
	if(req.body['interests_religion'] != undefined){
		isReligionSitesInterestChecked = true;
	}

	var isTopRatedInterestChecked = false;
	if(req.body['interests_top_rated'] != undefined){
		isTopRatedInterestChecked = true;
	}

	var isHistoricPlacesInterestChecked = false;
	if(req.body['interests_history'] != undefined){
		isHistoricPlacesInterestChecked = true;
	}

	var isRecreationInterestChecked = false;
	if(req.body['interests_recreation'] != undefined){
		isRecreationInterestChecked = true;
	}

	var isNaturePlacesInterestChecked = false;
	if(req.body['interests_nature'] != undefined){
		isNaturePlacesInterestChecked = true;
	}
	
	var isCultureInterestChecked = false;	
	if(req.body['interests_culture'] != undefined){
		isCultureInterestChecked = true;
	}


	// by default, the itinerary category is overall
	var category = "OVERALL";

	if(isNaturePlacesInterestChecked && !isReligionSitesInterestChecked && !isHistoricPlacesInterestChecked && !isRecreationInterestChecked && !isCultureInterestChecked)
		category = "NATURE";
	else if(isHistoricPlacesInterestChecked && !isNaturePlacesInterestChecked && !isRecreationInterestChecked && !isCultureInterestChecked)
		category = "HISTORY";
	else if(isCultureInterestChecked && !isReligionSitesInterestChecked && !isHistoricPlacesInterestChecked && !isRecreationInterestChecked && !isNaturePlacesInterestChecked)
		category = "CULTURE";
	else if(isRecreationInterestChecked && !isReligionSitesInterestChecked && !isHistoricPlacesInterestChecked && !isCultureInterestChecked && !isNaturePlacesInterestChecked)
		category = "RECREATION";


	var xml;
	var num_max_pois = 7;
	var num_max_hotels = 3;

	var pois, chosen_pois, hotels;

	// score the POIs based on its attributes and the user's preferences
	con.query("call getPOIsInfoFromCity(?)", [destination], function (err, result, fields) {
        if (err) throw err;

        result = result[0];

        for(var i=0; i < result.length; i++){
        	result[i].score = result[i].num_reviews / 100 + result[i].google_rating * 10;
        	if(isReligionSitesInterestChecked && RELIGION_TYPES.includes(result[i].poi_type.toUpperCase()))
        		result[i].score += 50;

        	if(isHistoricPlacesInterestChecked && HISTORIC_TYPES.includes(result[i].poi_type.toUpperCase()))
        		result[i].score += 50;

        	if(isRecreationInterestChecked && RECREATION_TYPES.includes(result[i].poi_type.toUpperCase()))
        		result[i].score += 50;

        	if(isNaturePlacesInterestChecked && NATURE_TYPES.includes(result[i].poi_type.toUpperCase()))
        		result[i].score += 50;

        	if(isCultureInterestChecked && CULTURE_TYPES.includes(result[i].poi_type.toUpperCase()))
        		result[i].score += 50;

        	if(isTopRatedInterestChecked)
        		result[i].score += result[i].num_reviews * 2 / 100 + result[i].google_rating * 10;

        	if(result[i].poi_type.toUpperCase() == 'RESTAURANT')
        		result[i].score = 0;
        }

        pois = sortPOIs(result, 'score'); // sort the list of POIs by its score (maximum score first)

        chosen_pois = pois.slice(0,num_days*5);
        chosen_pois = shuffleVisits(chosen_pois); // without the algorithms working, the POIs are randomly assigned to a schedule

		// score the Hotels based on its attributes
        con.query("call getHotelsInfoFromCity(?)", [destination], function (err, result, fields) {
	        if (err) throw err;

	        result = result[0];

	        for(var i=0; i < result.length; i++){
        		result[i].score = result[i].num_reviews / 100 + result[i].google_rating * 10;

        	}

        	hotels = sortPOIs(result, 'score'); // sort the list of Hotels by its score (maximum score first)

			/* GENERATE THE XMLs to be sent to the algorithms */

	        var clients_root = builder.create('Clients'); 
	        var depots_root = builder.create('Depots');
	        var graphs_root = builder.create('Graphs');
	        var clients_data_root = builder.create('ClientsTwData');

	        var num_pois = 0;
	        var num_hotels = 0;

	        var places = [];
	        var coordinates = [];

	        for(var i=0; i < pois.length; i++){

	        	if(pois[i].poi_type.toUpperCase() != "HOTEL" && pois[i].poi_type.toUpperCase() != "RESTAURANT" && num_pois < num_max_pois){
	        		var item = clients_root.ele('Client');
		        	item.ele('Number', pois[i].id);
		        	item.ele('Name', pois[i].name);
		        	item.ele('Latitude', pois[i].latitude);
		        	item.ele('Longitude', pois[i].longitude);


		        	var item_data = clients_data_root.ele('ClientTwData');
		        	item_data.ele('Number', pois[i].id);
		        	item_data.ele('Profit', Math.round(pois[i].score));

		        	if(pois[i].price == null)
		        		item_data.ele('Price', 0);
		        	else
		        		item_data.ele('Price', pois[i].price);

		        	item_data.ele('Time', 60);

		        	var opening_hours = parsePoiOpeningHours(pois[i].opening_hours);
		        	var oh = opening_hours["Monday"];

		        	item_data.ele('Open', oh[0]);
		        	item_data.ele('Close', oh[1]);


		        	var place = new Object();
		        	place["id"] = pois[i].id;
		        	place["name"] = pois[i].name;
		        	place["coordinates"] = pois[i].latitude + ", " + pois[i].longitude;
		        	place["type"] = pois[i].poi_type;

		        	places.push(place);
		        	coordinates.push(pois[i].latitude + ", " + pois[i].longitude);


		        	num_pois++;
	        	}

	        	if(num_pois == num_max_pois)
	        		break;
	        	
	        }


	        for(var i=0; i < hotels.length; i++){
	        	if(pois[i].poi_type.toUpperCase() == "HOTEL" && num_hotels < num_max_hotels){
	        		var item = depots_root.ele('Depot');
		        	item.ele('Number', pois[i].id);
		        	item.ele('Name', pois[i].name);
		        	item.ele('Latitude', pois[i].latitude);
		        	item.ele('Longitude', pois[i].longitude);
		        	item.ele('FixedCost', pois[i].price);


		        	var place = new Object();
		        	place["id"] = pois[i].id;
		        	place["name"] = pois[i].name;
		        	place["coordinates"] = pois[i].latitude + ", " + pois[i].longitude;
		        	place["type"] = pois[i].poi_type;

		        	places.push(place);
		        	coordinates.push(pois[i].latitude + ", " + pois[i].longitude);


		        	num_hotels++;
	        	}

	        	if(num_hotels == num_max_hotels)
	        		break;

	        }

			
			promise.createConnection({
			    host: 'localhost',
			    user: 'root',
			    password: 'password',
			    database: 'placesdb'

			}).then(function(conn){
				connection = conn;

				// ADD TRIP WITH ITS ATTRIBUTES TO THE DB
				var values = [destination,
			    	arrival.split('/')[2] + "-" + (arrival.split('/')[1]<10?'0':'') + arrival.split('/')[1] + "-" + (arrival.split('/')[0]<10?'0':'') + arrival.split('/')[0], 
			    	departure.split('/')[2] + "-" + (departure.split('/')[1]<10?'0':'') + departure.split('/')[1] + "-" + (departure.split('/')[0]<10?'0':'') + departure.split('/')[0],
			    	user_id, num_adults, num_children, category, travel_mode];

			    var result = connection.query("call createTrip(?, ?, ?, ?, ?, ?, ?, ?)", values);

			    return result;

			}).then(function(result){
				trip_id = parseInt(result[0][0].tripID);


				// Generate XML and write to a file 
		        xml = clients_root.end({pretty: true});

		        var dir = 'xml/' + trip_id;
		        try {
				  if (!fs.existsSync(dir)){
				    fs.mkdirSync(dir)
				  }
				} catch (err) {
				  console.error(err)
				}

				fs.writeFile('xml/' + trip_id + '/clients.xml', xml, function(err, data) {
			   		if (err) console.log(err);

		     	 	console.log('XML for Clients/POIs Generated');
			  	});


				// Generate XML and write to a file 
				xml = depots_root.end({ pretty: true});
				fs.writeFile('xml/' + trip_id + '/depots.xml', xml, function(err, data) {
			   		if (err) console.log(err);

		     	 	console.log('XML for Depots/Hotels Generated');
			  	});

			  	// Generate XML and write to a file 
				xml = clients_data_root.end({ pretty: true});
				fs.writeFile('xml/' + trip_id + '/clientsTwData.xml', xml, function(err, data) {
			   		if (err) console.log(err);

		     	 	console.log('XML for Clients Data Generated');
			  	});


				var item = graphs_root.ele('Graph');
				item.ele('Number', 1);
				item.ele('Name', 'Distance Matrix');
				item.ele('Complete', 'True');
				item.ele('Directed', 'True');

				distance.mode(travel_mode.toLowerCase());

				distance.matrix(coordinates, coordinates, function (err, distances) {
				    if (err) {
				        return console.log(err);
				    }

				    if (distances.status == 'OK') {
				    	for (var i=0; i < coordinates.length; i++) {
				    		var arc = item.ele('Arcs');

				    		if(places[i].type == 'Hotel')
				    			arc.ele("SrcObject", "H");
				    		else
				    			arc.ele("SrcObject", "P");

				    		arc.ele("SrcNumber", places[i].id);


				    		for (var j=0; j < coordinates.length; j++) {

				    			// only add if there is a distance between the two places and if it's not the same place
				    			if(j != i && distances.rows[0].elements[j].status == 'OK'){
					    			var des = arc.ele('Des');

					    			if(places[j].type == 'Hotel')
						    			des.ele("Obj", "H");
						    		else
						    			des.ele("Obj", "P");

					    			des.ele('Num', places[j].id);
					    			des.ele('Len', {'units': 'meters'}, distances.rows[i].elements[j].distance.value);
					    			des.ele('Time', {'units': 'seconds'}, distances.rows[i].elements[j].duration.value);
					    		}
				    		}
				    	}
			    	}

			    	xml = graphs_root.end({ pretty: true});


			    	// Generate XML and write to a file 
					fs.writeFile('xml/' + trip_id + '/graphs.xml', xml, function(err, data) {
				   		if (err) console.log(err);

		     	 		console.log('XML for Distances Generated');
				  	});

				});

				
				// REPLACE WITH THE RESULTS FROM THE ALGORITHMS 
				// WITHOUT THE ALGORITHMS, THE SCHEDULES OF THE VISITS ARE STATIC AND THE POIS ARE DISTRIBUTED RANDOMLY IN THE STATIC SCHEDULES
			
				arrival = arrival.split('/')[0] + "-" + arrival.split('/')[1] + "-" + arrival.split('/')[2];

		  		var days = getTripDays(arrival, parseInt(num_days), false);

		  		var start_hours = ["10:00", "13:00", "15:00", "16:15", "18:00"]; // static start hours for the visits
		  		var end_hours = ["12:00", "14:30", "16:00", "18:00", "20:00"]; // static end hours for the visits

		  		var start_time_list = [];
		  		var end_time_list = [];

		  		for(var i=0 ; i < days.length ; i++){
		  			day = days[i].split('-')[2] + "-" + (days[i].split('-')[1]<10?'0':'') + days[i].split('-')[1] + "-" + (days[i].split('-')[0]<10?'0':'') + days[i].split('-')[0];
		  			for(var j=0 ; j < start_hours.length; j++){
		  				start_time_list.push(day + " " + start_hours[j]);
		  				end_time_list.push(day + " " + end_hours[j]);
		  			}
		  		}

		  		var i=0;

		        var list_pois_in_plan = [];

		        while(i < start_time_list.length){

		        	if(pois.length == list_pois_in_plan.length){
	        			break;
	        		}
		        	
		        	var poiIsValid = false;

		        	while(!poiIsValid){
		        		var poi = pois[i].id;

		        		if(!list_pois_in_plan.includes(poi)){
		        			list_pois_in_plan.push(poi);
		        			poiIsValid = true;
		        		}
		        	}

					/* add the visits to the DB */
				  	con.query("call addVisitToTrip(?, ?, ?, ?, ?, ?)", [trip_id, poi, start_time_list[i], end_time_list[i], 0, 0], function (err, result) {
				    	if (err) throw err;

				  	});

				  	i++;	
		  		}

		  		var j=0;

		  		while(j < days.length){
		  			var day = days[j].split('-')[2] + "-" + (days[j].split('-')[1]<10?'0':'') + days[j].split('-')[1] + "-" + (days[j].split('-')[0]<10?'0':'') + days[j].split('-')[0];
		  			day = day + " " + "20:30";

					/* add the hotels to the DB */
		  			con.query("call addVisitToTrip(?, ?, ?, ?, ?, ?)", [trip_id, hotels[0].id, day, day, 0, 1], function (err, result) {
				    	if (err) throw err;

				  	});

				  	j++;
		  		}



				connection.end();
				
		    	console.log("TRIP CREATED: ", trip_id);
		    	res.render(path.join(__dirname+'/templates/see-trip.html'), {trip: trip_id});

		    });
	 	});
   	});
});




// create trip manual (step 1)
app.post('/create-trip-m', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		// send error message
		return;
	}

	var destination = req.body.destination;

	if(destination == null)
		return; // send error message

	var arrival = req.body.arrival_date;

	if(arrival == null)
		return; // send error message

	var departure = req.body.departure_date;

	if(departure == null)
		return; // send error message

	// attributes of the trip
	var num_adults = req.body.adults;
	var num_children = req.body.children;
	var hasBudgetConstraint = req.body.has_budget;
	var budget = req.body.budget;
	var travel_mode = 'DRIVING'; // travel mode -> default = DRIVING


	if(req.body.travel_mode != null)
		travel_mode = req.body.travel_mode.toUpperCase();


    promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
		database: 'placesdb'
		
	}).then(function(conn){
		connection = conn;

		// ADD THE MANUAL TRIP WITH ITS ATTRIBUTES TO THE DB
		var values = [destination,
	    	arrival.split('/')[2] + "-" + (arrival.split('/')[1]<10?'0':'') + arrival.split('/')[1] + "-" + (arrival.split('/')[0]<10?'0':'') + arrival.split('/')[0], 
	    	departure.split('/')[2] + "-" + (departure.split('/')[1]<10?'0':'') + departure.split('/')[1] + "-" + (departure.split('/')[0]<10?'0':'') + departure.split('/')[0],
	    	user_id, num_adults, num_children, travel_mode];

	    var result = connection.query("call createManualTrip(?, ?, ?, ?, ?, ?, ?)", values);

	    return result;

    }).then(function(result){
    	var trip_id = parseInt(result[0][0].tripID);

    	console.log("MANUAL TRIP CREATED: ", trip_id);

    	res.redirect(req.baseUrl + '/trip-m?id='+ trip_id)

	});

});

// create a trip from a already existing trip
app.post('/create-child-trip', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']);

	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip;

	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The plan is not valid."});
		return;
	}

	var start_date = req.body.start_date;

	if(start_date == null){
		res.contentType('json');
		res.send({result: 'error', msg: "The start date is invalid."});
		return;
	}

	var end_date = req.body.end_date;

	if(end_date == null){
		res.contentType('json');
		res.send({result: 'error', msg: "The end date is invalid."});
		return;
	}

	var start_time_list = [];
	var end_time_list = [];

	promise.createConnection({
		host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
		connection = conn;

	    var result = connection.query("call getInfoTrip(?)", [trip_id]);

    	return result;

	}).then(function(result){

		result = result[0];

		var visits = [];
		var city = result[0].city;


		for(var i=0; i<result.length; i++){
			visits.push(result[i]);
		}

		var num_days = diffBetweenDays(start_date.split('/')[2]+"/"+start_date.split('/')[1]+"/"+start_date.split('/')[0], end_date.split('/')[2]+"/"+end_date.split('/')[1]+"/"+end_date.split('/')[0]);
		days = getTripDays(start_date.split('/')[2]+"-"+start_date.split('/')[1]+"-"+start_date.split('/')[0], parseInt(num_days), false);

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

		con.query("call createChildTrip(?,?,?,?,?)", [start_date, end_date, user_id, city, trip_id], function(err, result) {
			if (err){
				throw err;
				res.contentType('json');
				res.send({result: 'error', msg: 'Error generating the trip. Try again.'});
				return;
			}

			result = result[0];

			var child_trip = result[0].tripID;

			var i = 0;

			while(i < start_time_list.length){

				con.query("call addVisitToTrip(?,?,?,?,?,?);", [child_trip, visits[i].poi_id, start_time_list[i], end_time_list[i], 0, 0], function (err, result) {
			    	if (err) throw err;
			  	});

		  		i++;
			}


			con.query("call unsetUserInterested(?,?)", [user_id, trip_id], function(err, result){
				if (err) throw err;

			});

			console.log("TRIP CREATED: ", child_trip)

			res.contentType('json');
			res.send({result: 'success', trip: child_trip});

		});
	});
});


// delete a trip
app.post('/delete-trip', function(req, res){
	var user_id = parseInt(req.cookies['user']); // user ID
	
	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error'});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error'});
		return;
	}

	// delete trip (if trip exits and user is the owner)
	con.query("call deleteTrip(?,?)", [trip_id, user_id], function(err, result) {
		if (err) throw err;

		res.contentType('json');
		res.send({result: 'success'});

	});

});


// delete multiple trips
app.post('/delete-trips', function(req, res){
	var user_id = parseInt(req.cookies['user']); // user ID
	
	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error'});
		return;
	}

	var trips_to_delete = req.body.trips; // number of trips to be deleted
	var trips_deleted = 0; // trips deleted 

	// delete trips (one at a time)
	for(var i=0; i < trips_to_delete.length; i++){

		// delete trip (if trip exits and user is the owner)
		con.query("call deleteTrip(?,?)", [trips_to_delete[i], user_id], function(err, result) {
			if (err) throw err;

			else{
				trips_deleted++;
			}
		});
	}

	// check if all trips where deleted
	if(trips_deleted == trips_deleted.length){
		res.contentType('json');
		res.send({result: 'success'});
	}

	else{
		res.contentType('json');
		res.send({result: 'error', msg: 'Error deleting trips'});
	}


});

// rename a trip
app.post('/rename-trip', function(req, res){
	var user_id = parseInt(req.cookies['user']); // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	var name = req.body.name; // new name for the trip

	// check if new name is valid
	if(name == undefined || name == null || name == ""){
		res.contentType('json');
		res.send({result: 'error', msg: "The name of the trip is not valid."});
		return;
	}

	// rename the trip
	con.query("call renameTrip(?,?,?)", [trip_id, user_id, name], function(err, result) {
		if (err) throw err;

		res.contentType('json');
		res.send({result: 'success'});

	});

});


// share a trip
app.post('/share-trip', upload_trip.single('photo'), function (req, res, next){

	var user_id = parseInt(req.cookies['user']); // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	// check if trip exists
	con.query("call tripExists(?)", trip_id, function (err, result, fields) {
		if (err) throw err;

		result = result[0];

		// if not exists, return a error msg
		if(result[0].trip_exists == 0){
			res.contentType('json');
			res.send({result: 'error', msg: "The trip is not valid."});
			return;
		}

		// attributes
		var filename = req.file.filename;
		var description = req.body.description;
		var rating = req.body.rating;	
		var accessibility = req.body.accessibility;	
		var security = req.body.security;	
		var price_rating = req.body.price_rating;

		if(accessibility == "" || accessibility == undefined)
			accessibility = null;

		else{
			accessibility = parseInt(accessibility);

			if(accessibility < 1 || accessibility > 5){
				accessibility = null;
			}
		}

		if(security == "" || security == undefined)
			security = null;

		else{
			security = parseInt(security);

			if(security < 1 || security > 5){
				security = null;
			}
		}

		if(price_rating == "" || price_rating == undefined)
			price_rating = null;

		else{
			price_rating = parseInt(price_rating);

			if(price_rating < 1 || price_rating > 5){
				price_rating = null;
			}
		}

		// share the trip
		con.query("call shareTrip(?,?,?,?,?,?,?,?)", [trip_id, user_id, description, filename, rating, accessibility, security, price_rating], function (err, result, fields) {
			if (err) throw err;

	    	res.redirect(req.baseUrl + '/trips');

		});
	});

});


// make a review of a trip
app.post('/review-trip', function(req, res){

	var user_id = parseInt(req.cookies['user']); // user ID
	
	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	// check if trip exists
	con.query("call tripExists(?)", trip_id, function (err, result, fields) {
		if (err) throw err;

		result = result[0];

		// if not exists, return a error msg
		if(result[0].trip_exists == 0){
			res.contentType('json');
			res.send({result: 'error', msg: "The trip is not valid."});
			return;
		}

		// review text
		var review = null;
		if(req.body.review != undefined)
			review = req.body.review;

		/* review ratings */
		var review_rating = req.body.rating;	
		var review_accessibility = req.body.rating_access;
		var review_security = req.body.rating_security;
		var review_price = req.body.rating_price;

		if(review_rating == "" || review_rating == undefined){
			res.contentType('json');
			res.send({result: 'error', msg: "You must specify the rating."});
			return;
		}

		else{
			review_rating = parseInt(review_rating);

			if(review_rating < 1 || review_rating > 5){
				res.contentType('json');
				res.send({result: 'error', msg: "The rating of the trip is not valid."});
				return;
			}
		}

		if(review_accessibility == "" || review_accessibility == undefined)
			review_accessibility = null;

		else{
			review_accessibility = parseInt(review_accessibility);

			if(review_accessibility < 1 || review_accessibility > 5){
				review_accessibility = null;
			}
		}

		if(review_security == "" || review_security == undefined)
			review_security = null;

		else{
			review_security = parseInt(review_security);

			if(review_security < 1 || review_rating > 5){
				review_security = null;
			}
		}

		if(review_price == "" || review_price == undefined)
			review_price = null;

		else{
			review_price = parseInt(review_price);

			if(review_price < 1 || review_price > 5){
				review_price = null;
			}
		}

		// create the review
		con.query("call reviewTrip(?,?,?,?,?,?,?)", [trip_id, user_id, review_rating, review, review_accessibility, review_security, review_price], function (err, result, fields) {
			if (err){
				throw err;
				res.contentType('json');
				res.send({result: 'error', msg: "Error making the review. Try again !"});
				return;
			} 

			res.contentType('json');
			res.send({result: 'success'});

		});
	});
});


// archive a trip 
app.post('/archive-trip', function(req, res){
	var user_id = parseInt(req.cookies['user']); // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	// archive the trip
	con.query("call archiveTrip(?,?)", [trip_id, user_id], function (err, result, fields) {
		if (err) throw err;

    	res.contentType('json');
		res.send({result: 'success'});

	});
});


// save a trip (for manual trips)
app.post('/save-trip', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']); // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
		connection = conn;

	    var result = connection.query("call getOwnerOfTripManual(?)", [trip_id]);

	    return result;
	}).then(function(result){

		if(result[0][0].user == user_id){
			connection.query("call saveTripManual(?)", [trip_id]);

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


// set trip as favorite
app.post('/favorite-trip', function(req, res){

	var user_id = parseInt(req.cookies['user']); // user ID 

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	// set trip as favorite
	con.query("call setFavoriteTrip(?,?)", [user_id, trip_id], function (err, result, fields) {
    	if (err){
    		throw err;
    		res.send(JSON.stringify('error'));
    	}

    	res.send(JSON.stringify('success'));

    });
});


// unset trip as favorite 
app.post('/unfavorite-trip', function(req, res){
	var user_id = parseInt(req.cookies['user']); // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	// unset trip as favorite
	con.query("call unfavoriteTrip(?,?)", [user_id, trip_id], function (err, result, fields) {
    	if (err){
    		throw err;
    		res.send(JSON.stringify('error'));
    	}

    	res.send(JSON.stringify('success'));

    });


});


// set user interested in a trip
app.post('/user-interested', function(req, res){

	var user_id = parseInt(req.cookies['user']); // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	// set user interested in the trip
	con.query("call setUserInterested(?,?)", [user_id, trip_id], function (err, result, fields) {
    	if (err){
    		throw err;
    		res.send(JSON.stringify('error'));
    	}

    	res.send(JSON.stringify('success'));
    });

});


// unset user interested in a trip
app.post('/user-not-interested', function(req, res){

	var user_id = parseInt(req.cookies['user']); // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	// unset user interested in the trip
	con.query("call unsetUserInterested(?,?)", [user_id, trip_id], function (err, result, fields) {
    	if (err){
    		throw err;
    		res.send(JSON.stringify('error'));
    	}

    	res.send(JSON.stringify('success'));

    });
});


// add a visit to a trip
app.post('/add-visit', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']); // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	var poi_id = req.body.poi; // poi to be added (poi ID)

	// check if poi ID is an integer number
	if(isNaN(poi_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The place is not valid."});
		return;
	}

	var schedule = req.body.schedule; // schedule chosen (undefined if it will be chosen by the system)

	var isManual;

	promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

    }).then(function(conn){
    	connection = conn;

		return connection.query("call isTripManual(?)", [trip_id]); // check if trip is manual

	}).then(function(result){

		isManual = parseInt(result[0][0].isManual[0]);

		return connection.query("call getVisitTimes(?,?)", [trip_id, isManual]); // get schedules for the visits already in the trip

	}).then(function(result){

		result = result[0];

		var trip = {};

        // if trip has visits, parse the schedules and add to a dictionary (keys = days, values = start time & end time)
        if(result.length > 0){

        	for(var i=0; i < result.length; i++){
	        	var visit = new Object();

	        	var start_time = new Date(result[i].start_time);
	        	var end_time = new Date(result[i].end_time);

	        	var day = start_time.getFullYear() + "-" + (start_time.getMonth()<10?'0':'') + (start_time.getMonth() + 1)  + "-" + (start_time.getDate()<10?'0':'') + start_time.getDate();

	        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
	        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();

	        	if(trip[day] != undefined){
	        		trip[day].push(visit);
	        	}

	        	else{
	        		trip[day] = [];
	        		trip[day].push(visit);
	        	}
	        }


	        var chosen_schedule;

	        if(schedule != undefined){
	        	chosen_schedule = getFinalSchedule(schedule.split(" ")[0], schedule.split(" ")[1]); // if user chose a schedule, parse the schedule to the right format 
	        }
	        else
	    		chosen_schedule = getTripOpenSlot(trip); // check the openslots available and select one


			// if a schedule was found, add the visit to the DB
	    	if(chosen_schedule != false){
				connection.query("call addVisitToTrip(?,?,?,?,?,?)", [trip_id, poi_id, chosen_schedule[0], chosen_schedule[1], isManual, 0], function (err, result) {
		    		if (err) throw err;
				  	
					res.contentType('json');
					
					console.log("ADDED VISIT " + req.body.poi + " TO THE TRIP " + req.body.trip);

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

		/* if trip has no visits */
        else{
        	return connection.query("call getTripDates(?)", [trip_id]);

        }

	}).then(function(result){

		// ignore
		if(result == 1)
			return;

		/* if trip has no visits */

		result = result[0];

		var chosen_schedule;

        if(schedule != undefined){
    		chosen_schedule = getFinalSchedule(schedule.split(" ")[0], schedule.split(" ")[1]); // if user chose a schedule, parse the schedule to the right format
        }

		// select the first schedule from the first day of the trip to the visit
        else{
        	day = new Date(result[0].start_date);
			day = day.getFullYear() + "-" + (day.getMonth()<10?'0':'') + (day.getMonth() + 1)  + "-" + (day.getDate()<10?'0':'') + day.getDate();

			var schedules = getSchedules();
			chosen_schedule = getFinalSchedule(day, schedules[0]);	
        }
		
		// if a schedule was found, add the visit to the DB
		if(chosen_schedule != false){
        	
        	connection.query("call addVisitToTrip(?,?,?,?,?,?)", [trip_id, poi_id, chosen_schedule[0], chosen_schedule[1], isManual, 0], function (err, result) {
	    		if (err) throw err;
			  	
	    		res.contentType('json');

				console.log("ADDED VISIT " + req.body.poi + " TO THE TRIP " + req.body.trip);

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



// delete a visit
app.post('/delete-visit', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']); // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	var trip_id = req.body.trip; // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The trip is not valid."});
		return;
	}

	var poi_id = req.body.poi; // poi to be added (poi ID)

	// check if poi ID is an integer number
	if(isNaN(poi_id)){
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

		return connection.query("call isTripManual(?)", [trip_id]); // check if trip is manual

	}).then(function(result){

		isManual = parseInt(result[0][0].isManual[0]);

	    var result = connection.query("call getOwnerOfTrip(?);", [trip_id]); // get the owner of the trip

	    return result;

	}).then(function(result){

		//if the owner of the trip is the same as the one that made the request, delete the visit
		if(result[0][0].user == user_id){

			result = connection.query("call deleteVisit(?,?,?)", [trip_id, poi_id, isManual]);
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



// page of the trip
app.get('/trip', function(req, res){
	var connection;

	var user_id = parseInt(req.cookies['user']); // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.render(path.join(__dirname+'/templates/need-login.html'));
		return;	
	}

	var trip_id = parseInt(req.query['id']); // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
	}

	var view_method = req.query['v']; // method chose by the user to see his/her trip

	/* variables to store the information of the trip */
	var start_date = "n/a";
    var end_date = "n/a";
    var city = "";
    var name;
    var date_diff = 0;
    var isPublic = 0;
    var source;
    var num_viewers = 0;
    var openslots = {};

    /* check if the trip with that ID exists */
    con.query("call tripExists(?)", trip_id, function (err, result, fields) {
		if (err) throw err;

		result = result[0];

		if(result[0].trip_exists == 0){
			res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
			return;
		}

		/* get the visits of the trip */
		con.query("call getVisitsFromTrip(?,?)", [user_id, trip_id], function (err, result, fields) {
			if (err) throw err;

			result = result[0];

			/* trip information */
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

	        	/* get a list of all days of the trip */
	        	days = getTripDays(start_date_aux, parseInt(date_diff));

	        	/* date with short format (ex: 29-08-2019) */
	        	var days_shortname = [];

	        	for(var i=0; i < days.length; i++){
	        		days_shortname.push(convertToDateFormat(days[i].split(', ')[1]));
	        	}


	        	/* get the open slots of the trip that can have a new visit or move a visit to */
	        	var list_places_trip = [];
    			var trip = {};
    			var hotels = {};

    			for(var i=0 ; i < days.length; i++){
    				var d = new Date(days[i]);
    				d = d.getFullYear() + "-" + (d.getMonth()<10?'0':'') + (d.getMonth() + 1)  + "-" + (d.getDate()<10?'0':'') + d.getDate();
    				trip[d] = [];
    			}

    			for(var i =0 ; i < result.length; i++){
		        	list_places_trip.push(result[i].poi_id);

					var visit = new Object();

		        	var start_time = new Date(result[i].start_time);
					var end_time = new Date(result[i].end_time);

					var day = start_time.getFullYear() + "-" + (start_time.getMonth()<10?'0':'') + (start_time.getMonth() + 1)  + "-" + (start_time.getDate()<10?'0':'') + start_time.getDate();

		        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
		        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();


		        	if(trip[day] != undefined){
		        		trip[day].push(visit);
		        	}

		        	else{
		        		trip[day] = [];
		        		trip[day].push(visit);
		        	}

		        }

		        openslots = getAllOpenSlotsAvailable(trip);


	        	/* if the user didn't give a name to his/her trip, use the default 'Your visit to <name of the city>' */
	        	if(result[0].trip_name != null && result[0].trip_name.length > 0)
	        		name = result[0].trip_name;
	        	else
	        		name = 'Your visit to ' + city;

				/* other information to be provided to the UI */
	        	isPublic = result[0].isPublic[0];

	        	if(parseInt(result[0].user) == parseInt(user_id))
	        		source = "author";
	        	else
	        		source = "viewer";

	        	num_viewers = result[0].num_viewers;

	        	travel_mode = result[0].travel_mode.toUpperCase();

	        	if(result[0].num_children > 1 && result[0].num_adults > 1)
	        		num_persons = result[0].num_adults + " Adults + " + result[0].num_children + " Children";
	        	else if (result[0].num_children > 1 && result[0].num_adults == 1)
	        		num_persons = result[0].num_adults + " Adult" + result[0].num_children + " Children";
	        	else if (result[0].num_children == 1 && result[0].num_adults > 1)
	        		num_persons = result[0].num_adults + " Adults" + result[0].num_children + " Child";
	        	else if (result[0].num_children == 1 && result[0].num_adults == 1)
	        		num_persons = result[0].num_adults + " Adult" + result[0].num_children + " Child";
	        	else if (result[0].num_children == 0 && result[0].num_adults > 1)
	        		num_persons = result[0].num_adults + " Adults";
	        	else if (result[0].num_children == 0 && result[0].num_adults == 1)
	        		num_persons = result[0].num_adults + " Adult";
			}


			/* get the list of visits of the trip */
			var trip = [];
			var hotels = [];
	        for(var i=0; i < result.length; i++){
	        	var visit = new Object();

	        	/* visit information */
	        	var start_time = new Date(result[i].start_time);
	        	var end_time = new Date(result[i].end_time);

	        	visit["day"] = (start_time.getDate()<10?'0':'') + start_time.getDate() + " " + convertToTextMonth(start_time.getMonth()) + " " + start_time.getFullYear();
	         	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
	        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();

	        	/* full schedule  */

			 	if(result[i].start_time != undefined && result[i].end_time != undefined){
		        	st_date = new Date(result[i].start_time);
		        	en_date = new Date(result[i].end_time);

		        	if(st_date.getDate() == "1" || st_date.getDate() == "21" || st_date.getDate() == "31")
		        		day = st_date.getDate() + "st"
		        	else if(st_date.getDate() == "2" || st_date.getDate() == "22")
		        		day = st_date.getDate() + "nd"
		        	else if(st_date.getDate() == "3" || st_date.getDate() == "23")
		        		day = st_date.getDate() + "rd"
		        	else
		        		day = st_date.getDate() + "th"


		        	var schedule = convertToTextMonth(st_date.getMonth()) +  " " + day + " from " + 
		        	st_date.getHours() + ":" + (st_date.getMinutes()<10?'0':'') + st_date.getMinutes() + " to " + 
		        	en_date.getHours() + ":" + (en_date.getMinutes()<10?'0':'') + en_date.getMinutes();

		        	visit["schedule"] = schedule;
		        }

		        	
	        	/* point of interest information */

	        	visit["id"] = result[i].id;
	        	visit["name"] = result[i].name;
	        	visit["place_id"] = result[i].place_id;
	        	visit["address"] = result[i].address;
	        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
	        	visit["poi_type"] = result[i].poi_type;
	        	visit["city"] = result[i].city; 
	        	visit["google_rating"] = result[i].google_rating; 

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


	        	var no_trips = result[i].no_trips;
				if(no_trips == null)
					no_trips = 0;

				visit["no_trips"] = no_trips;

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

				if(result[i].isHotel[0]){
					
					hotels.push(visit);
				}

				else{
	        		trip.push(visit);
				}

			}
			
	        /* get the weather forecast if it's possible from OPEN WEATHER MAP*/
	        var weather = [];
	        var weather_icons = [];
	        var count = 0;
	        var times = [];

			for(var i=0; i < trip.length; i++){
				times[i] = [trip[i].day, trip[i].start_time];

				var url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + parseFloat(trip[i].coordinates.split(',')[0]) + "&lon=" + parseFloat(trip[i].coordinates.split(',')[1]) + "&appid=" + OPEN_WEATHER_API_KEY + "&units=metric";

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
			    	trip[i]["weather"] = weather[i];
			    	trip[i]["weather_icon"] = weather_icons[i];
			    }


			    promise.createConnection({
	    			host: 'localhost',
				    user: 'root',
				    password: 'password',
				    database: 'placesdb'

				}).then(function(conn){
					connection = conn;

					var result = connection.query("call getCityIDFromTrip(?)", [trip_id]);

					return result;

				}).then(function(result){
					var city_id = result[0][0].city;

					/* get suggestions */
			        con.query("call getOtherSuggestionsFromTrip(?, ?)", [trip_id, city_id], function (err, result, fields) {
			        	if (err) throw err;

			        	result = result[0];

			        	var suggested_visits = []; // list of POIs suggested
			        	var suggested_hotels = []; // list of hotels suggested
			        	var size = 6; // total number of suggestions
			        	var total_hotels = 0;

			        	if(result.length < size)
			        		size = result.length;

			        	for(var i=0; i < result.length; i++){
			        		if(result[i].poi_type.toUpperCase() == 'HOTEL')
				        		total_hotels++;
				        }

				        var i = 0;

			        	while(suggested_hotels.length + suggested_visits.length < size){
				        	var visit = new Object();
				        	visit["id"] = result[i].id;
				        	visit["name"] = result[i].name;
				        	visit["place_id"] = result[i].place_id;
				        	visit["poi_type"] = result[i].poi_type;
    						visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
    						visit["address"] = result[i].address;

				        	if(result[i].photo != null)
				        		visit["photo"] = result[i].photo.replace(/\\/g,"/");
				        	else
				        		visit["photo"] = null;

				        	if(result[i].poi_type.toUpperCase() == 'HOTEL' && suggested_hotels.length < Math.floor(size / 2))
				        		suggested_hotels.push(visit);
				        	else if (result[i].poi_type.toUpperCase() != 'RESTAURANT' && result[i].poi_type.toUpperCase() != 'HOTEL' && suggested_visits.length < Math.ceil(size / 2) || suggested_hotels.length == total_hotels)
				        		suggested_visits.push(visit);

				        	i = (i + 1) % result.length;
				        }

						/* get trip reviews */
						con.query("call getTripReviews(?)", trip_id, function (err, result, fields) {
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

							/* get trip stats */	   	 
					        con.query("call getTripStats(?)", trip_id, function (err, result, fields) {
				        		if (err) throw err;

				        		result = result[0];

								/* default values */
				        		var rating = "0.0";
				        		var accessibility_rating = "No information available";
				        		var security_rating = "No information available";
				        		var price_rating = "No information available";
				        		var num_reviews = 0;
				        		var num_trips = 0;
				        		var num_interests = 0;


				        		if(result.length > 0){
				        			num_reviews = result[0].num_reviews;
				        			num_trips = result[0].num_trips;
				        			num_interests = result[0].num_interests;
				        			if(result[0].rating != null)
				        				rating = result[0].rating.toFixed(1);
				        			if(result[0].accessibilityRating != null)
				        				accessibility_rating = result[0].accessibilityRating.toFixed(1);
				        			if(result[0].securityRating != null)
				        				security_rating = result[0].securityRating.toFixed(1);
				        			if(result[0].priceRating != null)
				        				price_rating = result[0].priceRating.toFixed(1);

				        		}

								/* if the page was requested by other person (not the owner)*/
				        		if(source != "author"){
				        			if(isPublic == "1"){
					        			con.query("call isUserInterested (?, ?)", [user_id, trip_id], function (err, result, fields) {
					        				if (err) throw err;

					        				result = result[0];

					        				var isInterested = result[0].isInterested;

					        				data = {trip_id: trip_id, name: name, trip: trip, hotels: hotels, start_date: start_date, end_date: end_date, city: city, city_latitude: city_latitude, city_longitude: city_longitude, days: days, days_shortname: days_shortname, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels, source: source, isPublic: isPublic, isManual: 0, reviews: reviews, num_viewers: num_viewers, rating: rating, accessibility_rating: accessibility_rating, security_rating: security_rating, price_rating: price_rating, num_reviews: num_reviews, num_trips: num_trips, num_interests: num_interests, isInterested: isInterested, isEditable: 0, travel_mode: travel_mode, num_persons: num_persons, openslots: openslots};

					        				if(view_method == "full")
					        					res.render(path.join(__dirname+'/templates/full-trip.html'), data);
					        				else if(view_method == "map")
					        					res.render(path.join(__dirname+'/templates/map.html'), data);
					        				else
					        					res.render(path.join(__dirname+'/templates/trip.html'), data);

					        			});
				        			}
						        		
					        		else
						        		res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
				        		}

								/* if the page was requested by the owner of the trip*/
				        		else{

				        			isEditable = 1;

									/* if the trip is Public or has already made -> it's not editable */
				        			if(isPublic == "1" || new Date(start_date) <= new Date())
				        				isEditable = 0;

				        			data = {trip_id: trip_id, name: name, trip: trip, hotels: hotels, start_date: start_date, end_date: end_date, city: city, city_latitude: city_latitude, city_longitude: city_longitude, days: days, days_shortname: days_shortname, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels, source: source, isPublic: isPublic, isManual: 0, reviews: reviews, num_viewers: num_viewers, rating: rating, accessibility_rating: accessibility_rating, security_rating: security_rating, price_rating: price_rating, num_reviews: num_reviews, num_trips: num_trips, num_interests: num_interests, isInterested: 0, isEditable: isEditable, travel_mode: travel_mode, num_persons: num_persons, openslots: openslots};


				        			if(view_method == "full")
			        					res.render(path.join(__dirname+'/templates/full-trip.html'), data);
			        				else if(view_method == "map")
			        					res.render(path.join(__dirname+'/templates/map.html'), data);
			        				else
			        					res.render(path.join(__dirname+'/templates/trip.html'), data);
					        		
				        		}
			        		});
		        		});
	        		});
				}).then(function(result){
				    result = connection.query("call updateTripViewers (?)", [trip_id]); // update the number of vieweres of this trip
				    connection.end();
				});
			});
		});
	});

});


// page of the manual trip
app.get('/trip-m', function(req,res){
	var connection;

	var user_id = parseInt(req.cookies['user']); // user ID
	var trip_id = parseInt(req.query['id']); // trip ID

	// check if trip ID is an integer number
	if(isNaN(trip_id)){
		res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
		return;
	}

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.render(path.join(__dirname+'/templates/need-login.html'));
		return;
	}

	/* variables to store the information of the trip */
	var start_date = "n/a";
    var end_date = "n/a";
    var city = "";
    var name;
    var date_diff = 0;
    var isPublic = 0;
    var source;
    var num_viewers = 0;
    var travel_mode;
    var num_persons;
	var days_shortname = [];
	var num_visits = 0;
	var expiration_time;

	/* check if trip exists and is Manual */
	con.query("call isTripManual(?)", trip_id, function (err, result, fields) {
		if (err) throw err;

		result = result[0];

		if(result[0].isManual[0] == 0){
			res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
			return;
		}

		/* get the visits of the trip */
		con.query("call getVisitsFromTrip(?, ?)", [user_id, trip_id], function (err, result, fields) {
			if (err) throw err;

			result = result[0];

			num_visits = result.length;

			/* trip information */
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

				/* get a list of all days of the trip */
	        	days = getTripDays(start_date_aux, parseInt(date_diff));

				/* date with short format (ex: 29-08-2019) */
	        	for(var i=0; i < days.length; i++){
	        		days_shortname.push(convertToDateFormat(days[i].split(', ')[1]));
	        	}

				/* if the user didn't give a name to his/her trip, use the default 'Your visit to <name of the city>' */
	        	if(result[0].trip_name != null && result[0].trip_name.length > 0)
	        		name = result[0].trip_name;
	        	else
	        		name = 'Your visit to ' + city;

				/* other information to be provided to the UI */
	        	isPublic = result[0].isPublic[0];

	        	if(parseInt(result[0].user) == parseInt(user_id))
	        		source = "author";
	        	else
	        		source = "viewer";

	        	num_viewers = result[0].num_viewers;

	        	travel_mode = result[0].travel_mode.toUpperCase();

	        	if(result[0].num_children > 1 && result[0].num_adults > 1)
	        		num_persons = result[0].num_adults + " Adults + " + result[0].num_children + " Children";
	        	else if (result[0].num_children > 1 && result[0].num_adults == 1)
	        		num_persons = result[0].num_adults + " Adult" + result[0].num_children + " Children";
	        	else if (result[0].num_children == 1 && result[0].num_adults > 1)
	        		num_persons = result[0].num_adults + " Adults" + result[0].num_children + " Child";
	        	else if (result[0].num_children == 1 && result[0].num_adults == 1)
	        		num_persons = result[0].num_adults + " Adult" + result[0].num_children + " Child";
	        	else if (result[0].num_children == 0 && result[0].num_adults > 1)
	        		num_persons = result[0].num_adults + " Adults";
	        	else if (result[0].num_children == 0 && result[0].num_adults == 1)
	        		num_persons = result[0].num_adults + " Adult";

	        	expiration_time = result[0].expiration_time;

			}

			else{

				con.query("call getTripDates(?)", [trip_id], function (err, result, fields) {
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

			        	days = getTripDays(start_date_aux, parseInt(date_diff));

			        	for(var i=0; i < days.length; i++){
			        		days_shortname.push(convertToDateFormat(days[i].split(', ')[1]));
			        	}

			        	if(result[0].trip_name != null && result[0].trip_name.length > 0)
			        		name = result[0].trip_name;
			        	else
			        		name = 'Your visit to ' + city;

			        	travel_mode = result[0].travel_mode.toUpperCase();

	        			if(result[0].num_children > 1 && result[0].num_adults > 1)
			        		num_persons = result[0].num_adults + " Adults + " + result[0].num_children + " Children";
			        	else if (result[0].num_children > 1 && result[0].num_adults == 1)
			        		num_persons = result[0].num_adults + " Adult" + result[0].num_children + " Children";
			        	else if (result[0].num_children == 1 && result[0].num_adults > 1)
			        		num_persons = result[0].num_adults + " Adults" + result[0].num_children + " Child";
			        	else if (result[0].num_children == 1 && result[0].num_adults == 1)
			        		num_persons = result[0].num_adults + " Adult" + result[0].num_children + " Child";
			        	else if (result[0].num_children == 0 && result[0].num_adults > 1)
			        		num_persons = result[0].num_adults + " Adults";
			        	else if (result[0].num_children == 0 && result[0].num_adults == 1)
			        		num_persons = result[0].num_adults + " Adult";

	        			expiration_time = result[0].expiration_time;
		        	}


		        	else{
						res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
						return;
		        	}
		        });

			}

			var trip = [];

	        for(var i=0; i < result.length; i++){
	        	var visit = new Object();

	        	/* visit information */
	        	var start_time = new Date(result[i].start_time);
	        	var end_time = new Date(result[i].end_time);

	        	visit["day"] = (start_time.getDate()<10?'0':'') + start_time.getDate() + " " + convertToTextMonth(start_time.getMonth()) + " " + start_time.getFullYear();
	        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
	        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();
	        	
	        	/* POI information */

	        	visit["id"] = result[i].id;
	        	visit["name"] = result[i].name;
	        	visit["place_id"] = result[i].place_id;
	        	visit["address"] = result[i].address;
	        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
	        	visit["poi_type"] = result[i].poi_type;
	        	visit["city"] = result[i].city; 
	        	visit["isActive"] = result[i].isActive;

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


	        	var no_trips = result[i].no_trips;
				if(no_trips == null)
					no_trips = 0;

				visit["no_trips"] = no_trips;

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

	        	trip.push(visit);
	        }

	        promise.createConnection({
				host: 'localhost',
			    user: 'root',
			    password: 'password',
			    database: 'placesdb'

			}).then(function(conn){
				connection = conn;

				var result = connection.query("call getCityIDFromTrip(?)", [trip_id]);

				return result;

			}).then(function(result){
				var city_id = result[0][0].city;

				/* get suggestions */

		        con.query("call getOtherSuggestionsFromTrip(?, ?)", [trip_id, city_id], function (err, result, fields) {
		        	if (err) throw err;

		        	result = result[0];
		        
					var suggested_visits = []; // list of POIs suggested
					var suggested_hotels = []; // list of hotels suggested
					var size = 6; // total number of suggestions
					var total_hotels = 0;

		        	if(result.length < size)
		        		size = result.length;

		        	for(var i=0; i < result.length; i++){
		        		if(result[i].poi_type.toUpperCase() == 'HOTEL')
			        		total_hotels++;
			        }

			        var i = 0;

		        	while(suggested_hotels.length + suggested_visits.length < size){
			        	var visit = new Object();
			        	visit["id"] = result[i].id;
			        	visit["name"] = result[i].name;
			        	visit["place_id"] = result[i].place_id;
			        	visit["poi_type"] = result[i].poi_type;
			        	visit["photo"] = result[i].photo;

			        	if(result[i].poi_type.toUpperCase() == 'HOTEL' && suggested_hotels.length < Math.floor(size / 2))
			        		suggested_hotels.push(visit);
			        	else if (result[i].poi_type.toUpperCase() != 'RESTAURANT' && result[i].poi_type.toUpperCase() != 'HOTEL' && suggested_visits.length < Math.ceil(size / 2) || suggested_hotels.length == total_hotels)
			        		suggested_visits.push(visit);

			        	i = (i + 1) % result.length;
			        }

			        res.render(path.join(__dirname+'/templates/trip-manual.html'), {trip_id: trip_id, name: name, trip: trip, start_date: start_date, end_date: end_date, city: city, days: days, days_shortname: days_shortname, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels, source: "author", isPublic: 0, isManual: 1, reviews: [], num_viewers: 0, rating: 0, num_reviews: 0, num_trips: 0, travel_mode: travel_mode, num_persons: num_persons, num_visits: num_visits, expiration_time: expiration_time, total_time: MANUAL_TRIP_TOTAL_TIME});

			    });
		    });
	    });
    });
});




/* view calendar to be implemented in the future

app.get('/calendar', function(req, res){
	res.render(path.join(__dirname+'/templates/calendar.html'),);
});

*/




// trips page -> page that contains all the scheduled, made, in development, favorite and with interest trips of the user
app.get('/trips', function(req, res){

	var user_id = -1;

	if(req.cookies['user'] != undefined && !isNaN(parseInt(req.cookies['user'])))
		user_id = parseInt(req.cookies['user']);

	if(user_id != -1){

		con.query("call getUserTrips(?)", user_id, function (err, result, fields) {
	        if (err) throw err;

	        result = result[0];

			/* different types of trips */
	        var scheduled_trips = [];
	        var past_trips = [];
	        var development_trips = [];
	        var interested_trips = [];
	        var favorite_trips = [];

	        for(var i=0 ; i < result.length; i++){

				/* trip information*/
	        	var trip = new Object();
	        	trip["id"] = result[i].trip_id;

	        	if(result[i].name != null && result[i].name.length > 0)
	        		trip["name"] = result[i].name;
	        	else
	        		trip["name"] = 'Visit to ' + result[i].city;

	        	trip["city"] = result[i].city;

	        	trip["isPublic"] = result[i].isPublic[0];
	        	trip["isFavorite"] = result[i].isFavorite[0];

	        	if(result[i].photo != undefined)
	        		trip["photo"] = result[i].photo;

	        	else if(result[i].city_photo != undefined)
	        		trip["photo"] = result[i].city_photo.replace(/\\/g,"/");

	        	start_date = new Date(result[i].start);
	        	end_date = new Date(result[i].end);
	        	now = new Date();

	        	trip["start"] = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
	        	trip["end"] = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

				/* filter the trips */
	        	if(result[i].isManual[0] == 1 && result[i].isActive[0] == 0){
	        		trip["expiration_time"] = result[i].expiration_time;
	        		development_trips.push(trip);
	        	}

	        	else if(start_date < now){
	        		past_trips.push(trip);
	        	}

	        	else{
	        		scheduled_trips.push(trip);
	        	}

	        	if(result[i].isFavorite[0] == 1)
	        		favorite_trips.push(trip)

	        }

	        sortTrips(scheduled_trips,"cresc");
	        sortTrips(past_trips,"desc");

			/* get the trips that the user is interested in */
	        con.query("call getInterestedTripsByUser(?)", user_id, function (err, result, fields) {
	        	if (err) throw err;

	        	result = result[0];

	        	for(var i=0 ; i < result.length; i++){
	        		var trip = new Object();
	        		trip["id"] = result[i].trip_id;

		        	if(result[i].name != null && result[i].name.length > 0)
		        		trip["name"] = result[i].name;
		        	else
		        		trip["name"] = 'Visit to ' + result[i].city;

		        	trip["city"] = result[i].city;

		        	trip["author"] = result[i].author;
		        	trip["creation_date"] = result[i].creation_date.toJSON().slice(0,10);;

		        	if(result[i].type_use == "Premium")
						trip["isPremium"] = 1;

		        	if(result[i].photo != undefined)
		        		trip["photo"] = result[i].photo;

		        	else if(result[i].city_photo != undefined)
		        		trip["photo"] = result[i].city_photo.replace(/\\/g,"/");

		        	start_date = new Date(result[i].start);
		        	end_date = new Date(result[i].end);
		        	
		        	trip["start"] = start_date.getDate() + " " + convertToTextMonth(start_date.getMonth()) + " " + start_date.getFullYear();
    				trip["end"] = end_date.getDate() + " " + convertToTextMonth(end_date.getMonth()) + " " + end_date.getFullYear();

    				interested_trips.push(trip)

	        	}

				res.render(path.join(__dirname+'/templates/trips.html'),  {past_trips: past_trips, scheduled_trips: scheduled_trips, development_trips: development_trips, interested_trips: interested_trips, favorite_trips: favorite_trips});
			});
	    });
	}

	else{
		res.render(path.join(__dirname+'/templates/need-login.html'));
	}


});


// login using GOOGLE
app.post('/login-g', function(req, res){

	/* attributes providede by Google */
	var googleID = req.body.google_id;
	var username = req.body.username;
	var name = req.body.name;
	var picture = req.body.picture;

	/* login: if exists, returns the attributes needed in the UI (user ID, picture and type) ; if not exists yet, creates a new user and then returns the attributes */
	con.query("call loginWithGoogle(?,?,?,?)", [googleID, username, name, picture], function (err, result, fields) {
    	if (err) throw err;

    	result = result[0];

    	if(result[0].error != undefined){
    		console.log("ERROR " + result[0].error);
    		return;
    	}

	 	var user_id = result[0].id;
       	var picture = result[0].picture;
       	var type_use = result[0].type_use;

		res.contentType('json');
		res.send({user_id: user_id, picture: picture, type: type_use});

	});

});



// login using user account
app.post('/login-e', function(req, res){
	var username = req.body.email; 
	var password = md5(req.body.password); // hash the password

	/* login is made here (not very secure !!) */ 
	con.query("call login(?)", [username], function (err, result, fields) {
    	if (err) throw err;

    	result = result[0];

    	if(parseInt(result.length) == 1){

			if(result[0].password == password){

	    	 	var user_id = result[0].id;
		       	var picture = result[0].picture;
		       	var type_use = result[0].type_use;

      			res.contentType('json');
				res.send({user_id: user_id, picture: picture, type: type_use});

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


/* register a new user */
app.post('/register', upload.single('photo'), function (req, res, next){

	/* data provided */
	var username = req.body.email;
	var name = req.body.fname + " " + req.body.lname;
	var phone_number = req.body.phone;

	if(phone_number == '')
		phone_number = null;
	
	var picture = null;

	if(req.file)
		picture = req.file.path.split('dist')[1];

	var birthday = req.body.birthday;

	if(birthday != '' && birthday != null)
		birthday = birthday.split('/')[2] + "-" + birthday.split('/')[1] + "-" + birthday.split('/')[0];
	else
		birthday = null;

	var gender = req.body.gender;

	if(gender != 'M' || gender != 'F')
		gender = null;

	var type_use = req.body.type_use;

	if(type_use != 'Free' && type_use != 'Premium')
		type_use = 'Free';


	var country = req.body.country;

	if(country == '' || country == null || country == 'null')
		country = null;

	var password = md5(req.body.password);

	con.query("call register(?,?,?,?,?,?,?,?,?)", [username, name, picture, birthday, gender, country, phone_number, type_use, password], function (err, result, fields) {
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


/* profile page */
app.get('/profile', function(req, res){

	var user_id = req.cookies['user']; // user ID

	// check if user ID is an integer number
	if(isNaN(user_id)){
		res.render(path.join(__dirname+'/templates/need-login.html'));
		return;
	}

	// get the user's info
	con.query("call getInfoUser(?)", user_id, function (err, result, fields) {
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
        username = result.username;
        
     	if(result.picture != null)
        	picture = result.picture;
        else
        	picture = "img/login.png";

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

        con.query("call getUserStats(?)", user_id, function (err, result, fields) {
	        if (err) throw err;

	        result = result[0][0];

	        var num_trips = 0;
	        var num_trips_used = 0;
	        var num_reviews = 0;
	        var num_photos = 0;
	        var num_pois = 0;

	        num_trips = result.num_trips;
	        num_trips_used = result.num_trips_used;
	        num_reviews = result.num_reviews;
	        num_photos = result.num_photos;
	        num_pois = result.num_pois;

        	res.render(path.join(__dirname+'/templates/profile.html'), {name: name, picture: picture, birthday: birthday, address: address, phone_number: phone_number, gender: gender, country: country, username: username, num_trips: num_trips, num_trips_used: num_trips_used, num_reviews: num_reviews, num_photos: num_photos, num_pois: num_pois});
	
        });
	});
	
});

/* edit the user's info */
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

/* edit the user's picture */
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

    	res.redirect(req.baseUrl + '/profile');

    });

});

/* request a new POI page */
app.get('/request-poi', function(req, res){

	var user_id = req.cookies['user']; // user ID

	/* check if user ID is an integer number */
	if(isNaN(user_id)){
		res.render(path.join(__dirname+'/templates/need-login.html'));
		return;
	}

	// check if user has access to this feature
	con.query("call getUserType(?)", user_id, function (err, result, fields){
		if (err) throw err;

		result = result[0];

		var isUserPremium = false;

		if(result.length == 0 || result[0].type_use != 'Premium'){
			res.render(path.join(__dirname+'/templates/404page.html'));
			return;
		}

		// get all cities (names)
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

});

/* feature that allows users to submit new POI to the DB */
app.post('/request-poi', upload_poi.single('photo'), function(req, res){

	var user_id = req.cookies['user'];

	var poi_id;

	// check if user can request a new POI
	con.query("call getUserType(?)", user_id, function (err, result, fields){
		if (err) throw err;

		result = result[0];

		var isUserPremium = false;

		/* if user does not exists or is not a Premium User, can't request a new POI */
		if(result.length == 0 || result[0].type_use != 'Premium'){
			res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: [], wasSubmitedWithSuccess: -1});
			return;
		}

		/* new POI data */
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

		var google_place_id = req.body.google_place_id;
		var google_rating = parseFloat(req.body.google_rating).toFixed(1);
		var google_num_reviews = parseInt(req.body.google_reviews);

		if(google_place_id == "None")
			google_place_id = null;

		/* ERROR MSG */
		if(isNaN(google_rating)){
			res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: [], wasSubmitedWithSuccess: -1});
			return;
		}

		if(isNaN(google_num_reviews)){
			res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: [], wasSubmitedWithSuccess: -1});
			return;
		}

		if(isNaN(poi_latitude)){
			res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: [], wasSubmitedWithSuccess: -1});
			return;
		}

		if(isNaN(poi_longitude)){
			res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: [], wasSubmitedWithSuccess: -1});
			return;
		}

		if(poi_description == "" || poi_description == undefined)
			poi_description = null;

		if(poi_website == "" || poi_website == undefined)
			poi_website = null;

		if(poi_phone_number == "" || poi_phone_number == undefined)
			poi_phone_number = null;
		else if(isNaN(parseInt(poi_phone_number))){
			res.render(path.join(__dirname+'/templates/request-poi.html'), {cities: [], wasSubmitedWithSuccess: -1});
			return;
		}

		if(poi_type == 'Other'){
			poi_type = req.body.other_poi_type;
		}


		/* add the new POI to the DB */
		var sql = "call submitPOI(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
		var values = [poi_name, poi_description, poi_latitude, poi_longitude, poi_address, poi_type, poi_website, poi_phone_number, poi_city, user_id, google_place_id, google_rating, google_num_reviews];

		con.query(sql, values, function (err, result, fields) {
			if (err){
				throw err;
				res.send(JSON.stringify('error'));
			}

			else{
				poi_id = result[0][0].poiID; // poi ID

				/* create a new folder to this POI and moves the picture to the new folder */
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

			    	res.redirect(req.baseUrl + '/place?id=' + poi_id);
	    			console.log("POI: ", poi_id, ' ADDED WITH SUCCESS');
			    });
			}
		});
	});
});


/* let users review requests of POIs from other users 
   feature implemented but removed because its too complex -> requests of POIs are automatically added to the DB

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

    	if(result[0][0].isAproved[0] == 1){
    		res.redirect(req.baseUrl + '/place?id=' + poi_id);
    		console.log("POI ACCEPTED: ", poi_id);
    	}
    
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



    	res.redirect(req.baseUrl + '/review-poi');
    	console.log("POI REJECTED: ", poi_id);
    
    });

});

*/



app.get('/recover', function(req, res){
	res.render(path.join(__dirname+'/templates/recover-password.html'),);
});


app.get('/about-us', function(req, res){
	res.render(path.join(__dirname+'/templates/about.html'), );
});


app.get('/contacts', function(req, res){
	res.render(path.join(__dirname+'/templates/contacts.html'), );
});

app.get('/destinations', function(req, res){

	con.query("call getCities();", function (err, result, fields) {
		if (err) throw err;

		result = result[0];

		cities = [];

		for(var i=0; i < result.length; i++){
			var city = new Object();
			city["id"] = result[i].id;
			city["name"] = result[i].name;
			city["coordinates"] = result[i].latitude + ", " + result[i].longitude;
			cities.push(city);
		}

		res.render(path.join(__dirname+'/templates/destinations.html'), {cities: cities});
	});
});


app.get('/help', function(req, res){
	res.render(path.join(__dirname+'/templates/help.html'), );
});



/* make a review of a POI */
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


/* method that receives photos of a POI uploaded by the users and saves it */
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

    	res.redirect(req.baseUrl + '/place?id=' + poi_id);

    	//res.send(JSON.stringify('success'));

    });

});

/* method that receives photos of a city uploaded by the users and saves it */
app.post('/upload-city-photo', upload_city.single('photo'), function(req, res){

	var user_id = req.cookies['user'];
	var city_id = req.body.city;
	var city_name = req.body.name;


	if(isNaN(user_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "You need to be logged in to do this action."});
		return;
	}

	if(isNaN(city_id)){
		res.contentType('json');
		res.send({result: 'error', msg: "The city does not exist."});
		return;
	}

	var picture_url = req.file.path.split('dist')[1];

	con.query("call uploadCityPhoto(?, ?, ?);", [city_id, user_id, picture_url], function (err, result, fields) {
    	if (err){
    		throw err;
    		res.contentType('json');
			res.send({result: 'error', msg: "Error uploading the photo."});
    	}

    	res.redirect(req.baseUrl + '/city?name=' + city_name);

    });

});


// update place_id of a city when its null
app.post('/update-city-place-id', function(req, res){

	var city = req.body['city'];

	if(city == null || city == '')
		return;

	var place_id = req.body.place_id;

	if(place_id == null || place_id == '')
		return;

	con.query("call updateCityPlaceID(?,?)", [city, place_id], function (err, result, fields) {
    	if (err) throw err;

    	res.contentType('json');
		res.send({result: 'success'});

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
		var price_level = parseInt(poi_field_value);

		if(isNaN(price_level))
			return;

		con.query("call updatePOIPriceLevel(?,?)", [poi_id, price_level], function (err, result, fields) {
    		if (err) throw err;

		});
	}


	// update address 
	else if(poi_field_name == "address"){
		var address = poi_field_value;

		if(address == "" || address == null)
			return;

		con.query("call updatePOIAddress(?,?)", [poi_id, address], function (err, result, fields) {
    		if (err) throw err;

			res.contentType('json');
			res.send({result: result[0][0].result});
		});
	}

	// update google rating 
	else if(poi_field_name == "rating"){
		var rating = poi_field_value;

		if(rating == "" || rating == null)
			return;

		con.query("call updatePOIGoogleRating(?,?)", [poi_id, rating], function (err, result, fields) {
    		if (err) throw err;

			res.contentType('json');
			res.send({result: result[0][0].result});
		});
	}

	// update number of reviews 
	else if(poi_field_name == "num_reviews"){
		var num_reviews = poi_field_value;

		if(num_reviews == "" || num_reviews == null)
			return;

		con.query("call updatePOINumberOfReviews(?,?)", [poi_id, num_reviews], function (err, result, fields) {
    		if (err) throw err;

			res.contentType('json');
			res.send({result: result[0][0].result});
		});
	}


	// update opening hours 
	else if(poi_field_name == "opening_hours"){
		var opening_hours = poi_field_value;

		if(opening_hours == "" || opening_hours == null)
			return;

		con.query("call updatePOIOpeningHours(?,?)", [poi_id, opening_hours], function (err, result, fields) {
    		if (err) throw err;

			res.contentType('json');
			res.send({result: result[0][0].result});
		});
	}

});

// update POI price
app.post('/update-poi-price', function(req, res){

	var poi_id = parseInt(req.body['poi']);

	if(isNaN(poi_id)){
		res.contentType('json');
		res.send({result: 'error'});
		return;
	}

	var price_adults = parseFloat(req.body['price_adults']);
	if(isNaN(price_adults)){
		price_adults = null;
	}

	var price_children = parseFloat(req.body['price_children']);
	if(isNaN(price_children)){
		price_children = null;
	}

	con.query("call updatePOIPrice(?,?,?)", [poi_id, price_adults, price_children], function (err, result, fields) {
		if (err){
			throw err;
			res.contentType('json');
			res.send({result: 'error'});
		} 

		res.contentType('json');
		res.send({result: 'success'});
	});
});



// DISCOVER FEATURE
app.get('/discover', function(req, res){

	var query = req.query['query'];	
	var category = [];
	var destination = [];

	if(query != undefined){
		if(query.toUpperCase().includes('NATURE'))
			category.push('NATURE');

		if(query.toUpperCase().includes('HISTORY'))
			category.push('HISTORY');

		if(query.toUpperCase().includes('CULTURE'))
			category.push('CULTURE');
	}


	con.query("call getCities()", function(err, result, fields){
		if (err) throw err;

		result = result[0];

		if(query != undefined){
			for(var i=0; i < result.length; i++){
				if(query.toUpperCase().includes(result[i].name.toUpperCase()))
					destination.push(result[i].name);
			}
		}


		con.query("call discover()", function (err, result, fields) {
			if (err) throw err;

			result = result[0];

			var trips = [];
			var expert_trips = [];
			var nature_trips = [];
			var culture_trips = [];
			var history_trips = [];


			for(var i=0; i < result.length; i++){
				var trip = new Object();
				trip["id"] = result[i].id;
				trip["name"] = result[i].name;
				trip["description"] = result[i].description;
				trip["photo"] = result[i].photo;
				trip["creation_date"] = result[i].trip_timestamp.toJSON().slice(0,10);
				trip["num_viewers"] = result[i].num_viewers;
				trip["author"] = result[i].user;
				trip["city"] = result[i].city;
				trip["category"] = result[i].category;

				if(result[i].type == "Premium")
					trip["isPremium"] = 1;

				else
					trip["isPremium"] = 0;

				if(result[i].rating == null)
					trip["rating"] = "0.0";
				else
					trip["rating"] = result[i].rating.toFixed(1);

				if(result[i].num_trips == null)
					trip["num_trips"] = 0;
				else
					trip["num_trips"] = result[i].num_trips;

				/* if the trip does not corresponds to the user's search category, it's ignored */
				if(category.length > 0 && !category.includes(result[i].category)){

				}

				/* if the trip does not corresponds to the user's search destination, it's ignored */
				else if(destination.length > 0 && !destination.includes(result[i].city)){

				}

				else{
					if(trip.isPremium == 1)
						expert_trips.push(trip);

					if(trip.category.toUpperCase() == 'NATURE')
						nature_trips.push(trip);

					else if(trip.category.toUpperCase() == 'HISTORY')
						history_trips.push(trip);

					else if(trip.category.toUpperCase() == 'CULTURE')
						culture_trips.push(trip);


					trips.push(trip);
				}


			}


			res.render(path.join(__dirname+'/templates/discover.html'),  {trips: trips, query: query, expert_trips: expert_trips, nature_trips: nature_trips, history_trips: history_trips, culture_trips: culture_trips});
		});

	}); 

});



/* TESTES PARA INTEGRAR OS ALGORITMOS */

app.get('/teste', function(req, res){

	var soma = edge.func({
    source: function () {/*
        async (dynamic input) =>
        {
            var soma = new Matematica.OperacoesMatematicas().Soma(input.a, input.b);
            return soma;
        }
    */},
    references: ["Matematica.dll"]
	});

	soma({a: 10, b: 30}, function (error, result) {
	    if (error) throw error;
	    console.log(result);
	});


	res.render(path.join(__dirname+'/templates/404page.html'));


});


app.get('/teste2', function(req, res){

	//run number -> pode ser 1
	// vhcCap -> numero maximo de sitios a visitar 
	//vhcFxdCst -> pode ser 0
	//maxNumRoutes -> maximo numero de dias

	var alg = edge.func({
    source: function () {/*
        async (dynamic input) =>
        {
        	var alg = new Lrp.TouristTripPlanning.Main().RunSeveralTtpMethodOnInstance(input.instancePath, input.runNumber, input.vhcCap, input.vhcFxdCst, input.maxNumRoutes)
        	return alg;
        }
    */},
    references: ["Lrp.dll", "Lrp.TouristTripPlanning.dll"]
	});

	alg({instancePath: '/xml/200', runNumber: 1, vhcCap: 0, vhcFxdCst: 0, maxNumRoutes: 1}, function (error, result) {
	    if (error) throw error;
	});


	res.render(path.join(__dirname+'/templates/404page.html'));


});




app.get('*', function(req, res){
	res.status(404).render(path.join(__dirname+'/templates/404page.html'), );
});

	
app.listen(process.env.PORT);



console.log("Running at Port 8080");
open('http://localhost:8080');



/* Auxiliar Functions */

// get all days of a trip from its start date and its duration 
// Ex: start_date = 27-11-2019; number_days = 3 
// Returns: [27-11-2019, 28-11-2019, 29-11-2019]
function getTripDays(start_date, number_days, convert=true){
	var days = [];

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


// check if year is even (has 366 days)
function isYearEven(year){
	return year % 4 == 0 && year % 100 != 0 || (year % 100 == 0 && year % 400 == 0)
}

// check if month has 31 days
function is31daysMonth(month){
	var months_31days = [1,3,5,7,8,10,12];

	for(var i=0; i < months_31days.length; i++){
		if(month == months_31days[i])
			return true;
	}

	return false;
}

// add the weekday to a date and convert to the format (dd-month by its name-yy)
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

// converts date that has the the full month name to the month number
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


// get the weekday of a date 
function getWeekDay(date){
	var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	var d = new Date(date);
	return days[d.getDay()];
}

// computes the number of days between two dates
function diffBetweenDays(day1, day2){
	day1 = day1.split('/');
	day2 = day2.split('/');

	var date1 = new Date(day1[1] + "-" + day1[0] + "-" + day1[2]);
	var date2 = new Date(day2[1] + "-" + day2[0] + "-" + day2[2]);

	var diffTime = Math.abs(date2.getTime() - date1.getTime());
	var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

	return diffDays;
}

// converts a date to the SQL TimeStamp
function convertToSQLTimestamp(date){
	var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds

    return new Date(date - tzoffset).toISOString().slice(0, 19).replace('T', ' ');;
}

// converts a date to the review format (ex: 10 minutes ago)
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


// sort a list of trips
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

// get all schedules available of a day (between 9:00 until 19:00 with 00:15 differences)
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

// check if a time(hh:mm) is smaller than another time
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


function getTripOpenSlot(trip){

	var schedules = getSchedules();

	for(var day in trip){
		for(var i=0; i < schedules.length; i++){
			var sch = getScheduleTimes(schedules[i]);
			var st = sch[0];
			var end = sch[1];

			var isValid = true;

			for(var j=0; j<trip[day].length ; j++){
				if(isTimeSmaller(st, trip[day][j]['start_time']) && isTimeSmaller(trip[day][j]['start_time'], end))
					isValid = false;

				if(isTimeSmaller(st, trip[day][j]['end_time']) && isTimeSmaller(trip[day][j]['end_time'], end))
					isValid = false;

				if(isTimeSmaller(trip[day][j]['start_time'], st) && isTimeSmaller(end, trip[day][j]['end_time']))
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





function parsePoiOpeningHours(poi_op_hours){
	var poi_hours = {};

	console.log(poi_hours);

	poi_op_hours = JSON.parse(poi_op_hours);

	var visits_start_time = 9 * 3600; // 9:00 in number of seconds after midnight
	var visits_end_time = 20 * 3600; // 20:00 in number of seconds after midnight

	if(poi_op_hours == null){
		poi_hours["Monday"] = [0, visits_end_time-visits_start_time];
		return poi_hours;
	}



	var opening_hours = poi_op_hours[0].substring(poi_op_hours[0].indexOf(':')+1);


	console.log(opening_hours);

	if(opening_hours.includes('Closed'))
    	poi_hours["Monday"] = [0,0];

 	else if(opening_hours.includes('Open 24 hours'))
		poi_hours["Monday"] = [0, visits_end_time-visits_start_time];

	else{
		var start_time = opening_hours.split('–')[0];
    	if(start_time.includes('PM'))
    		start_time = ((parseInt(start_time.split(':')[0]) % 12) + 12) * 3600 + parseInt(start_time.split(':')[1].replace(' PM', '')) * 60;

    	else if(start_time.includes('AM'))
    		start_time = (parseInt(start_time.split(':')[0])) * 3600 + parseInt(start_time.split(':')[1].replace(' AM', '')) * 60;

    	var end_time = opening_hours.split('–')[1];
    	if(end_time.includes('PM'))
    		end_time = ((parseInt(end_time.split(':')[0]) % 12) + 12) * 3600 + parseInt(end_time.split(':')[1].replace(' PM', '')) * 60;

    	else if(end_time.includes('AM'))
    		end_time = (parseInt(end_time.split(':')[0])) * 3600 + parseInt(end_time.split(':')[1].replace(' AM', '')) * 60;

    	if(start_time < visits_start_time)
    		start_time = visits_start_time;
    	else
    		start_time = start_time - visits_start_time;

    	if(end_time > visits_end_time)
    		end_time = visits_end_time;

    	else
    		end_time = end_time - visits_start_time;

    	poi_hours["Monday"] = [start_time, end_time];
	}

	return poi_hours;

	/*for(var i=0; i<poi_op_hours.length;i++){
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

	}*/

}



/* sort POIs by its score 
code adapted from https://stackoverflow.com/questions/8175093/simple-function-to-sort-an-array-of-objects/8175221#8175221 */
function sortPOIs (pois, score){
	return pois.sort(function(a, b)
 	{
  		var x = a[score]; var y = b[score];
  		return ((x < y) ? 1 : ((x > y) ? -1 : 0));
 	});
}


/* sort visits randomly 
code adapted from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
function shuffleVisits(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}




function sleep (time) {
	  return new Promise((resolve) => setTimeout(resolve, time));
}


