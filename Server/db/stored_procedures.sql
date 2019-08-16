-- PROCEDURES

DROP PROCEDURE getCities;
DROP PROCEDURE getTopCities;
DROP PROCEDURE getIDFromCity;
DROP PROCEDURE getTopPOIs;
DROP PROCEDURE getRandomCities;
DROP PROCEDURE getPOIsFromCity;
DROP PROCEDURE getPOIsNamesFromCity;
DROP PROCEDURE getPOIsInfoFromCity;
DROP PROCEDURE getNumberOfPOIs;
DROP PROCEDURE getVisitTimes;
DROP PROCEDURE getTripDates;	
DROP PROCEDURE getInfoCity;	
DROP PROCEDURE getInfoPOI;
DROP PROCEDURE getPOIReviews;
DROP PROCEDURE getHotels;
DROP PROCEDURE getPOIsIDFromCity;
DROP PROCEDURE addVisitToTrip;
DROP PROCEDURE getInfoUser;
DROP PROCEDURE setUserInterested;
DROP PROCEDURE unsetUserInterested;
DROP PROCEDURE isUserInterested;
DROP PROCEDURE setFavoriteTrip;
DROP PROCEDURE unfavoriteTrip;
DROP PROCEDURE reviewPOI;
DROP PROCEDURE uploadPOIPhoto;
DROP PROCEDURE getPOIPhotos;
DROP PROCEDURE submitPOI;
DROP PROCEDURE getSubmittedPOIs;
DROP PROCEDURE getSubmittedPOIByID;
DROP PROCEDURE rejectPOI;
DROP PROCEDURE acceptPOI;
DROP PROCEDURE getVisitsFromTrip;
DROP PROCEDURE getCityIDFromTrip;
DROP PROCEDURE getOtherSuggestionsFromTrip;
DROP PROCEDURE getTripReviews;
DROP PROCEDURE getTripStats;
DROP PROCEDURE getSharedTripsFromTrip;
DROP PROCEDURE updateTripViewers;
DROP PROCEDURE createTrip;
DROP PROCEDURE createManualTrip;
DROP PROCEDURE isTripManual;
DROP PROCEDURE getVisitSchedule;
DROP PROCEDURE getUserType;
DROP PROCEDURE getUserTrips;
DROP PROCEDURE getInfoTrip;
DROP PROCEDURE createChildTrip;
DROP PROCEDURE deleteTrip;
DROP PROCEDURE renameTrip;
DROP PROCEDURE shareTrip;
DROP PROCEDURE reviewTrip;
DROP PROCEDURE archiveTrip;
DROP PROCEDURE getOwnerOfTrip;
DROP PROCEDURE getOwnerOfTripManual;
DROP PROCEDURE saveTripManual;
DROP PROCEDURE deleteVisit;
DROP PROCEDURE loginWithGoogle;
DROP PROCEDURE register;
DROP PROCEDURE login;
DROP PROCEDURE editPOIDescription;
DROP PROCEDURE updatePOIPriceLevel;
DROP PROCEDURE updatePOIAddress;
DROP PROCEDURE updatePOIGoogleRating;
DROP PROCEDURE updatePOINumberOfReviews;
DROP PROCEDURE updatePOIPrice;
DROP PROCEDURE updatePOIOpeningHours;
DROP PROCEDURE getCityTrips;

DELIMITER //

# obter o nome de todas as cidades
CREATE PROCEDURE getCities ()
BEGIN
	select name from city order by name asc;
END //

# obter as N cidades com mais itinerarios criados
CREATE PROCEDURE getTopCities (num_results INT)
BEGIN
	select name, count(name) as trips from 
	(select city.name from trip join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on trip.id = visit.trip_id where trip.isActive = 1 group by trip.id) t 
    group by name order by trips desc limit num_results;
END //

# obter o id de uma cidade
CREATE PROCEDURE getIDFromCity (cityName VARCHAR(255))
BEGIN
	select id from city where name like cityName;
END //

# obter os N POIs com mais itinerarios criados
CREATE PROCEDURE getTopPOIs (num_results INT)
BEGIN
	#select id, name, place_id, city, count(name) as trips from 
    #(select distinct poi.id, poi.name, poi.place_id, city.name as city, trip.id as trip from trip join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on trip.id = visit.trip_id where trip.isActive = 1 and poi.isAproved = 1) t 
    #group by name order by trips desc limit num_results;
    
    select poi.id as id, poi.name as name, poi.place_id as place_id, city.name as city, num_reviews as trips from poi join city on poi.city = city.id order by num_reviews desc limit num_results;
END //

# obter N cidades random
CREATE PROCEDURE getRandomCities (num_results INT)
BEGIN
	select name, count(name) as trips from 
    (select city.name from trip join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on trip.id = visit.trip_id where trip.isActive = 1 group by trip.id) t 
    group by name order by rand() limit num_results;
END //

