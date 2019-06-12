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

var GOOGLE_API_KEY = 'AIzaSyAExpmRjci35grh-wAwFxK75c0fV4OHOxw';
var OPEN_WEATHER_API_KEY = '8271fd206ceeef12df4e7bb6063241c3';


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'dist/img/users'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() +  path.extname(file.originalname)) //Appending extension
  }
});

var storage_plan = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'dist/img/plans'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() +  '_' + Math.random().toString(36).substring(2) + path.extname(file.originalname)) //Appending extension
  }
});


var upload = multer({storage: storage});
var upload_plan = multer({storage: storage_plan});


var promise = require('promise-mysql');
 


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


app.get('/', urlencodedParser, function(req, res){
    con.query("SELECT name FROM City", function (err, result, fields) {
        if (err) throw err;
        var string=JSON.stringify(result);
        var list_cities = []
        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }

        var sql = "select name, count(name) as plans from ( select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 group by plan.id) t group by name order by plans desc limit 4"

        con.query(sql, function (err, result, fields) {
        	if (err) throw err;

        	var top_dest = [];
        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
        		dest.plans = result[i].plans;
        		top_dest.push(dest);
        	}

        	var sql2 = "select id, name, place_id, city, count(name) as plans from ( select poi.id, poi.name, poi.place_id, city.name as city from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1) t group by name order by plans desc limit 4"

        	con.query(sql2, function (err, result, fields) {
	        	if (err) throw err;

	        	var top_places = [];
	        	for(var i=0; i<result.length;i++){
	        		var place = new Object();
	        		place.id = result[i].id;
	        		place.place_id = result[i].place_id;
	        		place.name = result[i].name;
	        		place.city = result[i].city;
	        		place.plans = result[i].plans;
	        		top_places.push(place);
	        	}

	        	var sql3 = "select name, count(name) as plans from ( select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 group by plan.id) t group by name order by rand() limit 4"

	        	con.query(sql3, function (err, result, fields) {
		        	if (err) throw err;

		        	var recommended_dest = [];
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

app.get('/search',function(req,res){  
  con.query("SELECT name FROM City", function (err, result, fields) {
        if (err) throw err;
        var string=JSON.stringify(result);
        var list_cities = []
        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }

        var sql = "select name, count(name) as plans from ( select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 group by plan.id) t group by name order by plans desc limit 4"

        con.query(sql, function (err, result, fields) {
        	if (err) throw err;

        	var top_dest = [];
        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
        		dest.plans = result[i].plans;
        		top_dest.push(dest);
        	}

        	var sql2 = "select name, count(name) as plans from ( select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 group by plan.id) t group by name order by rand() limit 4"

        	con.query(sql2, function (err, result, fields) {
	        	if (err) throw err;

	        	var recommended_dest = [];
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
        res.render(path.join(__dirname+'/templates/search-places.html'), {cities: list_cities});
    });
});


app.get('/places', urlencodedParser, function (req, res){
	var destination = req.query['dest'];

	var query = req.query['query'];

	var page = 1;

	if(req.query['page'] != undefined)
		page = req.query['page'];

	var limit_inf = (page-1) * 9;
	var total_results = 9;

	var planId = -1;

	if(req.query['plan'] != undefined){
		planId = req.query['plan'];
	}


	if(query != undefined){

		query = "%" + query + "%"

		var sql = "SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? AND poi.name LIKE ? ORDER BY poi.num_reviews DESC LIMIT ?, ?";
		var parameters = [destination, query, limit_inf, total_results];

		con.query(sql, parameters, function (err, result, fields) {
	        if (err) throw err;
	        var list_places = []

	        var city = destination;
	        var country = 'Portugal';

	        if(result.length > 0){
	        	city = result[0].city;
	        	country = result[0].country;
	        } 


	        for(var i =0 ; i < result.length; i++){

	        	var place = new Object();
	        	place["id"] = result[i].id;
	        	place["place_id"] = result[i].place_id;
	            place["name"] = result[i].place;
	            place["type"] = result[i].poi_type.charAt(0).toUpperCase() + result[i].poi_type.slice(1);
	            place["description"] = result[i].description;
	            place["address"] = result[i].address;
	            place["rating"] = result[i].rating;

	        	list_places.push(place);
	        }


	        var sql_num = "SELECT count(*) as number_results FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? AND poi.name LIKE ? ORDER BY poi.num_reviews DESC";
	        var parameters_2 = [destination, query]
			
	        con.query(sql_num, parameters_2, function (err, result, fields) {
	        	if (err) throw err;

	        	var count = 0;

	        	if(result.length)
	        		count = result[0].number_results;
        		
	        	if(planId != -1){

	        		var connection;

	        		var sql2, parameters2;

	        		promise.createConnection({
					    host: 'localhost',
					    user: 'root',
					    password: 'password',
					    database: 'placesdb'

					}).then(function(conn){
						connection = conn;

						sql2 = "select isManual from plan where id = ?";
						parameters3 = [planId];

						return connection.query(sql2, [parameters3]);

					}).then(function(result){

						var isManual = parseInt(result[0].isManual);

						if(isManual == 0){
	        				sql2 = "select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join plan on plan_id=plan.id where plan_id = ? and plan.isActive = 1 and visit.isActive = 1";
						}

						else{
	        				sql2 = "select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join plan on plan_id=plan.id where plan_id = ? and plan.isManual = 1";
						}

						parameters3 = [planId];

						return connection.query(sql2, parameters3);


					}).then(function(result){

						var start_date = "n/a";
				        var end_date = "n/a";
				        var date_diff = 0;
				        var days = [];

				        if(result.length > 0){
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


				        	start_date = new Date(result[0].start_date);
				        	end_date = new Date(result[0].end_date);

				        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

				        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
				        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

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

				        	res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, city: city, country: country, number_results: count, fromPlan: true, visits: list_places_plan, days: days, openslots: openslots});

				        	return 1;

				        }

				        else{
				        	return 0;
				        }

					}).then(function(result){

						if(result == 1)
							return result;

						sql2 = "select plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff from plan where id = ?";
						parameters3 = [planId];

						return connection.query(sql2, [parameters3]);

					}).then(function(result){

						if(result == 1)
							return;

						var start_date = "n/a";
				        var end_date = "n/a";
				        var date_diff = 0;
				        var days = [];

				        if(result.length > 0){
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


				        	start_date = new Date(result[0].start_date);
				        	end_date = new Date(result[0].end_date);

				        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

				        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
				        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

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
					    
					    res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, city: city, country: country, number_results: count, fromPlan: true, visits: [], days: days, openslots: openslots});

					});
		        			

	        	}


	        	else {

					res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, city: city, country: country, number_results: count, fromPlan: false, openslots: []});

				}

	        });
		});
	}

	else{

		destination = req.query['dest'];

		var sql = "SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? ORDER BY poi.num_reviews DESC LIMIT ?, ?";
		var parameters = [destination, limit_inf, total_results];

		con.query(sql, parameters, function (err, result, fields) {
	        if (err) throw err;
	        var list_places = []

         	var city = destination;
	        var country = 'Portugal';

	        if(result.length > 0){
	        	city = result[0].city;
	        	country = result[0].country;
	        } 

	        for(var i =0 ; i < result.length; i++){

	        	var place = new Object();
	        	place["id"] = result[i].id;
	        	place["place_id"] = result[i].place_id;
	            place["name"] = result[i].place;
	            place["type"] = result[i].poi_type.charAt(0).toUpperCase() + result[i].poi_type.slice(1);
	            place["description"] = result[i].description;
	            place["address"] = result[i].address;
	            place["rating"] = result[i].rating;

	        	list_places.push(place);
	        }

	        var sql_num = "SELECT count(*) as number_results FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? ORDER BY poi.num_reviews DESC";
	        var parameters_2 = [destination]
			
	        con.query(sql_num, parameters_2, function (err, result, fields) {
	        	if (err) throw err;

	        	var count = 0;

	        	if(result.length)
	        		count = result[0].number_results;
        		
				if(planId != -1){

	        		var connection;

	        		var sql2, parameters3;

	        		promise.createConnection({
					    host: 'localhost',
					    user: 'root',
					    password: 'password',
					    database: 'placesdb'

					}).then(function(conn){
						connection = conn;

						sql2 = "select isManual from plan where id = ?";
						parameters3 = [planId];

						return connection.query(sql2, [parameters3]);

					}).then(function(result){

						var isManual = parseInt(result[0].isManual[0]);

						if(isManual == 0){
	        				sql2 = "select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join plan on plan_id=plan.id where plan_id = ? and plan.isActive = 1 and visit.isActive = 1";
						}

						else{
	        				sql2 = "select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join plan on plan_id=plan.id where plan_id = ? and plan.isManual = 1";
						}

						parameters3 = [planId];

						return connection.query(sql2, parameters3);


					}).then(function(result){

						var start_date = "n/a";
				        var end_date = "n/a";
				        var date_diff = 0;
				        var days = [];

				        if(result.length > 0){
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


				        	start_date = new Date(result[0].start_date);
				        	end_date = new Date(result[0].end_date);

				        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

				        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
				        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

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

					        console.log(openslots);

				        	res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, city: city, country: country, number_results: count, fromPlan: true, visits: list_places_plan, days: days, openslots: openslots});

				        	return 1;

				        }

				        else{
				        	return 0;
				        }

					}).then(function(result){

						if(result == 1)
							return result;

						sql2 = "select plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff from plan where id = ?";
						parameters3 = [planId];

						return connection.query(sql2, [parameters3]);

					}).then(function(result){

						if(result == 1)
							return;

						var start_date = "n/a";
				        var end_date = "n/a";
				        var date_diff = 0;
				        var days = [];


				        if(result.length > 0){
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


				        	start_date = new Date(result[0].start_date);
				        	end_date = new Date(result[0].end_date);

				        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

				        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
				        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

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

					    res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, city: city, country: country, number_results: count, fromPlan: true, visits: [], days: days, openslots: openslots});

					});
		        			

	        	}


	        	else {

					res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, city: city, country: country, number_results: count, fromPlan: false, openslots: []});

				}

	        });

		});

	}
});


