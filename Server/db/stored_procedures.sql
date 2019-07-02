-- PROCEDURES

DROP PROCEDURE getCities;
DROP PROCEDURE getTopCities;
DROP PROCEDURE getIDFromCity;
DROP PROCEDURE getTopPOIs;
DROP PROCEDURE getRandomCities;
DROP PROCEDURE getPOIsFromCity;
DROP PROCEDURE getNumberOfPOIs;
DROP PROCEDURE getVisitTimes;
DROP PROCEDURE getPlanDates;
DROP PROCEDURE getInfoPOI;
DROP PROCEDURE Get_POI_Reviews;
DROP PROCEDURE Get_Hotels;
DROP PROCEDURE getPOIsIDFromCity;
DROP PROCEDURE addVisitToPlan;
DROP PROCEDURE Get_Info_User;
DROP PROCEDURE User_IsInterested;
DROP PROCEDURE User_IsNotInterested;
DROP PROCEDURE isUserInterested;
DROP PROCEDURE setFavoritePlan;
DROP PROCEDURE unfavoritePlan;
DROP PROCEDURE reviewPOI;
DROP PROCEDURE uploadPOIPhoto;
DROP PROCEDURE getPOIPhotos;
DROP PROCEDURE submitPOI;
DROP PROCEDURE getSubmittedPOIs;
DROP PROCEDURE getSubmittedPOIByID;
DROP PROCEDURE rejectPOI;
DROP PROCEDURE acceptPOI;
DROP PROCEDURE getVisitsFromPlan;
DROP PROCEDURE getCityIDFromPlan;
DROP PROCEDURE getOtherSuggestionsFromPlan;
DROP PROCEDURE getPlanReviews;
DROP PROCEDURE getPlanStats;
DROP PROCEDURE getSharedPlansFromPlan;
DROP PROCEDURE updatePlanViewers;
DROP PROCEDURE createPlan;
DROP PROCEDURE isPlanManual;
DROP PROCEDURE getVisitSchedule;

DELIMITER //

# obter o nome de todas as cidades
CREATE PROCEDURE getCities ()
BEGIN
	select name from city order by name asc;
END //

# obter as N cidades com mais planos criados
CREATE PROCEDURE getTopCities (num_results INT)
BEGIN
	select name, count(name) as plans from 
	(select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 group by plan.id) t 
    group by name order by plans desc limit num_results;
END //

# obter o id de uma cidade
CREATE PROCEDURE getIDFromCity (cityName VARCHAR(255))
BEGIN
	select id from city where name like cityName;
END //

# obter os N POIs com mais planos criados
CREATE PROCEDURE getTopPOIs (num_results INT)
BEGIN
	select id, name, place_id, city, count(name) as plans from 
    (select distinct poi.id, poi.name, poi.place_id, city.name as city, plan.id as plan from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 and poi.isAproved = 1) t 
    group by name order by plans desc limit num_results;
END //

# obter N cidades random
CREATE PROCEDURE getRandomCities (num_results INT)
BEGIN
	select name, count(name) as plans from 
    (select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 group by plan.id) t 
    group by name order by rand() limit num_results;
END //

# obter todos os POI de uma determinada cidade
# TO DO: tentar retornar também o número de resultados
CREATE PROCEDURE getPOIsFromCity (destination VARCHAR(255), query_text VARCHAR(255), limit_inf INT, total_results INT, planID INT) 
BEGIN
	DECLARE number_results INT;
    SET number_results = 0;
    
    IF planID = -1 THEN
		IF query_text = "" THEN
			SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.isAproved = 1 ORDER BY poi.num_reviews DESC LIMIT limit_inf, total_results;
		ELSE
			SET query_text = CONCAT('%', query_text,'%');
			
			SELECT count(*) INTO number_results FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 ORDER BY poi.num_reviews DESC LIMIT limit_inf, total_results;
			
			IF number_results > 0 THEN
				SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 ORDER BY poi.num_reviews DESC LIMIT limit_inf, total_results;
			ELSE
				SELECT name, country FROM city WHERE city.name = destination;
			END IF;
		END IF;
        
	ELSE
		IF query_text = "" THEN
			SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, visit.start_time as start_time FROM ((poi JOIN city ON poi.city = city.id) JOIN visit ON poi.id = visit.poi_id) JOIN plan on visit.plan_id = plan.id WHERE city.name = destination AND poi.isAproved = 1 AND plan.id = planID ORDER BY poi.num_reviews DESC LIMIT limit_inf, total_results;
		ELSE
			SET query_text = CONCAT('%', query_text,'%');
			
			SELECT count(*) INTO number_results FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 ORDER BY poi.num_reviews DESC LIMIT limit_inf, total_results;
			
			IF number_results > 0 THEN
				SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.google_rating AS rating, poi.poi_type AS poi_type, poi.description as description, visit.start_time as start_time FROM ((poi JOIN city ON poi.city = city.id) JOIN visit ON poi.id = visit.poi_id) JOIN plan on visit.plan_id = plan.id WHERE city.name = destination AND poi.name LIKE query_text AND poi.isAproved = 1 AND plan.id = planID ORDER BY poi.num_reviews DESC LIMIT limit_inf, total_results;
			ELSE
				SELECT name, country FROM city WHERE city.name = destination;
			END IF;
		END IF;
	END IF;
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

