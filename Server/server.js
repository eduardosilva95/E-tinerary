var express = require("express");
var app     = express();
var path    = require("path");
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var mysql = require('mysql');
var http = require('http');
var url = require('url');

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

//put your static files (js, css, images) into /public directory
app.use(express.static(path.join(__dirname, 'dist')));


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

        var sql = "select name, count(name) as plans from ( select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id group by plan.id) t group by name order by plans desc limit 4"

        con.query(sql, function (err, result, fields) {
        	if (err) throw err;

        	var top_dest = [];
        	for(var i=0; i<result.length;i++){
        		var dest = new Object();
        		dest.name = result[i].name;
        		dest.plans = result[i].plans;
        		top_dest.push(dest);
        	}

        	var sql2 = "select id, name, place_id, count(name) as plans from ( select poi.id, poi.name, poi.place_id from plan join (visit join poi on visit.poi_id = poi.id) on plan.id = visit.plan_id) t group by name order by plans desc limit 4"

        	con.query(sql2, function (err, result, fields) {
	        	if (err) throw err;

	        	var top_places = [];
	        	for(var i=0; i<result.length;i++){
	        		var place = new Object();
	        		place.id = result[i].id;
	        		place.place_id = result[i].place_id;
	        		place.name = result[i].name;
	        		place.plans = result[i].plans;
	        		top_places.push(place);
	        	}

	        	var sql3 = "select name, count(name) as plans from ( select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id group by plan.id) t group by name order by rand() limit 4"

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
  res.render(path.join(__dirname+'/templates/search.html'), );
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

	        		var sql_2 = "select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff from visit join plan on plan_id=plan.id where plan_id = ?";
	        		var parameters_3 = [planId];

	        		con.query(sql_2, parameters_3, function (err, result, fields) {
	        			if (err) throw err;

	        			var start_date = "n/a";
				        var end_date = "n/a";
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

				        	days = getPlanDays(start_date_aux, parseInt(date_diff));

				        }

	        			var list_places_plan = [];

	        			for(var i =0 ; i < result.length; i++){

				        	list_places_plan.push(result[i].poi_id);
				        }

				        console.log(city);

				        res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, city: city, country: country, number_results: count, fromPlan: true, visits: list_places_plan, days: days});

	        		});

	        	}


	        	else {

					res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, city: city, country: country, number_results: count, fromPlan: false});

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

	        		var sql_2 = "select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff from visit join plan on plan_id=plan.id where plan_id = ?";
	        		var parameters_3 = [planId];

	        		con.query(sql_2, parameters_3, function (err, result, fields) {
	        			if (err) throw err;

	        			var start_date = "n/a";
				        var end_date = "n/a";
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

				        	days = getPlanDays(start_date_aux, parseInt(date_diff));

				        }

	        			var list_places_plan = [];

	        			for(var i =0 ; i < result.length; i++){

				        	list_places_plan.push(result[i].poi_id);
				        }


				        res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, city: city, country: country, number_results: count, fromPlan: true, visits: list_places_plan, days: days});

	        		});

	        	}


	        	else {

					res.render(path.join(__dirname+'/templates/places.html'), {places: list_places, city: city, country: country, number_results: count, fromPlan: false});

				}

	        });

		});

	}
});


app.get('/place', function(req,res){  	
	
	var place_id = req.query['id'];

	var planId = -1;

	if(req.query['plan'] != undefined){
		planId = req.query['plan'];
	}

	if(planId == -1){

 		var sql = "SELECT * from poi WHERE id = ?";

		con.query(sql, place_id, function (err, result, fields) {
		    if (err) throw err;
		    var string=JSON.stringify(result);

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

			res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, description: description, address: address, lat: lat, lon: lon, rating: rating, phone_number: phone_number, website: website, type: type, fromPlan: false});

		});

	}

	else{

		promise.createConnection({
	    host: 'localhost',
	    user: 'root',
	    password: 'password',
	    database: 'placesdb'

		}).then(function(conn){
			var sql = "select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff from visit join plan on plan_id=plan.id where plan_id = ?";
			var values = [planId];
		    var result = conn.query(sql, [values]);

		    conn.end();

		    return result;
		}).then(function(result){

			var start_date = "n/a";
	        var end_date = "n/a";
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

	        	days = getPlanDays(start_date_aux, parseInt(date_diff));

	        }


		    var list_places_plan = [];

			for(var i =0 ; i < result.length; i++){

	        	list_places_plan.push(result[i].poi_id);
	        }

	        var inPlan = false;

	        if (list_places_plan.includes(parseInt(place_id))){
	        	inPlan = true;
	        }


			var sql = "SELECT * from poi WHERE id = ?";

			con.query(sql, place_id, function (err, result, fields) {
			    if (err) throw err;
			    var string=JSON.stringify(result);

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

				res.render(path.join(__dirname+'/templates/place.html'), {place_id: place_id, place: name, description: description, address: address, lat: lat, lon: lon, rating: rating, phone_number: phone_number, website: website, type: type, fromPlan: true, inPlan: inPlan, days: days});

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
        		

				res.render(path.join(__dirname+'/templates/hotels.html'), {places: list_places, city: city, country: country, number_results: count});

	        });

		});

	}

	else{

		destination = req.query['dest'];

		var sql = "SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = ? AND poi.poi_type = 'Hotel' ORDER BY poi.num_reviews DESC LIMIT ?, ?";
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
        		

				res.render(path.join(__dirname+'/templates/hotels.html'), {places: list_places, city: city, country: country, number_results: count});

	        });

		});

	}
});