app.get('/place', function(req,res){  	
	
	var poi_id = req.query['id'];

	var planId = -1;

	if(req.query['plan'] != undefined){
		planId = req.query['plan'];
	}

	if(planId == -1){

 		var sql = "SELECT * from poi WHERE id = ?";

		con.query(sql, poi_id, function (err, result, fields) {
		    if (err) throw err;
		    var string=JSON.stringify(result);

		    var id = result[0].id;
		    var place_id = result[0].place_id;
			var name = result[0].name;
			var description = result[0].description;
			var address = result[0].address;
			var lat = result[0].latitude;
			var lon = result[0].longitude;
			var rating = result[0].rating;
			var phone_number = result[0].phone_number;
			var website = result[0].website;
			var type = result[0].poi_type.charAt(0).toUpperCase() + result[0].poi_type.slice(1);

			var sql2 = "select user.name as user, user.picture as picture, review_text, review_rating, review_timestamp from review_poi join (review join user on review.user_id = user.id ) on review_poi.review_id = review.id WHERE poi_id = ? order by review_timestamp desc";

			con.query(sql2, poi_id, function (err, result, fields) {
		    	if (err) throw err;

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

				res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, id: id, description: description, address: address, lat: lat, lon: lon, rating: rating, phone_number: phone_number, website: website, type: type, reviews: reviews, fromPlan: false, openslots: []});

			});

		});

	}

	else{

		var connection;

		promise.createConnection({
		    host: 'localhost',
		    user: 'root',
		    password: 'password',
		    database: 'placesdb'

		}).then(function(conn){
			connection = conn;

			sql2 = "select isManual from plan where id = ?";
			parameters3 = [planId];

			return connection.query(sql2, [parameters3]);

		}).then(function(result){

			var isManual = parseInt(result[0].isManual);

			if(isManual == 0){
				sql2 = "select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join plan on plan_id=plan.id where plan_id = ? and plan.isActive = 1 and visit.isActive = 1";
			}

			else{
				sql2 = "select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join plan on plan_id=plan.id where plan_id = ? and plan.isManual = 1";
			}

			parameters3 = [planId];

			return connection.query(sql2, parameters3);


		}).then(function(result){

			var start_date = "n/a";
	        var end_date = "n/a";
	        var date_diff = 0;
	        var days = [];

	        if(result.length > 0){
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


	        	start_date = new Date(result[0].start_date);
	        	end_date = new Date(result[0].end_date);

	        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

	        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
	        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

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


		        var sql = "SELECT * from poi WHERE id = ?";

				con.query(sql, poi_id, function (err, result, fields) {
				    if (err) throw err;

				    var id = result[0].id;
				    var place_id = result[0].place_id;
					var name = result[0].name;
					var description = result[0].description;
					var address = result[0].address;
					var lat = result[0].latitude;
					var lon = result[0].longitude;
					var rating = result[0].rating;
					var phone_number = result[0].phone_number;
					var website = result[0].website;
					var type = result[0].poi_type.charAt(0).toUpperCase() + result[0].poi_type.slice(1);


					var sql2 = "select user.name as user, user.picture as picture, review_text, review_rating, review_timestamp from review_poi join (review join user on review.user_id = user.id ) on review_poi.review_id = review.id WHERE poi_id = ? order by review_timestamp desc";

					con.query(sql2, poi_id, function (err, result, fields) {
				    	if (err) throw err;

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

						res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, id: id, description: description, address: address, lat: lat, lon: lon, rating: rating, phone_number: phone_number, website: website, type: type, reviews: reviews, fromPlan: true, inPlan: inPlan, days: days, openslots: openslots});

					});

				});
	        	
	        	return 1;

	        }

	        else{
	        	return 0;
	        }

		}).then(function(result){

			if(result == 1)
				return result;

			sql2 = "select plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff from plan where id = ?";
			parameters3 = [planId];

			return connection.query(sql2, [parameters3]);

		}).then(function(result){

			if(result == 1)
				return;

			var start_date = "n/a";
	        var end_date = "n/a";
	        var date_diff = 0;
	        var days = [];

	        if(result.length > 0){
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


	        	start_date = new Date(result[0].start_date);
	        	end_date = new Date(result[0].end_date);

	        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

	        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
	        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

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

		    var sql = "SELECT * from poi WHERE id = ?";

			con.query(sql, poi_id, function (err, result, fields) {
			    if (err) throw err;

			    var id = result[0].id;
			    var place_id = result[0].place_id;
				var name = result[0].name;
				var description = result[0].description;
				var address = result[0].address;
				var lat = result[0].latitude;
				var lon = result[0].longitude;
				var rating = result[0].rating;
				var phone_number = result[0].phone_number;
				var website = result[0].website;
				var type = result[0].poi_type.charAt(0).toUpperCase() + result[0].poi_type.slice(1);


				var sql2 = "select user.name as user, user.picture as picture, review_text, review_rating, review_timestamp from review_poi join (review join user on review.user_id = user.id ) on review_poi.review_id = review.id WHERE poi_id = ? order by review_timestamp desc";

				con.query(sql2, poi_id, function (err, result, fields) {
			    	if (err) throw err;

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

					res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, id: id, description: description, address: address, lat: lat, lon: lon, rating: rating, phone_number: phone_number, website: website, type: type, reviews: reviews, fromPlan: true, inPlan: false, days: days, openslots: openslots});

				});

			});
		  
		});
	        	
	}
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


app.get('/hotels', function(req,res){
	var destination = req.query['dest'];
	var query = req.query['query'];

	var page = 1;

	if(req.query['page'] != undefined)
		page = req.query['page'];

	var limit_inf = (page-1) * 9;
	var total_results = 9;

	if(query != undefined){

		query = "%" + query + "%"

		var sql = "SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? AND poi.poi_type = 'Hotel' AND poi.name LIKE ? ORDER BY poi.num_reviews DESC LIMIT ?, ?";
		var parameters = [destination, query, limit_inf, total_results];

		con.query(sql, parameters, function (err, result, fields) {
	        if (err) throw err;
	        var list_hotels = []

	        var city = destination;
	        var country = 'Portugal';

	        if(result.length > 0){
	        	city = result[0].city;
	        	country = result[0].country;
	        } 


	        for(var i =0 ; i < result.length; i++){

	        	var hotel = new Object();
	        	hotel["id"] = result[i].id;
	        	hotel["place_id"] = result[i].place_id;
	            hotel["name"] = result[i].place;
	            hotel["city"] = result[i].city;
	            hotel["type"] = result[i].poi_type.charAt(0).toUpperCase() + result[i].poi_type.slice(1);
	            hotel["description"] = result[i].description;
	            hotel["address"] = result[i].address;
	            hotel["rating"] = result[i].rating;
	        	hotel["coordinates"] = result[i].latitude + ", " + result[i].longitude;
	        	hotel["website"] = result[i].website;
	        	hotel["phone_number"] = result[i].phone;

	        	list_hotels.push(hotel);
	        }

	        res.render(path.join(__dirname+'/templates/hotels.html'), {hotels: list_hotels, city: city, country: country});


		});

	}

	else{

		destination = req.query['dest'];

		var sql = "SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.latitude as latitude, poi.longitude as longitude, poi.website as website, poi.phone_number as phone FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? AND poi.poi_type = 'Hotel' ORDER BY poi.num_reviews DESC LIMIT ?, ?";
		var parameters = [destination, limit_inf, total_results];

		con.query(sql, parameters, function (err, result, fields) {
	        if (err) throw err;
	        var list_hotels = []

         	var city = destination;
	        var country = 'Portugal';

	        if(result.length > 0){
	        	city = result[0].city;
	        	country = result[0].country;
	        } 

	        for(var i =0 ; i < result.length; i++){

	        	var hotel = new Object();
	        	hotel["id"] = result[i].id;
	        	hotel["place_id"] = result[i].place_id;
	            hotel["name"] = result[i].place;
	            hotel["city"] = result[i].city;
	            hotel["type"] = result[i].poi_type.charAt(0).toUpperCase() + result[i].poi_type.slice(1);
	            hotel["description"] = result[i].description;
	            hotel["address"] = result[i].address;
	            hotel["rating"] = result[i].rating;
	        	hotel["coordinates"] = result[i].latitude + ", " + result[i].longitude;
	        	hotel["website"] = result[i].website;
	        	hotel["phone_number"] = result[i].phone;

	        	list_hotels.push(hotel);
	        }

	        res.render(path.join(__dirname+'/templates/hotels.html'), {hotels: list_hotels, city: city, country: country});
	        

		});

	}
});