# obter uma lista de POI de um plano com os respetivos horarios
CREATE PROCEDURE getVisitTimes (planID INT, isManual BIT)
BEGIN
	IF isManual = 1 THEN
		select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join plan on plan_id=plan.id where plan_id = planID and plan.isManual = 1;
	ELSE
		select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join plan on plan_id=plan.id where plan_id = planID and plan.isActive = 1 and visit.isActive = 1;
	END IF;
END //

# obter as datas (inicio e fim) de um plano 
CREATE PROCEDURE getPlanDates (planID INT)
BEGIN
	select plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff from plan where id = planID;
END //

# obter toda a informação de um POI
CREATE PROCEDURE getInfoPOI (poiID INT)
BEGIN
	SELECT * FROM
	(SELECT * FROM poi where id = poiID) AS A 
	LEFT JOIN
	(SELECT count(*) as no_plans, poi.id as id2 from plan join visit join poi on visit.poi_id = poi.id on plan.id = visit.plan_id where poi.id = poiID) AS B
	ON A.id = B.id2
	LEFT JOIN
	(SELECT avg(review_rating) as rating, avg(review_rating_accessibility) as accessibility, avg(review_rating_security) as security, avg(review_rating_price) as price, avg(review_rating_duration) as duration, poi_id as id3 from review_poi where poi_id = poiID) AS D
	ON A.id = D.id3;
END //

# obter todos os reviews feitos de um POI
CREATE PROCEDURE Get_POI_Reviews (poiID INT)
BEGIN
	select user.name as user, user.picture as picture, review_text, review_rating, review_timestamp from review_poi join (review join user on review.user_id = user.id ) on review_poi.review_id = review.id WHERE poi_id = poiID order by review_timestamp desc;
END //


# obter todos os Hoteis de uma cidade
CREATE PROCEDURE Get_Hotels (destination VARCHAR(255), query_text VARCHAR(255), limit_inf INT, total_results INT) 
BEGIN
	IF query_text = "" THEN
		SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.poi_type = 'Hotel' ORDER BY poi.num_reviews DESC LIMIT limit_inf, total_results;
	ELSE
		SET query_text = CONCAT('%', query_text,'%');
		SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.poi_type = 'Hotel' AND poi.name LIKE query_text ORDER BY poi.num_reviews DESC LIMIT limit_inf, total_results;
	END IF;
END //


# obter lista com IDs de POI de uma cidade 
CREATE PROCEDURE getPOIsIDFromCity (destination VARCHAR(255))
BEGIN
	select poi.id as poi from poi join city on poi.city = city.id where city.name = destination and poi.num_reviews > 100 and poi.poi_type != 'Hotel' and poi.poi_type != 'Restaurant' and poi.isAproved = 1;
END //

# adicionar visitas a um plano
CREATE PROCEDURE addVisitToPlan (planID INT, poiID INT, visit_start_time DATETIME, visit_end_time DATETIME)
BEGIN
	INSERT INTO Visit (plan_id, poi_id, start_time, end_time) VALUE (planID, poiID, visit_start_time, visit_end_time);
END //

# obter informação sobre um utilizador
CREATE PROCEDURE Get_Info_User (userID INT)
BEGIN
	DECLARE isGoogle INT;
	SELECT COUNT(*) INTO isGoogle FROM user_g WHERE user_id = userID;
    
	IF isGoogle = 1 THEN
		SELECT * FROM user JOIN user_g ON user.id = user_g.user_id WHERE user.id = userID;
	ELSE
		SELECT * FROM user JOIN user_e ON user.id = user_e.user_id WHERE user.id = userID;
	END IF;
    