# obter todos os POI de uma determinada cidade
CREATE PROCEDURE getPOIsFromCity (destination VARCHAR(255), query_text VARCHAR(255), tripID INT, sort VARCHAR(255)) 
BEGIN
	DECLARE number_results INT;
    SET number_results = 0;
    
    IF tripID = -1 THEN
		IF query_text = "" THEN
			IF sort = "az" THEN
				SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, photo_poi_tmp.photo_url as photo FROM (poi JOIN city ON poi.city = city.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.isAproved = 1 ORDER BY poi.name ASC;
            ELSEIF sort = "za" THEN
				SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, photo_poi_tmp.photo_url as photo FROM (poi JOIN city ON poi.city = city.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.isAproved = 1 ORDER BY poi.name DESC;
            ELSEIF sort = "rating" THEN
				SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, photo_poi_tmp.photo_url as photo FROM (poi JOIN city ON poi.city = city.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.isAproved = 1 ORDER BY poi.google_rating DESC;
            ELSE
				SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, photo_poi_tmp.photo_url as photo FROM (poi JOIN city ON poi.city = city.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.isAproved = 1 ORDER BY poi.num_reviews DESC;
			END IF;
        ELSE
			SET query_text = CONCAT('%', query_text,'%');
			
			SELECT count(*) INTO number_results FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1;
			
			IF number_results > 0 THEN
				IF sort = "az" THEN
					SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, photo_poi_tmp.photo_url as photo FROM (poi JOIN city ON poi.city = city.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 ORDER BY poi.name ASC;
				ELSEIF sort = "za" THEN
					SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, photo_poi_tmp.photo_url as photo FROM (poi JOIN city ON poi.city = city.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 ORDER BY poi.name DESC;
				ELSEIF sort = "rating" THEN
					SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, photo_poi_tmp.photo_url as photo FROM (poi JOIN city ON poi.city = city.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 ORDER BY poi.google_rating DESC;
				ELSE
					SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, photo_poi_tmp.photo_url as photo FROM (poi JOIN city ON poi.city = city.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 ORDER BY poi.num_reviews DESC;
				END IF;
            ELSE
				SELECT name as city, country FROM city WHERE city.name = destination;
			END IF;
		END IF;
        
	ELSE
		IF query_text = "" THEN
			IF sort = "az" THEN
				SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, visit.start_time as start_time, visit.end_time as end_time, photo_poi_tmp.photo_url as photo FROM (((poi JOIN city ON poi.city = city.id) JOIN visit ON poi.id = visit.poi_id) JOIN trip on visit.trip_id = trip.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.isAproved = 1 AND trip.id = tripID ORDER BY poi.name ASC;
			ELSEIF sort = "za" THEN
				SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, visit.start_time as start_time, visit.end_time as end_time, photo_poi_tmp.photo_url as photo FROM (((poi JOIN city ON poi.city = city.id) JOIN visit ON poi.id = visit.poi_id) JOIN trip on visit.trip_id = trip.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.isAproved = 1 AND trip.id = tripID ORDER BY poi.name DESC;
			ELSEIF sort = "rating" THEN
				SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, visit.start_time as start_time, visit.end_time as end_time, photo_poi_tmp.photo_url as photo FROM (((poi JOIN city ON poi.city = city.id) JOIN visit ON poi.id = visit.poi_id) JOIN trip on visit.trip_id = trip.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.isAproved = 1 AND trip.id = tripID ORDER BY poi.google_rating DESC;
			ELSE
				SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, visit.start_time as start_time, visit.end_time as end_time, photo_poi_tmp.photo_url as photo FROM (((poi JOIN city ON poi.city = city.id) JOIN visit ON poi.id = visit.poi_id) JOIN trip on visit.trip_id = trip.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.isAproved = 1 AND trip.id = tripID ORDER BY poi.num_reviews DESC;
			END IF;
		ELSE
			SET query_text = CONCAT('%', query_text,'%');
			
			SELECT count(*) INTO number_results FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1;
			
			IF number_results > 0 THEN
				IF sort = "az" THEN
					SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, visit.start_time as start_time, visit.end_time as end_time, photo_poi_tmp.photo_url as photo FROM (((poi JOIN city ON poi.city = city.id) JOIN visit ON poi.id = visit.poi_id) JOIN trip on visit.trip_id = trip.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 AND trip.id = tripID ORDER BY poi.name ASC;
				ELSEIF sort = "za" THEN
					SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, visit.start_time as start_time, visit.end_time as end_time, photo_poi_tmp.photo_url as photo FROM (((poi JOIN city ON poi.city = city.id) JOIN visit ON poi.id = visit.poi_id) JOIN trip on visit.trip_id = trip.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 AND trip.id = tripID ORDER BY poi.name DESC;
				ELSEIF sort = "rating" THEN
					SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, visit.start_time as start_time, visit.end_time as end_time, photo_poi_tmp.photo_url as photo FROM (((poi JOIN city ON poi.city = city.id) JOIN visit ON poi.id = visit.poi_id) JOIN trip on visit.trip_id = trip.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 AND trip.id = tripID ORDER BY poi.google_rating DESC;
				ELSE
					SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.num_reviews as num_reviews, poi.price_level as price_level, visit.start_time as start_time, visit.end_time as end_time, photo_poi_tmp.photo_url as photo FROM (((poi JOIN city ON poi.city = city.id) JOIN visit ON poi.id = visit.poi_id) JOIN trip on visit.trip_id = trip.id) left join (SELECT ph1.* FROM photo_poi as ph1 LEFT JOIN photo_poi as ph2 ON ph1.poi_id = ph2.poi_id AND ph1.photo_timestamp > ph2.photo_timestamp WHERE ph2.poi_id IS NULL) as photo_poi_tmp on poi.id = photo_poi_tmp.poi_id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 AND trip.id = tripID ORDER BY poi.num_reviews DESC;
				END IF;
			ELSE
				SELECT name as city, country FROM city WHERE city.name = destination;
			END IF;
		END IF;
	END IF;
END //

# obter o nome de todos os POIs de uma cidade
CREATE PROCEDURE getPOIsNamesFromCity (destination VARCHAR(255))
BEGIN
	SELECT DISTINCT poi.name as name FROM poi JOIN city on poi.city = city.id WHERE city.name = destination ORDER BY poi.name ASC;
END //


# obter a informação de POIs de uma cidade para os modelos
CREATE PROCEDURE getPOIsInfoFromCity (destination VARCHAR(255))
BEGIN
	SELECT DISTINCT poi.id as id, poi.name as name, poi.poi_type as poi_type, poi.latitude as latitude, poi.longitude as longitude, poi.price as price, poi.price_children as price_children, opening_hours, google_rating, num_reviews FROM poi JOIN city on poi.city = city.id WHERE city.name = destination ORDER BY poi.num_reviews DESC;
END //



# obter o numero de resultados da pesquisa de POIs
CREATE PROCEDURE getNumberOfPOIs (destination VARCHAR(255), query_text VARCHAR(255))
BEGIN
	IF query_text = "" THEN
		SELECT count(*) as number_results FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination ORDER BY poi.num_reviews DESC;
	ELSE
		SET query_text = CONCAT('%', query_text,'%');
		SELECT count(*) as number_results FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.name LIKE query_text ORDER BY poi.num_reviews DESC;
	END IF;
END;

# obter uma lista de POI de um tripo com os respetivos horarios
CREATE PROCEDURE getVisitTimes (tripID INT, isManual BIT)
BEGIN
	IF isManual = 1 THEN
		select poi_id, trip.start_date as start_date, trip.end_date as end_date, datediff(trip.end_date, trip.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join trip on trip_id=trip.id where trip_id = tripID and trip.isManual = 1;
	ELSE
		select poi_id, trip.start_date as start_date, trip.end_date as end_date, datediff(trip.end_date, trip.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join trip on trip_id=trip.id where trip_id = tripID and trip.isActive = 1 and visit.isActive = 1;
	END IF;
END //

# obter as datas (inicio e fim) de uma viagem 
CREATE PROCEDURE getTripDates (tripID INT)
BEGIN
	select trip.name as name, trip.start_date as start_date, trip.end_date as end_date, datediff(trip.end_date, trip.start_date) as date_diff, city.name as city from trip join city on trip.city = city.id where trip.id = tripID;
END //

# obter toda a informação de uma cidade
CREATE PROCEDURE getInfoCity (cityName VARCHAR(255))
BEGIN
	SELECT id, name, country, place_id, latitude, longitude, description from city where name like cityName;
END //

# obter toda a informação de um POI
CREATE PROCEDURE getInfoPOI (poiID INT, tripID INT)
BEGIN
	DECLARE num_visits INT;
    
	IF tripID = -1 THEN
		SELECT id, place_id, name as name, description as description, address, latitude, longitude, google_rating, phone_number, website, price, price_children, poi_type, opening_hours, no_trips, rating, accessibility, security, rating_price, duration FROM
		(SELECT * FROM poi where id = poiID) AS A 
		LEFT JOIN
		(SELECT count(*) as no_trips, poi.id as id2 from trip join visit join poi on visit.poi_id = poi.id on trip.id = visit.trip_id where poi.id = poiID) AS B
		ON A.id = B.id2
		LEFT JOIN
		(SELECT avg(review_rating) as rating, avg(review_rating_accessibility) as accessibility, avg(review_rating_security) as security, avg(review_rating_price) as rating_price, avg(review_rating_duration) as duration, poi_id as id3 from review_poi where poi_id = poiID) AS D
		ON A.id = D.id3;
	ELSE
		SELECT count(*) into num_visits FROM poi join (visit join trip on visit.trip_id = trip.id) on poi.id = visit.poi_id where poi.id = poiID AND trip.id = tripID;
		
        IF num_visits > 0 THEN
			SELECT id, place_id, name as name, description as description, address, latitude, longitude, google_rating, phone_number, website, poi_type, opening_hours, start_time as start_time, end_time as end_time, no_trips, rating, accessibility, security, rating_price, duration FROM
			(SELECT poi.id as id, place_id, poi.name as name, poi.description as description, address, latitude, longitude, google_rating, phone_number, website, poi_type, opening_hours, visit.start_time as start_time, visit.end_time as end_time FROM poi join (visit join trip on visit.trip_id = trip.id) on poi.id = visit.poi_id where poi.id = poiID AND trip.id = tripID) AS A 
			LEFT JOIN
			(SELECT count(*) as no_trips, poi.id as id2 from trip join visit join poi on visit.poi_id = poi.id on trip.id = visit.trip_id where poi.id = poiID) AS B
			ON A.id = B.id2
			LEFT JOIN
			(SELECT avg(review_rating) as rating, avg(review_rating_accessibility) as accessibility, avg(review_rating_security) as security, avg(review_rating_price) as rating_price, avg(review_rating_duration) as duration, poi_id as id3 from review_poi where poi_id = poiID) AS D
			ON A.id = D.id3;
		ELSE
			SELECT id, place_id, name, description, address, latitude, longitude, google_rating, phone_number, website, poi_type FROM poi where poi.id = poiID;
        END IF;
	END IF;
END //

# obter todos os reviews feitos de um POI
CREATE PROCEDURE getPOIReviews (poiID INT)
BEGIN
	select user.name as user, user.picture as picture, review_text, review_rating, review_timestamp from review_poi join (review join user on review.user_id = user.id ) on review_poi.review_id = review.id WHERE poi_id = poiID order by review_timestamp desc;
END //


# obter todos os Hoteis de uma cidade
CREATE PROCEDURE getHotels (destination VARCHAR(255)) 
BEGIN
	SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, poi.latitude as latitude, poi.longitude as longitude, poi.price as price FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.poi_type = 'Hotel' ORDER BY poi.num_reviews DESC;
END //


# obter lista com IDs de POI de uma cidade 
CREATE PROCEDURE getPOIsIDFromCity (destination VARCHAR(255))
BEGIN
	select poi.id as poi from poi join city on poi.city = city.id where city.name = destination and poi.num_reviews > 100 and poi.poi_type != 'Hotel' and poi.poi_type != 'Restaurant' and poi.isAproved = 1;
END //

# adicionar visitas a uma viagem
CREATE PROCEDURE addVisitToTrip (tripID INT, poiID INT, visit_start_time DATETIME, visit_end_time DATETIME, isManual BIT)
BEGIN
	IF isManual = 1 THEN
		INSERT INTO Visit (trip_id, poi_id, start_time, end_time, isActive) VALUE (tripID, poiID, visit_start_time, visit_end_time, 0);
    ELSE
		INSERT INTO Visit (trip_id, poi_id, start_time, end_time) VALUE (tripID, poiID, visit_start_time, visit_end_time);
	END IF;
END //

# obter informação sobre um utilizador
CREATE PROCEDURE getInfoUser (userID INT)
BEGIN
	DECLARE isGoogle INT;
	SELECT COUNT(*) INTO isGoogle FROM user_g WHERE user_id = userID;
    
	IF isGoogle = 1 THEN
		SELECT * FROM user JOIN user_g ON user.id = user_g.user_id WHERE user.id = userID;
	ELSE
		SELECT * FROM user JOIN user_e ON user.id = user_e.user_id WHERE user.id = userID;
	END IF;
    
END //

# utilizador está interessado num itinerario
CREATE PROCEDURE setUserInterested (userID INT, tripID INT)
BEGIN
	DECLARE existsColumn INT;
	SELECT COUNT(*) INTO existsColumn FROM user_isinterested_trip WHERE user_id = userID AND trip_id = tripID;
	
    IF existsColumn = 1 THEN
		UPDATE user_isinterested_trip SET isInterested = 1 WHERE user_id = userID AND trip_id = tripID;
	ELSE
		INSERT INTO user_isinterested_trip VALUES (userID, tripID, 1);
	END IF;
    
END //


# utilizador não está interessado num itinerario
CREATE PROCEDURE unsetUserInterested (userID INT, tripID INT)
BEGIN
	DECLARE existsColumn INT;
	SELECT COUNT(*) INTO existsColumn FROM user_isinterested_trip WHERE user_id = userID AND trip_id = tripID;
	
    IF existsColumn = 1 THEN
		UPDATE user_isinterested_trip SET isInterested = 0 WHERE user_id = userID AND trip_id = tripID;
	END IF;
    
END //


# verificar se o utilizador está interessado num itinerario
CREATE PROCEDURE isUserInterested (userID INT, tripID INT)
BEGIN
	DECLARE existsColumn INT;
    DECLARE interested BIT;
	SELECT COUNT(*) INTO existsColumn FROM user_isinterested_trip WHERE user_id = userID AND trip_id = tripID;
	
    IF existsColumn = 1 THEN
		SELECT isInterested INTO interested FROM user_isinterested_trip WHERE user_id = userID AND trip_id = tripID;
        IF interested = b'1' THEN
			SELECT 1 AS isInterested;
		ELSE
			SELECT 0 AS isInterested;
		END IF;
	ELSE
		SELECT 0 AS isInterested;
	END IF;
END //


# tornar itinerario favorito
CREATE PROCEDURE setFavoriteTrip (userID INT, tripID INT)
BEGIN
	DECLARE tripOwner INT;
	SELECT user INTO tripOwner FROM trip WHERE id = tripID;
	
    IF tripOwner = userID THEN
		UPDATE trip SET isFavorite = 1 WHERE id = tripID;
	END IF;
END //

# itinerario deixa de ser favorito
CREATE PROCEDURE unfavoriteTrip (userID INT, tripID INT)
BEGIN
	DECLARE tripOwner INT;
	SELECT user INTO tripOwner FROM trip WHERE id = tripID;
	
    IF tripOwner = userID THEN
		UPDATE trip SET isFavorite = 0 WHERE id = tripID;
	END IF;
    
END //


# adicionar uma review a um POI
CREATE PROCEDURE reviewPOI (userID INT, poiID INT, reviewText TEXT, reviewRating INT, reviewAccess INT, reviewSecurity INT, reviewPrice DECIMAL(10,2), reviewDuration INT)
BEGIN
	DECLARE reviewID INT;
    
	INSERT INTO review (user_id) values (userID);
    SET reviewID = LAST_INSERT_ID();
	
    INSERT INTO review_poi (review_id, poi_id, review_text) VALUES (reviewID, poiID, reviewText);
	
    IF reviewRating is not null THEN
		UPDATE review_poi SET review_rating = reviewRating WHERE review_id = reviewID;
	END IF;
    
	IF reviewAccess is not null THEN
		UPDATE review_poi SET review_rating_accessibility = reviewAccess WHERE review_id = reviewID;
	END IF;
    
     IF reviewSecurity is not null THEN
		UPDATE review_poi SET review_rating_security = reviewSecurity WHERE review_id = reviewID;
	END IF;
    
     IF reviewPrice is not null THEN
		UPDATE review_poi SET review_rating_price = reviewPrice WHERE review_id = reviewID;
	END IF;
    
     IF reviewDuration is not null THEN
		UPDATE review_poi SET review_rating_duration = reviewDuration WHERE review_id = reviewID;
	END IF;
    
END //


# fazer upload de uma foto de um POI
CREATE PROCEDURE uploadPOIPhoto (poiID INT, userID INT, photoURL VARCHAR(255))
BEGIN
	DECLARE isPremium INT;
    SELECT count(*) INTO isPremium FROM user WHERE id = userID AND type_use = 'Premium';
	
    IF isPremium = 1 THEN
		INSERT INTO photo_poi (poi_id, user_id, photo_url) VALUES (poiID, userID, photoURL);
	END IF;
    
END //

# obter as fotos de um POI
CREATE PROCEDURE getPOIPhotos (poiID INT)
BEGIN
	SELECT photo_url FROM photo_poi WHERE poi_id = poiID;
END // 


# submeter um poi
CREATE PROCEDURE submitPOI (poiName VARCHAR(255), poiDescription TEXT, poiLatitude DECIMAL(11,8), poiLongitude DECIMAL(11,8), poiAddress VARCHAR(255), poiType VARCHAR(255), poiWebsite VARCHAR(255), poiPhoneNumber VARCHAR(255), poiCity VARCHAR(255), userID INT, googlePlaceID VARCHAR(255), googleRating DECIMAL(2,1), googleNumberReviews INT)
BEGIN
	DECLARE poiID, cityID INT;
    
    SELECT id into cityID FROM city WHERE name like poiCity;
    
	INSERT INTO poi (name, latitude, longitude, address, poi_type, city, isAproved, submitionUser, place_id, google_rating, num_reviews) values (poiName, poiLatitude, poiLongitude, poiAddress, poiType, cityID, 1, userID, googlePlaceID, googleRating, googleNumberReviews);
    SET poiID = LAST_INSERT_ID();
	
    IF poiDescription is not null THEN
		UPDATE poi SET description = poiDescription WHERE id = poiID;
	END IF;
    
    IF poiWebsite is not null THEN
		UPDATE poi SET website = poiWebsite WHERE id = poiID;
	END IF;
    
    IF poiPhoneNumber is not null THEN
		UPDATE poi SET phone_number = poiPhoneNumber WHERE id = poiID;
	END IF;
    
    SELECT poiID;
    
END //


# obter a lista de POIs para serem avaliados
CREATE PROCEDURE getSubmittedPOIs (userID INT)
BEGIN
	# SELECT * FROM poi where isAproved = 0 and submitionUser != userID;
	SELECT poi.id as id, poi.name as name, photo_url, city.name as city FROM poi join photo_poi on poi.id = photo_poi.poi_id join city on poi.city = city.id where isAproved = 0;
    
END //

# obter um determinado POI para ser avaliado
CREATE PROCEDURE getSubmittedPOIByID (userID INT, poiID INT)
BEGIN
	
    SELECT poi.id as id, poi.name as name, photo_url, city.name as city, poi.latitude as latitude, poi.longitude as longitude, address, poi_type, poi.description as description, website, phone_number FROM poi join photo_poi on poi.id = photo_poi.poi_id join city on poi.city = city.id where isAproved = 0 and poi.id = poiID;
    
END //


# rejeitar um POI submetido
CREATE PROCEDURE rejectPOI (userID INT, poiID INT)
BEGIN
	DECLARE canReject INT;
    SELECT count(*) INTO canReject FROM user WHERE type_use = 'Premium' and id = userID;
	
    IF canReject = 1 THEN
		DELETE FROM poi where id = poiID;
	END IF;
END //


# aceitar um POI submetido
CREATE PROCEDURE acceptPOI (userID INT, poiID INT, googlePlaceID VARCHAR(255), googleRating DECIMAL(2,1), googleNumberReviews INT, poiDescription TEXT, poiWebsite VARCHAR(255), poiPhoneNumber VARCHAR(255))
BEGIN
	DECLARE canAccept INT;
    SELECT count(*) INTO canAccept FROM user WHERE type_use = 'Premium' and id = userID;
	
    IF canAccept = 1 THEN
		#UPDATE poi SET place_id = googlePlaceID, google_rating = googleRating, num_reviews = googleNumberReviews, isAproved = 1 WHERE id = poiID AND submitionUser != userID; esta é a linha correta, mas esta comentada para testes
		UPDATE poi SET place_id = googlePlaceID, google_rating = googleRating, num_reviews = googleNumberReviews, isAproved = 1 WHERE id = poiID;
        
        IF poiDescription is not null THEN
			UPDATE poi SET description = poiDescription WHERE id = poiID;
		END IF;
    
		IF poiWebsite is not null THEN
			UPDATE poi SET website = poiWebsite WHERE id = poiID;
		END IF;
    
		IF poiPhoneNumber is not null THEN
			UPDATE poi SET phone_number = poiPhoneNumber WHERE id = poiID;
		END IF;
    END IF;
    
    SELECT isAproved FROM poi where id = poiID;
    
END //


# obter lista de visitas de um determinado itinerario
CREATE PROCEDURE getVisitsFromTrip (userID INT, tripID INT)
BEGIN
	SELECT * FROM
	(SELECT trip.name as trip_name, trip.user as user, trip.start_date as start_date, trip.end_date as end_date, 
		datediff(trip.end_date, trip.start_date) as date_diff, trip.isPublic as isPublic, trip.num_viewers as num_viewers, trip.travel_mode as travel_mode,
		visit.start_time as start_time, visit.end_time as end_time, visit.poi_id as poi, city.name as city, city.latitude as city_latitude, city.longitude as city_longitude, photo_poi.photo_url as photo
		FROM ((trip JOIN city ON trip.city = city.id) JOIN visit ON trip.id = visit.trip_id) LEFT JOIN photo_poi on visit.poi_id = photo_poi.poi_id
		WHERE trip.id = tripID AND ((trip.isActive = 1 AND visit.isActive = 1) or (trip.isManual = 1)) ORDER BY start_time
    ) AS E
    JOIN
    ( SELECT a.id as id, name, place_id, address, latitude, longitude, website, phone_number, poi_type, no_trips, rating, accessibility, security, rating_price, duration FROM
		(SELECT * FROM poi) AS A 
		LEFT JOIN
		(SELECT count(*) as no_trips, poi.id as id2 from trip join visit join poi on visit.poi_id = poi.id on trip.id = visit.trip_id group by poi.id) AS B
		ON A.id = B.id2
		LEFT JOIN
		(SELECT avg(review_rating) as rating, avg(review_rating_accessibility) as accessibility, avg(review_rating_security) as security, avg(review_rating_price) as rating_price, avg(review_rating_duration) as duration, poi_id as id3 from review_poi group by poi_id) AS D
		ON A.id = D.id3
	) AS F
    ON E.poi = F.id ORDER BY start_time;
END //


# obter a cidade a que pertence um determinado itinerario
CREATE PROCEDURE getCityIDFromTrip (tripID INT)
BEGIN
	SELECT city from trip where id = tripID;
END //

# obter lista de POIs sugeridos que não fazem parte de um determinado itinerario 
CREATE PROCEDURE getOtherSuggestionsFromTrip (tripID INT, cityID INT)
BEGIN
	SELECT id, place_id, name, poi_type from poi where city = cityID and id not in (select poi_id from visit where trip_id = tripID) order by num_reviews desc;
END // 

# obter as reviews de um determinado itinerario
CREATE PROCEDURE getTripReviews (tripID INT)
BEGIN
	select user.name as user, user.picture as picture, review_text, review_rating, review_timestamp from review_trip join (review join user on review.user_id = user.id ) on review_trip.review_id = review.id WHERE trip_id = tripID order by review_timestamp desc;
END //


# obter as estatísticas de um determinado itinerario
CREATE PROCEDURE getTripStats (tripID INT)
BEGIN
    select avg(review_rating) as rating, count(*) as num_reviews from review_trip where trip_id = tripID;
END //

# obter as estatísticas de um determinado itinerario
CREATE PROCEDURE getSharedTripsFromTrip (tripID INT)
BEGIN
    select count(*) as num_trips from trip where parent_trip = tripID;
END //


# atualizar o numero de utilizadores que visitaram um itinerario
CREATE PROCEDURE updateTripViewers (tripID INT)
BEGIN
	UPDATE trip SET num_viewers = num_viewers + 1 WHERE id = tripID;
END //

# criar um itinerario
CREATE PROCEDURE createTrip (destination VARCHAR(255), arrival DATE, departure DATE, userID INT, numAdults INT, numChildren INT, tripCategory VARCHAR(255), travelMode VARCHAR(255))
BEGIN
	declare cityID INT;
	declare tripID INT;
    
    SELECT id INTO cityID FROM city WHERE name = destination;
		
    INSERT INTO trip (start_date, end_date, user, city, num_adults, num_children, category, travel_mode) VALUES (arrival, departure, userID, cityID, numAdults, numChildren, tripCategory, travelMode);
	SET tripID = LAST_INSERT_ID();
    SELECT tripID;
END //

# criar um itinerario manualmente
CREATE PROCEDURE createManualTrip (destination VARCHAR(255), arrival DATE, departure DATE, userID INT)
BEGIN
	declare cityID INT;
	declare tripID INT;
    
    SELECT id INTO cityID FROM city WHERE name = destination;
		
    INSERT INTO trip (start_date, end_date, user, isActive, city, isManual) VALUES (arrival, departure, userID, 0, cityID, 1);
	SET tripID = LAST_INSERT_ID();
    SELECT tripID;
END //

# verificar se um itinerario é manual ou automatico
CREATE PROCEDURE isTripManual (tripID INT)
BEGIN
	SELECT isManual FROM trip WHERE id = tripID;
END //

# obter o horario de uma determinada visita
CREATE PROCEDURE getVisitSchedule (poiID INT, tripID INT, userID INT)
BEGIN
	SELECT start_time, end_time FROM visit join trip on visit.trip_id = trip.id WHERE visit.poi_id = poiID AND trip.id = tripID AND trip.user = userID;
END //

# obter o tipo de utilizador 
CREATE PROCEDURE getUserType (userID INT)
BEGIN
	SELECT type_use FROM user WHERE id = userID;
END //

# obter os itinerarios de um utilizador
CREATE PROCEDURE getUserTrips (userID INT)
BEGIN
	SELECT DISTINCT trip.name as name, city.name as city, trip.start_date as start, trip.end_date as end, trip.id as trip_id, trip.isPublic as isPublic, trip.photo as photo, trip.isFavorite as isFavorite from trip join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on trip.id = visit.trip_id where trip.user = userID and trip.isActive = 1 and trip.isArchived = 0;
END //

# obter dados do itinerario para criar um novo itinerario a partir desse
CREATE PROCEDURE getInfoTrip (tripID INT)
BEGIN
	SELECT city, poi_id, start_time, end_time, user from trip join visit on trip.id = visit.trip_id where trip_id = tripID;
END //

# criar um itinerario a partir de um outro
CREATE PROCEDURE createChildTrip (arrival DATE, departure DATE, userID INT, cityID INT, parenttripID INT)
BEGIN
	declare tripID INT;

	INSERT INTO trip (start_date, end_date, user, city, parent_trip) values (arrival, departure, userID, cityID, parenttripID);
    SET tripID = LAST_INSERT_ID();
    SELECT tripID;
END //

# apagar um itinerario
CREATE PROCEDURE deleteTrip (tripID INT, userID INT)
BEGIN
	UPDATE trip SET isActive = 0 where id = tripID and user = userID;
END //

# mudar o nome de um itinerario
CREATE PROCEDURE renameTrip (tripID INT, userID INT, tripName VARCHAR(255))
BEGIN
	UPDATE trip SET name = tripName where id = tripID and user = userID;
END //

# partilhar o itinerario (tornar o itinerario publico)
CREATE PROCEDURE shareTrip (tripID INT, userID INT, tripDescription VARCHAR(255), tripPhotoURL VARCHAR(255), tripRating INT)
BEGIN 
	DECLARE reviewID INT;
    
	UPDATE trip SET isPublic = 1, photo = tripPhotoURL, description = tripDescription where id = tripID and user = userID and isActive = 1 and isPublic = 0;
	
    INSERT INTO review (user_id) values (userID);
	SET reviewID = LAST_INSERT_ID();
    
    INSERT INTO review_trip(review_id, trip_id, review_text, review_rating) values (reviewID, tripID, tripDescription, tripRating);
END //	


# fazer uma review a um itinerario
CREATE PROCEDURE reviewTrip (tripID INT, userID INT, reviewRating INT, reviewText TEXT)
BEGIN 
	DECLARE reviewID INT;
    
    INSERT INTO review (user_id) values (userID);
	SET reviewID = LAST_INSERT_ID();
    
    IF reviewText is not null THEN
		INSERT INTO review_trip (review_id, trip_id, review_text, review_rating) values (reviewID, tripID, reviewText, reviewRating);
    ELSE
		INSERT INTO review_trip (review_id, trip_id, review_rating) values (reviewID, tripID, reviewRating);
    END IF;

END //	

# arquivar um itinerario
CREATE PROCEDURE archiveTrip (tripID INT, userID INT)
BEGIN
	UPDATE trip SET isArchived = 1, isPublic = 0 where id = tripID and user = userID;
END //

# obter o criador de um itinerario
CREATE PROCEDURE getOwnerOfTrip (tripID INT)
BEGIN
	SELECT user FROM trip where id = tripID;
END //


# obter o criador de um itinerario manual
CREATE PROCEDURE getOwnerOfTripManual (tripID INT)
BEGIN
	SELECT user FROM trip where id = tripID and isManual = 1;
END //

# guardar um itinerario manual
CREATE PROCEDURE saveTripManual (tripID INT)
BEGIN
	UPDATE trip SET isActive = 1, isManual = 0 where id = tripID and isManual = 1;
	UPDATE visit SET isActive = 1 where trip_id = tripID;
END //

# apagar uma visita
CREATE PROCEDURE deleteVisit (tripID INT, poiID INT, isManual BIT)
BEGIN
	IF isManual = 1 THEN
		DELETE from visit where trip_id = tripID and poi_id = poiID;
	ELSE
		UPDATE visit set isActive = 0 where trip_id = tripID and poi_id = poiID;
	END IF;
END //

# login com o Google
CREATE PROCEDURE loginWithGoogle (googleID VARCHAR(255), userName VARCHAR(255), user_Name VARCHAR(255), userPhoto VARCHAR(255))
BEGIN
	DECLARE hasGoogleAccount INT;
	DECLARE hasAccount INT;
    DECLARE userID INT;
    
    SELECT count(*) INTO hasGoogleAccount from user_g where google_id = googleID;
    SELECT count(*) INTO hasAccount from user where username = userName;
    
    IF hasGoogleAccount = 1 THEN
		SELECT id, picture from user join user_g on user.id = user_g.user_id where google_id = googleID;
	ELSEIF hasAccount = 1 THEN
		SELECT 1 as error;
    ELSE
		START TRANSACTION;
			BEGIN
				INSERT INTO user (username, name, picture) values (userName, user_Name, userPhoto);
				SET userID = LAST_INSERT_ID();
				INSERT INTO user_g (user_id, google_id) values (userID, googleID);
				SELECT id, picture from user where id = userID;
			COMMIT;
		END;
	END IF;
END //


# registar um utilizador
CREATE PROCEDURE register (userName VARCHAR(255), user_Name VARCHAR(255), userPhoto VARCHAR(255), userBirthday DATE, userGender CHAR, userCountry VARCHAR(255), userPhone INT, userPassword BINARY(128))
BEGIN
	DECLARE hasAccount INT;
    DECLARE userID INT;
    
    SELECT count(*) INTO hasAccount from user where username = userName;
    
    IF hasAccount = 1 THEN
		SELECT 1 as error;
    ELSE
		START TRANSACTION;
			BEGIN
				IF userPhoto is not null THEN
					INSERT INTO user (username, name, picture) values (userName, user_Name, userPhoto);
					SET userID = LAST_INSERT_ID();
				ELSE
					INSERT INTO user (username, name) values (userName, user_Name);
					SET userID = LAST_INSERT_ID();
				END IF;
                    
                INSERT INTO user_e (user_id, gender, password) values (userID, userGender, userPassword);

				IF userBirthday is not null THEN
					UPDATE user_e SET birthday = userBirthday WHERE user_id = userID;
				END IF;
                
                IF userBirthday is not null THEN
					UPDATE user_e SET birthday = userBirthday WHERE user_id = userID;
				END IF;
                
                IF userCountry is not null THEN
					UPDATE user_e SET country = userCountry WHERE user_id = userID;
				END IF;
                
                IF userPhone is not null THEN
					UPDATE user_e SET phone_number = userPhone WHERE user_id = userID;
				END IF;
                
                SELECT id, picture from user where id = userID;
                
			COMMIT;
		END;
	END IF;
END //

# login
CREATE PROCEDURE login (userName VARCHAR(255))
BEGIN
	select id, picture, CAST(password AS CHAR(32) CHARACTER SET utf8) as password from user_e join user on user_e.user_id = user.id where username = userName;
END //

# editar a descrição de um POI
CREATE PROCEDURE editPOIDescription (userID INT, poiID INT, poiDescription TEXT)
BEGIN
	DECLARE typeUse VARCHAR(255);
    SELECT type_use INTO typeUse FROM user where id = userID;
    
    IF typeUse = 'Premium' THEN
		UPDATE poi set description = poiDescription where id = poiID;
	END IF;
END //


# editar o nivel de preço de um POI (1 a 5)
CREATE PROCEDURE updatePOIPriceLevel (poiID INT, poiPriceLevel INT)
BEGIN
	DECLARE priceLevel INT;
    SELECT price_level INTO priceLevel FROM poi where id = poiID;
    
    IF priceLevel != poiPriceLevel THEN
		UPDATE poi set price_level = poiPriceLevel where id = poiID;
        SELECT 1 as result;
	ELSE
        SELECT 0 as result;
	END IF;
END //

# editar o endereço de um POI
CREATE PROCEDURE updatePOIAddress (poiID INT, poiAddress VARCHAR(255))
BEGIN
	DECLARE poi_address VARCHAR(255);
    SELECT address INTO poi_address FROM poi where id = poiID;
    
    IF poi_address != poiAddress THEN
		UPDATE poi set address = poiAddress where id = poiID;
        SELECT 1 as result;
	ELSE
        SELECT 0 as result;
	END IF;
END //

# editar o rating do Google de um POI
CREATE PROCEDURE updatePOIGoogleRating (poiID INT, poiGoogleRating VARCHAR(255))
BEGIN
	DECLARE poi_google_rating VARCHAR(255);
    SELECT google_rating INTO poi_google_rating FROM poi where id = poiID;
    
    IF poi_google_rating != poiGoogleRating THEN
		UPDATE poi set google_rating = poiGoogleRating where id = poiID;
        SELECT 1 as result;
	ELSE
        SELECT 0 as result;
	END IF;
END //

# editar o numero de reviews de um POI
CREATE PROCEDURE updatePOINumberOfReviews (poiID INT, poiNumReviews VARCHAR(255))
BEGIN
	DECLARE poi_num_reviews VARCHAR(255);
    SELECT num_reviews INTO poi_num_reviews FROM poi where id = poiID;
    
    IF poi_num_reviews != poiNumReviews THEN
		UPDATE poi set num_reviews = poiNumReviews where id = poiID;
        SELECT 1 as result;
	ELSE
        SELECT 0 as result;
	END IF;
END //


# editar o preço de um POI (para adultos e crianças)
CREATE PROCEDURE updatePOIPrice (poiID INT, priceAdults DECIMAL(10,2), priceChildren DECIMAL(10,2))
BEGIN
    IF priceAdults is not null THEN
		UPDATE poi set price = priceAdults where id = poiID;
	END IF;
    
    IF priceChildren is not null THEN
		UPDATE poi set price_children = priceChildren where id = poiID;
	END IF;
    
END //


# editar os horarios de um POI
CREATE PROCEDURE updatePOIOpeningHours (poiID INT, openingHoursText TEXT)
BEGIN
    DECLARE poi_opening_hours TEXT;
    SELECT opening_hours INTO poi_opening_hours FROM poi where id = poiID;
    
    IF poi_opening_hours is null || poi_opening_hours != openingHoursText THEN
		UPDATE poi set opening_hours = openingHoursText where id = poiID;
        SELECT 1 as result;
	ELSE
        SELECT 0 as result;
	END IF;
    
END //


# obter itinerarios publicos de uma cidade
CREATE PROCEDURE getCityTrips (cityID INT)
BEGIN
	SELECT trip.id as id, trip.name as name, trip.description as description, photo, city.name as city FROM trip join city on trip.city = city.id where city = cityID AND isPublic = 1 AND isArchived = 0;
END //



DELIMITER ;