app.get('/restaurants', function(req,res){
	var destination = req.query['dest'];
	var query = req.query['query'];

	var page = 1;

	if(req.query['page'] != undefined)
		page = req.query['page'];

	var limit_inf = (page-1) * 9;
	var total_results = 9;

	if(query != undefined){

		query = "%" + query + "%"

		var sql = "SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? AND poi.poi_type = 'Restaurant' AND poi.name LIKE ? ORDER BY poi.num_reviews DESC LIMIT ?, ?";
		var parameters = [destination, query, limit_inf, total_results];

		con.query(sql, parameters, function (err, result, fields) {
	        if (err) throw err;
	        var list_places = []

	        var city = destination;
	        var country = 'Portugal';

	        if(result.length > 0){
	        	city = result[0].city;
	        	country = result[0].country;
	        } 


	        for(var i =0 ; i < result.length; i++){

	        	var place = new Object();
	        	place["id"] = result[i].id;
	        	place["place_id"] = result[i].place_id;
	            place["name"] = result[i].place;
	            place["type"] = result[i].poi_type.charAt(0).toUpperCase() + result[i].poi_type.slice(1);
	            place["description"] = result[i].description;
	            place["address"] = result[i].address;
	            place["rating"] = result[i].rating;

	        	list_places.push(place);
	        }


	        var sql_num = "SELECT count(*) as number_results FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? AND poi.name LIKE ? ORDER BY poi.num_reviews DESC";
	        var parameters_2 = [destination, query]
			
	        con.query(sql_num, parameters_2, function (err, result, fields) {
	        	if (err) throw err;

	        	var count = 0;

	        	if(result.length)
	        		count = result[0].number_results;
        		

				res.render(path.join(__dirname+'/templates/restaurants.html'), {places: list_places, city: city, country: country, number_results: count});

	        });

		});

	}

	else{

		destination = req.query['dest'];

		var sql = "SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? AND poi.poi_type = 'Restaurant' ORDER BY poi.num_reviews DESC LIMIT ?, ?";
		var parameters = [destination, limit_inf, total_results];

		con.query(sql, parameters, function (err, result, fields) {
	        if (err) throw err;
	        var list_places = []

         	var city = destination;
	        var country = 'Portugal';

	        if(result.length > 0){
	        	city = result[0].city;
	        	country = result[0].country;
	        } 

	        for(var i =0 ; i < result.length; i++){

	        	var place = new Object();
	        	place["id"] = result[i].id;
	        	place["place_id"] = result[i].place_id;
	            place["name"] = result[i].place;
	            place["type"] = result[i].poi_type.charAt(0).toUpperCase() + result[i].poi_type.slice(1);
	            place["description"] = result[i].description;
	            place["address"] = result[i].address;
	            place["rating"] = result[i].rating;

	        	list_places.push(place);
	        }

	        var sql_num = "SELECT count(*) as number_results FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? ORDER BY poi.num_reviews DESC";
	        var parameters_2 = [destination]
			
	        con.query(sql_num, parameters_2, function (err, result, fields) {
	        	if (err) throw err;

	        	var count = 0;

	        	if(result.length)
	        		count = result[0].number_results;
        		

				res.render(path.join(__dirname+'/templates/restaurants.html'), {places: list_places, city: city, country: country, number_results: count});

	        });

		});

	}
});


app.get('/create-plan', function(req, res){

	con.query("SELECT name FROM City", function (err, result, fields) {
        if (err) throw err;
        var string=JSON.stringify(result);
        var list_cities = []
        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }

        var sql = "select name, count(name) as plans from ( select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 group by plan.id) t group by name order by plans desc limit 4"

        con.query(sql, function (err, result, fields) {
        	if (err) throw err;

        	var top_dest = [];
        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
        		dest.plans = result[i].plans;
        		top_dest.push(dest);
        	}

        	var sql2 = "select name, count(name) as plans from ( select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 group by plan.id) t group by name order by rand() limit 4"

        	con.query(sql2, function (err, result, fields) {
	        	if (err) throw err;

	        	var recommended_dest = [];
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


	destination = req.body.destination;

	arrival = req.body.arrival;

	departure = req.body.departure;

	user_id = req.cookies['user'];

    promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
		connection = conn;

		var sql = "select id from city where name = ?";
		var values = [destination];
	    var result = connection.query(sql, [values]);

	    return result;


	}).then(function(result){
		var city = result[0].id;

		var sql = "insert into Plan (start_date, end_date, user, city) VALUES ?";
		var values = [
	    	[arrival.split('/')[2] + "-" + (arrival.split('/')[1]<10?'0':'') + arrival.split('/')[1] + "-" + (arrival.split('/')[0]<10?'0':'') + arrival.split('/')[0], 
	    	departure.split('/')[2] + "-" + (departure.split('/')[1]<10?'0':'') + departure.split('/')[1] + "-" + (departure.split('/')[0]<10?'0':'') + departure.split('/')[0],
	    	user_id, city], 
	  	];
	    var result = connection.query(sql, [values]);
	    connection.end();

	    return result;
	}).then(function(result){
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

  		var plan_id = result.insertId;

  		var sql = "select poi.id as poi from poi join city on poi.city = city.id where city.name = ? and poi.num_reviews > 100 and poi.poi_type != 'Hotel' and poi.poi_type != 'Restaurant'"
		var parameters = [destination]

  		con.query(sql, parameters, function (err, result, fields) {
	        if (err) throw err;

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
	        	

		        sql2= "insert into Visit(plan_id, poi_id, start_time, end_time, weather) VALUES ?";
				values2 = [
			    	[plan_id, poi, start_time_list[i], end_time_list[i], 'Sunny'],
			  	];

			  	con.query(sql2, [values2], function (err, result) {
			    	if (err) throw err;
			  	});

			  	i++;
		  		

	  		}
	    });

    	res.render(path.join(__dirname+'/templates/see-plan.html'), {plan: plan_id});
	});

});

app.post('/create-plan-m', function(req, res){
	var connection;

	destination = req.body.destination;

	arrival = req.body.arrival;

	departure = req.body.departure;

	user_id = parseInt(req.body.user);

    promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'


	}).then(function(conn){
		connection = conn;

		var sql = "select id from city where name = ?";
		var values = [destination];
	    var result = connection.query(sql, [values]);

	    return result;

	}).then(function(result){
		var city = result[0].id;

		var sql = "insert into Plan (start_date, end_date, user, isActive, city, isManual) VALUES ?";
		var values = [
	    	[arrival.split('/')[2] + "-" + (arrival.split('/')[1]<10?'0':'') + arrival.split('/')[1] + "-" + (arrival.split('/')[0]<10?'0':'') + arrival.split('/')[0], 
	    	departure.split('/')[2] + "-" + (departure.split('/')[1]<10?'0':'') + departure.split('/')[1] + "-" + (departure.split('/')[0]<10?'0':'') + departure.split('/')[0],
	    	user_id, 0, city, 1], 
	  	];
	    var result = connection.query(sql, [values]);
	    connection.end();

	    return result;
	}).then(function(result){
  		var plan_id = result.insertId;

    	res.redirect('http://localhost:8080/plan-m?id='+ plan_id)
	});

});


app.post('/create-child-plan', function(req, res){
	var connection;

	var plan_id = req.body.plan;
	var start_date = req.body.start_date;
	var end_date = req.body.end_date;
	var user_id = req.cookies['user'];

	var start_time_list = [];
	var end_time_list = [];

	promise.createConnection({
		host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){

		connection = conn;

		var sql = "select city, poi_id, start_time, end_time from plan join visit on plan.id = visit.plan_id where plan_id = ?";
		var values = [plan_id];
	    var result = connection.query(sql, [values]);

    	return result;
	}).then(function(result){

		var visits = [];

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

		return visits

	}).then(function(result){

		var city = result[0].city;

		var visits = result;

		sql = "insert into plan (start_date, end_date, user, city, parent_plan) values (?)";
		values = [start_date, end_date, user_id, city, plan_id];

		con.query(sql, [values], function(err, result) {
			if (err) throw err;

			var new_plan = result.insertId;

			var i = 0;

			while(i < start_time_list.length){
				sql= "insert into Visit (plan_id, poi_id, start_time, end_time, weather) VALUES ?";
				values = [[new_plan, visits[i].poi_id, start_time_list[i], end_time_list[i], 'Sunny']];

				con.query(sql, [values], function (err, result) {
			    	if (err) throw err;
			  	});

		  		i++;
			}

			console.log("PLAN CREATED: ", new_plan)

			res.contentType('json');
			res.send({result: 'success', plan: new_plan});

		});
});




	});