app.get('/search-restaurants',function(req,res){  
  con.query("SELECT name FROM City", function (err, result, fields) {
        if (err) throw err;
        var string=JSON.stringify(result);
        var list_cities = []
        for(var i =0 ; i < result.length; i++){
        	list_cities.push(result[i].name);
        }
        res.render(path.join(__dirname+'/templates/search-restaurants.html'), {cities: list_cities});
    });
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

/*
app.get('/create-plan',function(req,res){  
  res.render(path.join(__dirname+'/templates/create-plan-manual.html'), );
});
*/

app.post('/create-plan', function(req, res){
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
		var sql = "insert into Plan (start_date, end_date, user) VALUES ?";
		var values = [
	    	[arrival.split('/')[2] + "-" + (arrival.split('/')[1]<10?'0':'') + arrival.split('/')[1] + "-" + (arrival.split('/')[0]<10?'0':'') + arrival.split('/')[0], 
	    	departure.split('/')[2] + "-" + (departure.split('/')[1]<10?'0':'') + departure.split('/')[1] + "-" + (departure.split('/')[0]<10?'0':'') + departure.split('/')[0],
	    	user_id], 
	  	];
	    var result = conn.query(sql, [values]);
	    conn.end();

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

	        while(i < start_time_list.length){
	        	
	        	var poi = result[parseInt(Math.floor((Math.random() * result.length-1) + 1))].poi;

		        sql2= "insert into Visit VALUES ?";
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



app.get('/map',function(req,res){  
  res.render(path.join(__dirname+'/templates/map.html'), );
});

app.get('/plan', function(req,res){
	if(req.query['id'] != undefined){

		var plan_id = req.query['id'];

		var sql = "select plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time, weather, poi.name as name, poi.id as id, city.name as city, place_id, website, phone_number, address, poi_type, poi.latitude as latitude, poi.longitude as longitude from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.id = ?";
		var parameters = [plan_id];

		var view_method = req.query['v'];

		if(view_method == 'full'){
			con.query(sql, parameters, function (err, result, fields) {
		        if (err) throw err;

		        var start_date = "n/a";
		        var end_date = "n/a";
		        var city = ""; 
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
					var sql = "select distinct poi.city from visit join poi on visit.poi_id = poi.id where visit.plan_id = ?";
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

					        res.render(path.join(__dirname+'/templates/full-plan.html'), {plan_id: plan_id, plan: plan, start_date: start_date, end_date: end_date, city: city, days: days, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels});

				        });

	        		});
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
					var sql = "select distinct poi.city from visit join poi on visit.poi_id = poi.id where visit.plan_id = ?";
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

					        res.render(path.join(__dirname+'/templates/map.html'), {plan_id: plan_id, plan: plan, start_date: start_date, end_date: end_date, city: city, days: days, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels});

				        });

	        		});
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
					var sql = "select distinct poi.city from visit join poi on visit.poi_id = poi.id where visit.plan_id = ?";
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

				        var sql3 = "select id, place_id, name from poi where city = ? and poi_type = 'Hotel' and id not in (select poi_id from visit where plan_id = ?) order by num_reviews desc";
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

					        res.render(path.join(__dirname+'/templates/plan.html'), {plan_id: plan_id, plan: plan, start_date: start_date, end_date: end_date, city: city, days: days, suggested_visits: suggested_visits, suggested_hotels: suggested_hotels});

				        });

	        		});
				});
       	
	    	});
		}

	}
	
});



app.get('/calendar', function(req, res){
	res.render(path.join(__dirname+'/templates/calendar.html'),);
});





app.get('/trips', function(req, res){

	if(req.query['id'] != undefined){

		var user_id = req.query['id'];

		var sql = "select distinct city.name as city, plan.start_date as start, plan.end_date as end, plan.id as plan_id from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.user = ?";
		var parameters = [user_id];

		con.query(sql, parameters, function (err, result, fields) {
	        if (err) throw err;

	        var scheduled_trips = [];
	        var past_trips = [];

	        for(var i=0 ; i < result.length; i++){
	        	var plan = new Object();
	        	plan["id"] = result[i].plan_id;
	        	plan["city"] = result[i].city;

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

	        	if(end_date < now){
	        		past_trips.push(plan);
	        	}

	        	else{
	        		scheduled_trips.push(plan);
	        	}
	        }

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



app.get('/register', function(req, res){
	res.render(path.join(__dirname+'/templates/register.html'),);
});


app.post('/register', function(req, res){

	console.log(req.body);

	res.render(path.join(__dirname+'/templates/register.html'),);

});




app.get('/recover', function(req, res){
	res.render(path.join(__dirname+'/templates/recover-password.html'),);
});


app.get('/calendar', function(req, res){
	res.render(path.join(__dirname+'/templates/under-construction.html'), );
});

app.get('/about-us', function(req, res){
	res.render(path.join(__dirname+'/templates/under-construction.html'), );
});

app.get('/help', function(req, res){
	res.render(path.join(__dirname+'/templates/under-construction.html'), );
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

		else if(!is31daysMonth && next_day > 30){
			next_day = 1;
			next_month = parseInt(month) + 1;
		}

		else if(is31daysMonth && next_day > 31){
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