END //

# utilizador está interessado num plano
CREATE PROCEDURE User_IsInterested (userID INT, planID INT)
BEGIN
	DECLARE existsColumn INT;
	SELECT COUNT(*) INTO existsColumn FROM user_isinterested_plan WHERE user_id = userID AND plan_id = planID;
	
    IF existsColumn = 1 THEN
		UPDATE user_isinterested_plan SET isInterested = 1 WHERE user_id = userID AND plan_id = planID;
	ELSE
		INSERT INTO user_isinterested_plan VALUES (userID, planID, 1);
	END IF;
    
END //


# utilizador não está interessado num plano
CREATE PROCEDURE User_IsNotInterested (userID INT, planID INT)
BEGIN
	DECLARE existsColumn INT;
	SELECT COUNT(*) INTO existsColumn FROM user_isinterested_plan WHERE user_id = userID AND plan_id = planID;
	
    IF existsColumn = 1 THEN
		UPDATE user_isinterested_plan SET isInterested = 0 WHERE user_id = userID AND plan_id = planID;
	END IF;
    
END //


# verificar se o utilizador está interessado num plano
CREATE PROCEDURE isUserInterested (userID INT, planID INT)
BEGIN
	DECLARE existsColumn INT;
    DECLARE interested BIT;
	SELECT COUNT(*) INTO existsColumn FROM user_isinterested_plan WHERE user_id = userID AND plan_id = planID;
	
    IF existsColumn = 1 THEN
		SELECT isInterested INTO interested FROM user_isinterested_plan WHERE user_id = userID AND plan_id = planID;
        IF interested = b'1' THEN
			SELECT 1 AS isInterested;
		ELSE
			SELECT 0 AS isInterested;
		END IF;
	ELSE
		SELECT 0 AS isInterested;
	END IF;
END //


# tornar plano favorito
CREATE PROCEDURE setFavoritePlan (userID INT, planID INT)
BEGIN
	DECLARE planOwner INT;
	SELECT user INTO planOwner FROM plan WHERE id = planID;
	
    IF planOwner = userID THEN
		UPDATE plan SET isFavorite = 1 WHERE id = planID;
	END IF;
END //

# plano deixa de ser favorito
CREATE PROCEDURE unfavoritePlan (userID INT, planID INT)
BEGIN
	DECLARE planOwner INT;
	SELECT user INTO planOwner FROM plan WHERE id = planID;
	
    IF planOwner = userID THEN
		UPDATE plan SET isFavorite = 0 WHERE id = planID;
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


# submeter um poi para ser avaliado
CREATE PROCEDURE submitPOI (poiName VARCHAR(255), poiDescription TEXT, poiLatitude DECIMAL(11,8), poiLongitude DECIMAL(11,8), poiAddress VARCHAR(255), poiType VARCHAR(255), poiWebsite VARCHAR(255), poiPhoneNumber VARCHAR(255), poiCity VARCHAR(255), userID INT)
BEGIN
	DECLARE poiID, cityID INT;
    
    SELECT id into cityID FROM city WHERE name like poiCity;
    
	INSERT INTO poi (name, latitude, longitude, address, poi_type, city, isAproved, submitionUser) values (poiName, poiLatitude, poiLongitude, poiAddress, poiType, cityID, 0, userID);
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
    SELECT count(*) INTO canReject FROM user WHERE type_use = 'Ultra Premium' and id = userID;
	
    IF canReject = 1 THEN
		DELETE FROM poi where id = poiID;
	END IF;
END //


# aceitar um POI submetido
CREATE PROCEDURE acceptPOI (userID INT, poiID INT, googlePlaceID VARCHAR(255), googleRating DECIMAL(2,1), googleNumberReviews INT, poiDescription TEXT, poiWebsite VARCHAR(255), poiPhoneNumber VARCHAR(255))
BEGIN
	DECLARE canAccept INT;
    SELECT count(*) INTO canAccept FROM user WHERE type_use = 'Ultra Premium' and id = userID;
	
    IF canAccept = 1 THEN
		UPDATE poi SET place_id = googlePlaceID, google_rating = googleRating, num_reviews = googleNumberReviews, isAproved = 1 WHERE id = poiID AND submitionUser != userID;
		
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
END //