app.post('/delete-plan', function(req, res){
	var plan_id = parseInt(req.body.plan);
	var user = parseInt(req.body.user);
	var connection;

	if(plan_id != undefined && user != undefined){

		promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

		}).then(function(conn){
			connection = conn;

			var sql = "select user from plan where id = ?";
			var values = [plan_id];

		    var result = conn.query(sql, [values]);

		    return result;
		}).then(function(result){

			if(result[0].user == user){
				sql = "update plan set isActive = 0 where id = ?";
				values = [plan_id];

				var result = connection.query(sql, [values]);
		    	connection.end();


				res.contentType('json');
				res.send({result: 'success'});

			}

			else{
				res.contentType('json');
				res.send({result: 'error'});
			}

		});

	}

	else{
		res.contentType('json');
		res.send({result: 'error'});
	}

});


app.post('/rename-plan', function(req, res){
	var plan_id = parseInt(req.body.plan);
	var user = parseInt(req.body.user);
	var connection;

	if(plan_id != undefined && user != undefined){

		promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

		}).then(function(conn){
			connection = conn;

			var sql = "select user from plan where id = ?";
			var values = [plan_id];

		    var result = conn.query(sql, [values]);

		    return result;
		}).then(function(result){

			if(result[0].user == user){
				sql = "update plan set name = ? where id = ?";
				values = [req.body.name, plan_id];

				var result = connection.query(sql, values);
		    	connection.end();

				res.contentType('json');
				res.send({result: 'success'});

			}

			else{
				res.contentType('json');
				res.send({result: 'error'});
			}

		});

	}

	else{
		res.contentType('json');
		res.send({result: 'error'});
	}

});



app.post('/share-plan', upload_plan.single('picture'), function (req, res, next){
	var user_id = req.cookies['user'];
	var plan_id = req.cookies['plan'];

	var connection;

	var sql = "update plan set isPublic = 1, photo = ?, description = ?, category = ? where id = ? and user = ? and isActive = 1";
	var values = [req.file.filename, req.body.description, req.body.category, plan_id, user_id];

	con.query(sql, values, function (err, result, fields) {
		if (err) throw err;

		promise.createConnection({
		host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

		}).then(function(conn){
			connection = conn;

			sql = "insert into review (user_id) values (?)";
			values = [user_id];
		    var result = connection.query(sql, [values]);

	    	return result;
		}).then(function(result){
			var review_id = result.insertId;

			sql = "insert into review_plan values (?)";
			values = [review_id, plan_id, req.body.description, req.body.rating, convertToSQLTimestamp(Date.now())];
	    	result = connection.query(sql, [values]);

	    	res.redirect('http://localhost:8080/trips?id='+ user_id);

		});

	});

	

});



app.post('/review-plan', function(req, res){
	var connection;

	var user_id = req.cookies['user'];

	promise.createConnection({
		host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
		connection = conn;

		var sql = "insert into review (user_id) values (?)";
		var values = [user_id];
	    var result = connection.query(sql, [values]);

    	return result;
	}).then(function(result){
		var review_id = result.insertId;

		if(req.body.review == ""){
			var sql = "insert into review_plan (review_id, plan_id, review_rating, review_timestamp) values (?)";
			var values = [review_id, req.body.plan, req.body.rating, convertToSQLTimestamp(Date.now())];
	    	var result = connection.query(sql, [values]);

	    	res.send(JSON.stringify('success'));
		}

		else{
			var sql = "insert into review_plan values (?)";
			var values = [review_id, req.body.plan, req.body.review, req.body.rating, convertToSQLTimestamp(Date.now())];
	    	var result = connection.query(sql, [values]);

	    	res.send(JSON.stringify('success'));
		}

	});
});


app.post('/archive-plan', function(req, res){
	var plan_id = parseInt(req.body.plan);
	var user = req.cookies['user'];

	var connection;

	if(plan_id != undefined && user != undefined){

		promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

		}).then(function(conn){
			connection = conn;

			var sql = "select user from plan where id = ?";
			var values = [plan_id];

		    var result = conn.query(sql, [values]);

		    return result;
		}).then(function(result){

			if(result[0].user == user){
				sql = "update plan set isArchived = 1 where id = ?";
				values = [plan_id];

				var result = connection.query(sql, values);
		    	connection.end();

				res.contentType('json');
				res.send({result: 'success'});

			}

			else{
				res.contentType('json');
				res.send({result: 'error'});
			}

		});

	}

	else{
		res.contentType('json');
		res.send({result: 'error'});
	}



});




app.post('/save-plan', function(req, res){
	var plan_id = parseInt(req.body.plan);
	var user = parseInt(req.body.user);
	var connection;


	if(plan_id != undefined && user != undefined){

		promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

		}).then(function(conn){
			connection = conn;

			var sql = "select user from plan where id = ? and isManual = 1";
			var values = [plan_id];

		    var result = conn.query(sql, [values]);

		    return result;
		}).then(function(result){

			if(result[0].user == user){
				sql = "update plan set isActive = 1, isManual = 0 where id = ?";
				values = [plan_id];

				var result = connection.query(sql, values);

				return true;

			}

			else{
				res.contentType('json');
				res.send({result: 'error'});

				return false;
			}

		}).then(function(result){

			if(result){
				sql = "update visit set isActive = 1 where plan_id = ?";
				values = [plan_id];

				connection.query(sql, values);

				connection.end();

				res.contentType('json');
				res.send({result: 'success'});

			}

		});

	}

	else{
		res.contentType('json');
		res.send({result: 'error'});
	}


});