# obter lista de visitas de um determinado plano
CREATE PROCEDURE getVisitsFromPlan (userID INT, planID INT)
BEGIN
	SELECT * FROM
	(SELECT plan.name as plan_name, plan.user as user, plan.start_date as start_date, plan.end_date as end_date, 
		datediff(plan.end_date, plan.start_date) as date_diff, plan.isPublic as isPublic, plan.num_viewers as num_viewers, 
		visit.start_time as start_time, visit.end_time as end_time, visit.poi_id as poi, city.name as city, city.latitude as city_latitude, city.longitude as city_longitude
		FROM (plan JOIN city ON plan.city = city.id) JOIN visit ON plan.id = visit.plan_id
		WHERE plan.id = planID AND plan.isActive = 1 AND visit.isActive = 1 ORDER BY start_time
    ) AS E
    JOIN
    ( SELECT a.id as id, name, place_id, address, latitude, longitude, website, phone_number, poi_type, no_plans, rating, accessibility, security, price, duration FROM
		(SELECT * FROM poi) AS A 
		LEFT JOIN
		(SELECT count(*) as no_plans, poi.id as id2 from plan join visit join poi on visit.poi_id = poi.id on plan.id = visit.plan_id group by poi.id) AS B
		ON A.id = B.id2
		LEFT JOIN
		(SELECT avg(review_rating) as rating, avg(review_rating_accessibility) as accessibility, avg(review_rating_security) as security, avg(review_rating_price) as price, avg(review_rating_duration) as duration, poi_id as id3 from review_poi group by poi_id) AS D
		ON A.id = D.id3
	) AS F
    ON E.poi = F.id ORDER BY start_time;
END //


# obter a cidade a que pertence um determinado plano
CREATE PROCEDURE getCityIDFromPlan (planID INT)
BEGIN
	SELECT city from plan where id = planID;
END //

# obter lista de POIs sugeridos que não fazem parte de um determinado plano 
CREATE PROCEDURE getOtherSuggestionsFromPlan (planID INT, cityID INT)
BEGIN
	SELECT id, place_id, name, poi_type from poi where city = cityID and id not in (select poi_id from visit where plan_id = planID) order by num_reviews desc;
END // 

# obter as reviews de um determinado plano
CREATE PROCEDURE getPlanReviews (planID INT)
BEGIN
	select user.name as user, user.picture as picture, review_text, review_rating, review_timestamp from review_plan join (review join user on review.user_id = user.id ) on review_plan.review_id = review.id WHERE plan_id = planID order by review_timestamp desc;
END //


# obter as estatísticas de um determinado plano
CREATE PROCEDURE getPlanStats (planID INT)
BEGIN
    select avg(review_rating) as rating, count(*) as num_reviews from review_plan where plan_id = planID;
END //

# obter as estatísticas de um determinado plano
CREATE PROCEDURE getSharedPlansFromPlan (planID INT)
BEGIN
    select count(*) as num_plans from plan where parent_plan = planID;
END //


# atualizar o numero de utilizadores que visitaram um plano
CREATE PROCEDURE updatePlanViewers (planID INT)
BEGIN
	UPDATE plan SET num_viewers = num_viewers + 1 WHERE id = planID;
END //

# criar um plano
CREATE PROCEDURE createPlan (destination VARCHAR(255), arrival DATE, departure DATE, userID INT)
BEGIN
	declare cityID INT;
	declare planID INT;
    
    SELECT id INTO cityID FROM city WHERE name = destination;
		
    INSERT INTO Plan (start_date, end_date, user, city) VALUES (arrival, departure, userID, cityID);
	SET planID = LAST_INSERT_ID();
    SELECT planID;
END //


# verificar se um plano é manual ou automatico
CREATE PROCEDURE isPlanManual (planID INT)
BEGIN
	SELECT isManual FROM plan WHERE id = planID;
END //

# obter o horario de uma determinada visita
CREATE PROCEDURE getVisitSchedule (poiID INT, planID INT, userID INT)
BEGIN
	SELECT start_time, end_time FROM visit join plan on visit.plan_id = plan.id WHERE visit.poi_id = poiID AND plan.id = planID AND plan.user = userID;
END //



DELIMITER ;