app.post('/add-visit', function(req, res){
	
	console.log("ADD VISIT " + req.body.poi + " TO THE PLAN " + req.body.plan);

	var connection;

	var plan_id = parseInt(req.body.plan);
	var poi_id = parseInt(req.body.poi);

	var sql, parameters;
	var isManual;

	promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

    }).then(function(conn){

		connection = conn;

		sql = "select isManual from plan where id = ?";
		parameters = [plan_id];

		return connection.query(sql, [parameters]);
						
	}).then(function(result){

		isManual = parseInt(result[0].isManual[0]);

		if(isManual == 0){
			sql = "select plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from plan join visit on plan.id = visit.plan_id where plan.id = ? and visit.isActive = 1";
		}

		else{
			sql = "select plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from plan join visit on plan.id = visit.plan_id where plan.id = ? and plan.isManual = 1";
		}

		parameters = [plan_id]

		var result = connection.query(sql, [parameters]);

		return result;

    }).then(function(result){

    	var plan = {};

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

	        var schedule;

	        if(req.body.schedule != undefined){
	        	schedule = getFinalSchedule(req.body.schedule.split(" ")[0], req.body.schedule.split(" ")[1]);
	        }
	        else
	    		schedule = getPlanOpenSlot(plan);


	    	if(schedule != false){
	        	var values;

	        	if(isManual == 0){
	        		sql = "insert into Visit(plan_id, poi_id, start_time, end_time, weather) VALUES ?";
					values = [[plan_id, poi_id, schedule[0], schedule[1], 'Sunny']];
				}

				else{
	        		sql = "insert into Visit(plan_id, poi_id, start_time, end_time, weather, isActive) VALUES ?";
					values = [[plan_id, poi_id, schedule[0], schedule[1], 'Sunny', 0]];

				}

				connection.query(sql, [values], function (err, result) {
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

	    	sql = "select plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff from plan where id = ?";
			parameters = [plan_id];

			return connection.query(sql, [parameters]);

	    }


	}).then(function(result){

		if(result == 1)
			return;

		var schedule;

		var schedule;

        if(req.body.schedule != undefined)
        	schedule = req.body.schedule;
        else{
        	day = new Date(result[0].start_date);
			day = day.getFullYear() + "-" + (day.getMonth()<10?'0':'') + (day.getMonth() + 1)  + "-" + (day.getDate()<10?'0':'') + day.getDate();

			var schedules = getSchedules();

			schedule = getFinalSchedule(day, schedules[0]);

        }

		if(schedule != false){
        	var values;

        	if(isManual == 0){
        		sql = "insert into Visit(plan_id, poi_id, start_time, end_time, weather) VALUES ?";
				values = [[plan_id, poi_id, schedule[0], schedule[1], 'Sunny']];
			}

			else{
        		sql = "insert into Visit(plan_id, poi_id, start_time, end_time, weather, isActive) VALUES ?";
				values = [[plan_id, poi_id, schedule[0], schedule[1], 'Sunny', 0]];

			}

			connection.query(sql, [values], function (err, result) {
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

	});

});




app.post('/delete-visit', function(req, res){
	var plan_id = parseInt(req.body.plan);
	var poi_id = parseInt(req.body.poi);
	var user = parseInt(req.body.user);
	var connection;

	var isManual;

	if(plan_id != undefined && user != undefined){

		promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

		}).then(function(conn){

			connection = conn;

			var sql = "select isManual from plan where id = ?";
			var values = [plan_id];

			return connection.query(sql, [values]);
							
		}).then(function(result){

			isManual = parseInt(result[0].isManual[0]);

			sql = "select user from plan where id = ?";
			values = [plan_id];

		    var result = connection.query(sql, [values]);

		    return result;

		}).then(function(result){
			if(result[0].user == user){

				if(isManual == 0)
					sql = "update visit set isActive = 0 where plan_id = ? and poi_id = ?";

				else
					sql = "delete from visit where plan_id = ? and poi_id = ?";

				values = [plan_id, poi_id];

				result = connection.query(sql, values);
		    	connection.end();

				res.contentType('json');
				res.send({result: 'success'});

			}

			else{
				res.contentType('json');
				res.send({result: 'error'});
			}

		});

	}

	else{
		res.contentType('json');
		res.send({result: 'error'});
	}

});


app.get('/plan', function(req,res){
	if(req.query['id'] != undefined){

		var connection;

		var user = req.cookies['user'];
		var plan_id = req.query['id'];
		var view_method = req.query['v'];

		var sql = "select plan.name as plan_name, plan.user as user, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, plan.isPublic as isPublic, plan.num_viewers as num_viewers, visit.start_time as start_time, visit.end_time as end_time, weather, poi.name as name, poi.id as id, city.name as city, place_id, website, phone_number, address, poi_type, poi.latitude as latitude, poi.longitude as longitude from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.id = ? and plan.isActive = 1 and visit.isActive = 1 order by start_time";
		var parameters = [plan_id];

		if(view_method == 'full'){
			con.query(sql, parameters, function (err, result, fields) {
		        if (err) throw err;

		        var start_date = "n/a";
		        var end_date = "n/a";
		        var city = "";
		        var name;
		        var date_diff = 0;
		        var isPublic = 0;
		        var source;
		        var num_viewers = 0;

		        var dates = [];
		        if(result.length > 0){
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


		        	start_date = new Date(result[0].start_date);
		        	end_date = new Date(result[0].end_date);

		        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

		        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
		        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

		        	date_diff = result[0].date_diff;

		        	city = result[0].city;

		        	days = getPlanDays(start_date_aux, parseInt(date_diff));

		        	if(result[0].plan_name != null && result[0].plan_name.length > 0)
		        		name = result[0].plan_name;
		        	else
		        		name = 'Your visit to ' + city;

		        	isPublic = result[0].isPublic[0];

		        	if(result[0].user == user)
		        		source = "author";
		        	else
		        		source = "viewer";

		        	num_viewers = result[0].num_viewers;

		        }

		        var plan = []
		        for(var i=0; i < result.length; i++){
		        	var visit = new Object();
		        	visit["id"] = result[i].id;
		        	visit["name"] = result[i].name;
		        	visit["place_id"] = result[i].place_id;

		        	var start_time = new Date(result[i].start_time);
		        	var end_time = new Date(result[i].end_time);

		        	visit["day"] = (start_time.getDate()<10?'0':'') + start_time.getDate() + " " + month[start_time.getMonth()] + " " + start_time.getFullYear();

		        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
		        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();
		        	visit["weather"] = result[i].weather;
		        	visit["address"] = result[i].address;
		        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
		        	visit["website"] = result[i].website;
		        	visit["phone_number"] = result[i].phone_number;
		        	visit["poi_type"] = result[i].poi_type;
		        	visit["city"] = result[i].city; 

		        	plan.push(visit);
		        }


        	 	promise.createConnection({
	    			host: 'localhost',
				    user: 'root',
				    password: 'password',
				    database: 'placesdb'

				}).then(function(conn){
					connection = conn;

					var sql = "select distinct city from plan where id = ?";
					var values = [plan_id];
				    var result = connection.query(sql, [values]);

			    	return result;
				}).then(function(result){
					var city_id = result[0].city;

					var sql2 = "select id, place_id, name from poi where city = ? and poi_type != 'Hotel' id not in (select poi_id from visit where plan_id = ?) order by num_reviews desc";
		        	var parameters2 = [city_id, plan_id];

			        con.query(sql2, parameters2, function (err, result, fields) {
			        	if (err) throw err;

			        	var suggested_visits = [];

			        	var length = 3;
			        	if(result.length < length)
			        		length = result.length;

			        	for(var i=0; i < length; i++){
				        	var visit = new Object();
				        	visit["id"] = result[i].id;
				        	visit["name"] = result[i].name;
				        	visit["place_id"] = result[i].place_id;
				        	suggested_visits.push(visit);
				        }

				        var sql3 = "select id, place_id, name from poi where city = ? and poi_type = 'Hotel' and id not in (select poi_id from visit where plan_id = ?)  order by num_reviews desc";
				        var parameters3 = [city_id, plan_id];

				        con.query(sql3, parameters3, function (err, result, fields) {
				        	if (err) throw err;

				        	var suggested_hotels = [];

				        	var length = 3;
				        	if(result.length < length)
				        		length = result.length;

				        	for(var i=0; i < length; i++){
					        	var visit = new Object();
				        		visit["id"] = result[i].id;
					        	visit["name"] = result[i].name;
					        	visit["place_id"] = result[i].place_id;
					        	suggested_hotels.push(visit);
					        }

					        var sql4 = "select user.name as user, user.picture as picture, review_text, review_rating, review_timestamp from review_plan join (review join user on review.user_id = user.id ) on review_plan.review_id = review.id WHERE plan_id = ? order by review_timestamp desc";

							con.query(sql4, plan_id, function (err, result, fields) {
						    	if (err) throw err;

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

						    	var sql5 = "select avg(review_rating) as rating, count(*) as num_reviews from review_plan where plan_id = ?";
						        var parameters5 = [plan_id];

						        con.query(sql5, parameters5, function (err, result, fields) {
					        		if (err) throw err;

					        		var rating = "0.0";
					        		var num_reviews = 0;

					        		if(result.length > 0){
					        			num_reviews = result[0].num_reviews;
					        			if(result[0].rating != null)
					        				rating = result[0].rating.toFixed(1);
					        		}


				        		 	var sql6 = "select count(*) as num_plans from plan where parent_plan = ?";
							        var parameters6 = [plan_id];

							        con.query(sql6, parameters6, function (err, result, fields) {
						        		if (err) throw err;

						        		var num_plans = 0;

						        		if(result.length > 0)
						        			num_plans = result[0].num_plans;


								        if(isPublic == "1" || source == "author")
								        	res.render(path.join(__dirname+'/templates/full-plan.html'), {plan_id: plan_id, name: name, plan: plan, start_date: start_date, end_date: end_date, city: city, days: days, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels, source: source, isPublic: isPublic, isManual: 0, reviews: reviews, num_viewers: num_viewers, rating: rating, num_reviews: num_reviews, num_plans: num_plans});
								        else
								        	res.status(404).render(path.join(__dirname+'/templates/404page.html'), );

							        });

							    });

					        });
				        

				        });

	        		});
				}).then(function(result){
					sql = "update plan set num_viewers = num_viewers + 1 where id = ?";
					values = [plan_id];
				    result = connection.query(sql, [values]);
				    connection.end();

				});
       	
	    	});
		}

		else if(view_method == 'map'){
			con.query(sql, parameters, function (err, result, fields) {
		        if (err) throw err;

		        var start_date = "n/a";
		        var end_date = "n/a";
		        var city = ""; 
		        var date_diff = 0;
		        var isPublic = 0;
		        var source;
		        var num_viewers = 0;

		        var dates = [];
		        if(result.length > 0){
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


		        	start_date = new Date(result[0].start_date);
		        	end_date = new Date(result[0].end_date);

		        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

		        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
		        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

		        	date_diff = result[0].date_diff;

		        	city = result[0].city;

		        	days = getPlanDays(start_date_aux, parseInt(date_diff));

		        	if(result[0].plan_name != null && result[0].plan_name.length > 0)
		        		name = result[0].plan_name;
		        	else
		        		name = 'Your visit to ' + city;

		        	isPublic = result[0].isPublic[0];

		        	if(result[0].user == user)
		        		source = "author";
		        	else
		        		source = "viewer";

		        	num_viewers = result[0].num_viewers;

		        }

		        var plan = []
		        for(var i=0; i < result.length; i++){
		        	var visit = new Object();
		        	visit["id"] = result[i].id;
		        	visit["name"] = result[i].name;
		        	visit["place_id"] = result[i].place_id;

		        	var start_time = new Date(result[i].start_time);
		        	var end_time = new Date(result[i].end_time);

		        	visit["day"] = (start_time.getDate()<10?'0':'') + start_time.getDate() + " " + month[start_time.getMonth()] + " " + start_time.getFullYear();

		        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
		        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();
		        	visit["weather"] = result[i].weather;
		        	visit["address"] = result[i].address;
		        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
		        	visit["website"] = result[i].website;
		        	visit["phone_number"] = result[i].phone_number;
		        	visit["poi_type"] = result[i].poi_type;
		        	visit["city"] = result[i].city; 

		        	plan.push(visit);
		        }


        	 	promise.createConnection({
	    			host: 'localhost',
				    user: 'root',
				    password: 'password',
				    database: 'placesdb'

				}).then(function(conn){
					connection = conn;

					var sql = "select distinct city from plan where id = ?";
					var values = [plan_id];
				    var result = connection.query(sql, [values]);
			    	return result;
			    	
				}).then(function(result){
					var city_id = result[0].city;

					var sql2 = "select id, place_id, name, latitude, longitude, address, website, phone_number, poi_type from poi where city = ? and poi_type != 'Hotel' and id not in (select poi_id from visit where plan_id = ?) order by num_reviews desc";
		        	var parameters2 = [city_id, plan_id];

			        con.query(sql2, parameters2, function (err, result, fields) {
			        	if (err) throw err;

			        	var suggested_visits = [];

			        	var length = 10;
			        	if(result.length < length)
			        		length = result.length;

			        	for(var i=0; i < length; i++){
				        	var visit = new Object();
				        	visit["id"] = result[i].id;
				        	visit["name"] = result[i].name;
				        	visit["place_id"] = result[i].place_id;
				        	visit["address"] = result[i].address;
				        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
				        	visit["website"] = result[i].website;
				        	visit["phone_number"] = result[i].phone_number;
				        	visit["poi_type"] = result[i].poi_type;
				        	suggested_visits.push(visit);
				        }

				        var sql3 = "select id, place_id, name, latitude, longitude, address, website, phone_number, poi_type from poi where city = ? and poi_type = 'Hotel' and id not in (select poi_id from visit where plan_id = ?)  order by num_reviews desc";
				        var parameters3 = [city_id, plan_id];

				        con.query(sql3, parameters3, function (err, result, fields) {
				        	if (err) throw err;

				        	var suggested_hotels = [];

				        	var length = 10;
				        	if(result.length < length)
				        		length = result.length;

				        	for(var i=0; i < length; i++){
					        	var visit = new Object();
				        		visit["id"] = result[i].id;
					        	visit["name"] = result[i].name;
					        	visit["place_id"] = result[i].place_id;
					        	visit["address"] = result[i].address;
					        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
					        	visit["website"] = result[i].website;
					        	visit["phone_number"] = result[i].phone_number;
					        	visit["poi_type"] = result[i].poi_type;
					        	suggested_hotels.push(visit);
					        }


					        var sql4 = "select avg(review_rating) as rating, count(*) as num_reviews from review_plan where plan_id = ?";
					        var parameters4 = [plan_id];

					        con.query(sql4, parameters4, function (err, result, fields) {
				        		if (err) throw err;

				        		var rating = "0.0";
				        		var num_reviews = 0;

				        		if(result.length > 0){
				        			num_reviews = result[0].num_reviews;
				        			if(result[0].rating != null)
				        				rating = result[0].rating.toFixed(1);
				        		}


			        		 	var sql5 = "select count(*) as num_plans from plan where parent_plan = ?";
						        var parameters5 = [plan_id];

						        con.query(sql5, parameters5, function (err, result, fields) {
					        		if (err) throw err;

					        		var num_plans = 0;

					        		if(result.length > 0)
					        			num_plans = result[0].num_plans;


							        if(isPublic == "1" || source == "author")
							        	res.render(path.join(__dirname+'/templates/map.html'), {plan_id: plan_id, name: name, plan: plan, start_date: start_date, end_date: end_date, city: city, days: days, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels, source: source, isPublic: isPublic, isManual: 0});
							        else
							        	res.status(404).render(path.join(__dirname+'/templates/404page.html'), );


					        	});
				        	});
				        });

	        		});

				}).then(function(result){
					sql = "update plan set num_viewers = num_viewers + 1 where id = ?";
					values = [plan_id];
				    result = connection.query(sql, [values]);
				    connection.end();
				    
				});


       	
	    	});
		}

		else{

			con.query(sql, parameters, function (err, result, fields) {
		        if (err) throw err;

		        var start_date = "n/a";
		        var end_date = "n/a";
		        var city = ""; 
		        var date_diff = 0;
		        var isPublic = 0;
		        var source;
		        var num_viewers = 0;

		        var dates = [];
		        if(result.length > 0){
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


		        	start_date = new Date(result[0].start_date);
		        	end_date = new Date(result[0].end_date);

		        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

		        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
		        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

		        	date_diff = result[0].date_diff;

		        	city = result[0].city;

		        	days = getPlanDays(start_date_aux, parseInt(date_diff));

		        	if(result[0].plan_name != null && result[0].plan_name.length > 0)
		        		name = result[0].plan_name;
		        	else
		        		name = 'Your visit to ' + city;

		        	isPublic = result[0].isPublic[0];

		        	if(result[0].user == user)
		        		source = "author";
		        	else
		        		source = "viewer";

		        	num_viewers = result[0].num_viewers;

		        }

		        var plan = []
		        for(var i=0; i < result.length; i++){
		        	var visit = new Object();
		        	visit["id"] = result[i].id;
		        	visit["name"] = result[i].name;
		        	visit["place_id"] = result[i].place_id;

		        	var start_time = new Date(result[i].start_time);
		        	var end_time = new Date(result[i].end_time);

		        	visit["day"] = (start_time.getDate()<10?'0':'') + start_time.getDate() + " " + month[start_time.getMonth()] + " " + start_time.getFullYear();

		        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
		        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();

		        	

		        	visit["weather"] = result[i].weather;
		        	visit["address"] = result[i].address;
		        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
		        	visit["website"] = result[i].website;
		        	visit["phone_number"] = result[i].phone_number;
		        	visit["poi_type"] = result[i].poi_type;
		        	visit["city"] = result[i].city; 

		        	plan.push(visit);





		        }

		        //console.log(getWeather(plan[0].coordinates.split(',')[0], plan[0].coordinates.split(',')[1], plan[0].day));

				promise.createConnection({
	    			host: 'localhost',
				    user: 'root',
				    password: 'password',
				    database: 'placesdb'

				}).then(function(conn){
					connection = conn;

					var sql = "select city from plan where id = ?";
					var values = [plan_id];
				    var result = connection.query(sql, [values]);

			    	return result;
				}).then(function(result){
					var city_id = result[0].city;

					var sql2 = "select id, place_id, name, latitude, longitude, address, website, phone_number, poi_type from poi where city = ? and poi_type != 'Hotel' and  id not in (select poi_id from visit where plan_id = ?) order by num_reviews desc";
		        	var parameters2 = [city_id, plan_id];

			        con.query(sql2, parameters2, function (err, result, fields) {
			        	if (err) throw err;

			        	var suggested_visits = [];

			        	var length = 10;
			        	if(result.length < length)
			        		length = result.length;

			        	for(var i=0; i < length; i++){
				        	var visit = new Object();
				        	visit["id"] = result[i].id;
				        	visit["name"] = result[i].name;
				        	visit["place_id"] = result[i].place_id;
				        	visit["address"] = result[i].address;
				        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
				        	visit["website"] = result[i].website;
				        	visit["phone_number"] = result[i].phone_number;
				        	visit["poi_type"] = result[i].poi_type;
				        	suggested_visits.push(visit);
				        }

				        var sql3 = "select id, place_id, name, latitude, longitude, address, website, phone_number, poi_type from poi where city = ? and poi_type = 'Hotel' and id not in (select poi_id from visit where plan_id = ?)  order by num_reviews desc";
				        var parameters3 = [city_id, plan_id];

				        con.query(sql3, parameters3, function (err, result, fields) {
				        	if (err) throw err;

				        	var suggested_hotels = [];

				        	var length = 10;
				        	if(result.length < length)
				        		length = result.length;

				        	for(var i=0; i < length; i++){
					        	var visit = new Object();
				        		visit["id"] = result[i].id;
					        	visit["name"] = result[i].name;
					        	visit["place_id"] = result[i].place_id;
					        	visit["address"] = result[i].address;
					        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
					        	visit["website"] = result[i].website;
					        	visit["phone_number"] = result[i].phone_number;
					        	visit["poi_type"] = result[i].poi_type;
					        	suggested_hotels.push(visit);
					        }

					        var sql4 = "select user.name as user, user.picture as picture, review_text, review_rating, review_timestamp from review_plan join (review join user on review.user_id = user.id ) on review_plan.review_id = review.id WHERE plan_id = ? order by review_timestamp desc";

							con.query(sql4, plan_id, function (err, result, fields) {
						    	if (err) throw err;

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

						    	var sql5 = "select avg(review_rating) as rating, count(*) as num_reviews from review_plan where plan_id = ?";
						        var parameters5 = [plan_id];

						        con.query(sql5, parameters5, function (err, result, fields) {
					        		if (err) throw err;

					        		var rating = "0.0";
					        		var num_reviews = 0;

					        		if(result.length > 0){
					        			num_reviews = result[0].num_reviews;
					        			if(result[0].rating != null)
					        				rating = result[0].rating.toFixed(1);
					        		}


				        		 	var sql6 = "select count(*) as num_plans from plan where parent_plan = ?";
							        var parameters6 = [plan_id];

							        con.query(sql6, parameters6, function (err, result, fields) {
						        		if (err) throw err;

						        		var num_plans = 0;

						        		if(result.length > 0)
						        			num_plans = result[0].num_plans;


								        if(isPublic == "1" || source == "author")
								        	res.render(path.join(__dirname+'/templates/plan.html'), {plan_id: plan_id, name: name, plan: plan, start_date: start_date, end_date: end_date, city: city, days: days, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels, source: source, isPublic, isManual: 0, reviews: reviews, num_viewers: num_viewers, rating: rating, num_reviews: num_reviews, num_plans: num_plans});
								        else
								        	res.status(404).render(path.join(__dirname+'/templates/404page.html'), );

								    });

							    });

					        });
					        
				        });

	        		});
				}).then(function(result){
					sql = "update plan set num_viewers = num_viewers + 1 where id = ?";
					values = [plan_id];
				    result = connection.query(sql, [values]);
				    connection.end();
				    
				});
       	
	    	});
		}

	}
	
});


app.get('/plan-m', function(req,res){
	if(req.query['id'] != undefined){

		var plan_id = req.query['id'];

		var sql = "select plan.name as plan_name, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time, weather, poi.name as name, poi.id as id, city.name as city, place_id, website, phone_number, address, poi_type, poi.latitude as latitude, poi.longitude as longitude from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.id = ? and plan.isManual = 1 order by start_time";
		var parameters = [plan_id];

		con.query(sql, parameters, function (err, result, fields) {
	        if (err) throw err;

	        var start_date = "n/a";
	        var end_date = "n/a";
	        var city = "";
	        var name;
	        var date_diff = 0;

	        var dates = [];
	        if(result.length > 0){
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


	        	start_date = new Date(result[0].start_date);
	        	end_date = new Date(result[0].end_date);

	        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

	        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
	        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

	        	date_diff = result[0].date_diff;

	        	city = result[0].city;

	        	days = getPlanDays(start_date_aux, parseInt(date_diff));

	        	if(result[0].plan_name != null && result[0].plan_name.length > 0)
	        		name = result[0].plan_name;
	        	else
	        		name = 'Your visit to ' + city;


	        }


	        else{

	        	sql = "select plan.name as plan_name, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, city.name as city from plan join city on plan.city = city.id where plan.id = ?";
	        	parameters = [plan_id];

	        	con.query(sql, parameters, function (err, result, fields) {
			        if (err) throw err;

			        if(result.length > 0){
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


			        	start_date = new Date(result[0].start_date);
			        	end_date = new Date(result[0].end_date);

			        	start_date_aux = start_date.getDate() + "-" + (start_date.getMonth()+1) + "-" + start_date.getFullYear();

			        	start_date = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
			        	end_date = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

			        	date_diff = result[0].date_diff;

			        	city = result[0].city;

			        	days = getPlanDays(start_date_aux, parseInt(date_diff));

			        	if(result[0].plan_name != null && result[0].plan_name.length > 0)
			        		name = result[0].plan_name;
			        	else
			        		name = 'Your visit to ' + city;


			        }

			    });

	        }



	        var plan = []
	        for(var i=0; i < result.length; i++){
	        	var visit = new Object();
	        	visit["id"] = result[i].id;
	        	visit["name"] = result[i].name;
	        	visit["place_id"] = result[i].place_id;

	        	var start_time = new Date(result[i].start_time);
	        	var end_time = new Date(result[i].end_time);

	        	visit["day"] = (start_time.getDate()<10?'0':'') + start_time.getDate() + " " + month[start_time.getMonth()] + " " + start_time.getFullYear();

	        	visit["start_time"] = start_time.getHours() + ":" + (start_time.getMinutes()<10?'0':'') + start_time.getMinutes();
	        	visit["end_time"] = end_time.getHours() + ":" + (end_time.getMinutes()<10?'0':'') + end_time.getMinutes();
	        	visit["weather"] = result[i].weather;
	        	visit["address"] = result[i].address;
	        	visit["coordinates"] = result[i].latitude + ", " + result[i].longitude;
	        	visit["website"] = result[i].website;
	        	visit["phone_number"] = result[i].phone_number;
	        	visit["poi_type"] = result[i].poi_type;
	        	visit["city"] = result[i].city; 

	        	plan.push(visit);
	        }


    	 	promise.createConnection({
    			host: 'localhost',
			    user: 'root',
			    password: 'password',
			    database: 'placesdb'

			}).then(function(conn){
				var sql = "select distinct city from plan where id = ?";
				var values = [plan_id];
			    var result = conn.query(sql, [values]);
			    conn.end();

		    	return result;
			}).then(function(result){
				var city_id = result[0].city;

				var sql2 = "select id, place_id, name from poi where city = ? and id not in (select poi_id from visit where plan_id = ?) order by num_reviews desc";
	        	var parameters2 = [city_id, plan_id];

		        con.query(sql2, parameters2, function (err, result, fields) {
		        	if (err) throw err;

		        	var suggested_visits = [];

		        	var length = 3;
		        	if(result.length < length)
		        		length = result.length;

		        	for(var i=0; i < length; i++){
			        	var visit = new Object();
			        	visit["id"] = result[i].id;
			        	visit["name"] = result[i].name;
			        	visit["place_id"] = result[i].place_id;
			        	suggested_visits.push(visit);
			        }

			        var sql3 = "select id, place_id, name from poi where city = ? and poi_type = 'Hotel' and id not in (select poi_id from visit where plan_id = ?)  order by num_reviews desc";
			        var parameters3 = [city_id, plan_id];

			        con.query(sql3, parameters3, function (err, result, fields) {
			        	if (err) throw err;

			        	var suggested_hotels = [];

			        	var length = 3;
			        	if(result.length < length)
			        		length = result.length;

			        	for(var i=0; i < length; i++){
				        	var visit = new Object();
			        		visit["id"] = result[i].id;
				        	visit["name"] = result[i].name;
				        	visit["place_id"] = result[i].place_id;
				        	suggested_hotels.push(visit);
				        }

				        res.render(path.join(__dirname+'/templates/full-plan.html'), {plan_id: plan_id, name: name, plan: plan, start_date: start_date, end_date: end_date, city: city, days: days, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels, source: "author", isPublic: 0, isManual: 1, reviews: [], num_viewers: 0, rating: 0, num_reviews: 0, num_plans: 0});

			        });

        		});
			});
    	});
		
	}
	
});




app.get('/calendar', function(req, res){
	res.render(path.join(__dirname+'/templates/calendar.html'),);
});





app.get('/trips', function(req, res){

	if(req.query['id'] != undefined){

		var user_id = req.query['id'];

		var sql = "select distinct plan.name as name, city.name as city, plan.start_date as start, plan.end_date as end, plan.id as plan_id, plan.isPublic as isPublic, plan.photo as photo from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.user = ? and plan.isActive = 1 and plan.isArchived = 0";
		var parameters = [user_id];

		con.query(sql, parameters, function (err, result, fields) {
	        if (err) throw err;

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

	        	plan["photo"] = result[i].photo;

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

	        	start_date = new Date(result[i].start);
	        	end_date = new Date(result[i].end);
	        	now = new Date();

	        	plan["start"] = start_date.getDate() + " " + month[start_date.getMonth()] + " " + start_date.getFullYear();
	        	plan["end"] = end_date.getDate() + " " + month[end_date.getMonth()] + " " + end_date.getFullYear();

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
	}


});



app.post('/login-g', function(req, res){

	var connection;

	promise.createConnection({
		host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
		connection = conn;

		var sql = "select count(*) as count from user_g where google_id = ?";
		var values = [req.body.google_id];
	    var result = connection.query(sql, [values]);

    	return result;
	}).then(function(result){

		if(parseInt(result[0].count) == 0){
			var sql = "insert into user (username, name, picture) values (?)";
			var values = [req.body.username, req.body.name, req.body.picture];
			var result = connection.query(sql, [values]);	

			return result;
		}

		else{

			var sql = "select id, picture from user join user_g on user.id = user_g.user_id where google_id = ?";
			var values = [req.body.google_id];

			con.query(sql, values, function (err, result, fields) {
	        	if (err) throw err;

	    	 	var user_id = result[0].id;
		       	var picture = result[0].picture;

      			res.contentType('json');
				res.send({user_id: user_id, picture: picture});

			});


	        return -1;
		}

	}).then(function(result){

		if(result == -1){
			return;
		}

		var user_id = result.insertId;

		var sql = "insert into user_g values (?) ";
		var values = [user_id, req.body.google_id];
		var result = connection.query(sql, [values]);	

        var sql2 = "select id, picture from user where id = ?";
		var values2 = [user_id];

		con.query(sql2, values2, function (err, result, fields) {
        	if (err) throw err;

    	 	var user_id = result[0].id;
	        var picture = result[0].picture;


      		res.contentType('json');
			res.send({user_id: user_id, picture: picture});

		});

	});

});


app.post('/login-e', function(req, res){

	var connection;

	promise.createConnection({
		host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
		connection = conn;

		var sql = "select id, picture, CAST(password AS CHAR(32) CHARACTER SET utf8) as password from user_e join user on user_e.user_id = user.id where username = ?";
		var values = [req.body.email];
	    var result = connection.query(sql, [values]);

    	return result;
	}).then(function(result){

		if(parseInt(result.length) == 1){

			if(result[0].password == md5(req.body.password)){

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

	var connection;

	if(req.file) {

		var password = md5(req.body.password);

		promise.createConnection({
			host: 'localhost',
		    user: 'root',
		    password: 'password',
		    database: 'placesdb'

		}).then(function(conn){

			connection = conn;

			var sql = "select count(*) as count from user where username = ?";
			var values = [req.body.email];
		    var result = connection.query(sql, [values]);

	    	return result;
		}).then(function(result){

			if(parseInt(result[0].count) == 0){

				/* Begin transaction */
				con.beginTransaction(function(err) {
  					if (err) { throw err; }

					var sql = "insert into user (username, name, picture, type_use) values (?)";
					var values = [req.body.email, req.body.fname + " " + req.body.lname, req.file.filename, req.body.type_use];

					con.query(sql, [values], function(err, result) {
    					if (err) { 
      						con.rollback(function() {
        						throw err;
      						});
      					}

	      				var user_id = result.insertId;

	      				var picture_fn = req.file.path.split('.')[0] + "_" + user_id + "." + req.file.path.split('.')[1];

						fs.rename(req.file.path, picture_fn, function(err) {
			    			if ( err ) console.log('ERROR: ' + err);

				    		var birthday = req.body.birthday.split('/')[2] + "-" + req.body.birthday.split('/')[1] + "-" + req.body.birthday.split('/')[0];

							if(req.body.phone != undefined){
								sql = "insert into user_e values (?) ";
								values = [user_id, birthday, req.body.gender, req.body.country, req.body.phone, password];
							}

							else{
								sql = "insert into user_e (birthday, gender, country, password) values (?) ";
								values = [user_id, birthday, req.body.gender, req.body.country, password];

							}

							con.query(sql, [values],  function(err, result) {
								if (err) { 
	    							con.rollback(function() {
						          		throw err;
						        	});
					     		}

								var sql2 = "update user set picture = (?) where id = (?)";
								var values2 = [picture_fn.split('dist')[1], user_id];

								con.query(sql2, values2,  function(err, result) {
									if (err) { 
		    							con.rollback(function() {
							       	   		throw err;
							        	});
						     		}

		        					var sql3 = "select id, picture from user where id = ?";
									var values3 = [user_id];

									con.query(sql3, values3, function (err, result, fields) {
			        					if (err) { 
		    								con.rollback(function() {
							       	   			throw err;
						        			});
						     			}

						     			con.commit(function(err) {
								        	if (err) { 
								          		con.rollback(function() {
								            		throw err;
								          		});
								        	}
								       	 	console.log('Transaction Complete.');
								        	con.end();
								      	});	

		    	 						var user_id = result[0].id;
				        				var picture = result[0].picture;


										res.render(path.join(__dirname+'/templates/register.html'), {isRegistered: true, alreadyExists: false});

									});
								});
							});
						});
					});
				});
			}

			else{

				res.render(path.join(__dirname+'/templates/register.html'), {isRegistered: false, alreadyExists: true});
			}

		});
			
	}


	else{

		var password = md5(req.body.password);

		promise.createConnection({
			host: 'localhost',
		    user: 'root',
		    password: 'password',
		    database: 'placesdb'

		}).then(function(conn){

			connection = conn;

			var sql = "select count(*) as count from user where username = ?";
			var values = [req.body.email];
		    var result = connection.query(sql, [values]);

	    	return result;
		}).then(function(result){

			if(parseInt(result[0].count) == 0){

				/* Begin transaction */
				con.beginTransaction(function(err) {
  					if (err) { throw err; }

					var sql = "insert into user (username, name) values (?)";
					var values = [req.body.email, req.body.fname + " " + req.body.lname];

					con.query(sql, [values], function(err, result) {
    					if (err) { 
      						con.rollback(function() {
        						throw err;
      						});
      					}

	      				var user_id = result.insertId;

      					console.log('User ' + user_id + ' added');

			    		var birthday = req.body.birthday.split('/')[2] + "-" + req.body.birthday.split('/')[1] + "-" + req.body.birthday.split('/')[0];

						if(req.body.phone != undefined){
							sql = "insert into user_e values (?) ";
							values = [user_id, birthday, req.body.gender, req.body.country, req.body.phone, password];
						}

						else{
							sql = "insert into user_e (birthday, gender, country, password) values (?) ";
							values = [user_id, birthday, req.body.gender, req.body.country, password];

						}

						con.query(sql, [values],  function(err, result) {
							if (err) { 
    							con.rollback(function() {
					          		throw err;
					        	});
				     		}

      						console.log('Register completed');

        					var sql2 = "select id, picture from user where id = ?";
							var values2 = [user_id];

							con.query(sql2, values2, function (err, result, fields) {
	        					if (err) { 
    								con.rollback(function() {
					       	   			throw err;
				        			});
				     			}

				     			con.commit(function(err) {
						        	if (err) { 
						          		con.rollback(function() {
						            		throw err;
						          		});
						        	}
						       	 	console.log('Transaction Complete.');
						        	con.end();
						      	});	

    	 						var user_id = result[0].id;
		        				var picture = result[0].picture;


								res.render(path.join(__dirname+'/templates/register.html'), {isRegistered: true, alreadyExists: false});
							});
						});
					});
				});
			}

			else{

				res.render(path.join(__dirname+'/templates/register.html'), {isRegistered: false, alreadyExists: true});
			}

		});

	}

});


app.get('/profile', function(req, res){
	res.render(path.join(__dirname+'/templates/profile.html'),);
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
	var connection;

	promise.createConnection({
		host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

	}).then(function(conn){
		connection = conn;

		var sql = "insert into review (user_id) values (?)";
		var values = [req.body.user];
	    var result = connection.query(sql, [values]);

    	return result;
	}).then(function(result){
		var review_id = result.insertId;

		if(parseInt(req.body.rating) == 0){
			var sql = "insert into review_poi (review_id, poi_id, review_text, review_timestamp) values (?)";
			var values = [review_id, req.body.poi, req.body.review, convertToSQLTimestamp(Date.now())];
	    	var result = connection.query(sql, [values]);

	    	res.send(JSON.stringify('success'));
		}

		else{
			var sql = "insert into review_poi values (?)";
			var values = [review_id, req.body.poi, req.body.review, req.body.rating, convertToSQLTimestamp(Date.now())];
	    	var result = connection.query(sql, [values]);

	    	res.send(JSON.stringify('success'));
		}

	});
});



app.post('/add-description-poi', function(req, res){
	
	var sql = "update poi set description = ? where id = ?";
	var values = [req.body.description, req.body.poi];

	con.query(sql, values, function (err, result, fields) {
		if (err){
			throw err;
			res.send(JSON.stringify('error'));
		}

		else{
			res.send(JSON.stringify('success'));
		}
	});
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


function getWeather(lat, lon, date){

	console.log(date); // 31 May 2019

	var url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + parseFloat(lat) + "&lon=" + parseFloat(lon) + "&appid=" + OPEN_WEATHER_API_KEY + "&units=metric";

	/*request(url, function (err, response, body) {
	  if(err){
	    console.log('error:', error);
	  } else {

	  	var info = body["list"];

	  	//for(var i=0; i < info.length; i++){



	  		// encontrar o info[i]["dt_txt"] mais próximo do horario da visita

	  		// sacar temperatura -> info[i]["main"]["temp"] 
	  		// sacar previsão de tempo -> info[i]["weather"][0]["main"]

	  	//}



	    //console.log('body:', body);
	  }
	});*/

	https.get(url, (res) => { // <- this is a function that is called when there's a response. Waiting for a response is as easy as writing code inside this function (or use async await)
	  	var body ='';
		res.on('data', function(chunk) {
	  		body += chunk;
		});

		res.on('end', function() {
			body = JSON.parse(body);

			var info = body["list"];

			return info[0]["dt_txt"];

		});

	  

	}).on('error', (e) => { //the https.get function returns a request that can emit an error event. this is an eventlistener for that. try an invalid url to test this branch of your code
	  console.error(e);
	});



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