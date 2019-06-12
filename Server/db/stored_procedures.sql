-- PROCEDURES

DROP PROCEDURE Get_Top_Cities;
DROP PROCEDURE Get_Top_POI;
DROP PROCEDURE Get_Random_Cities;
DROP PROCEDURE Get_POI_Of_City;
DROP PROCEDURE Get_Visits_Time_Of_Plan;
DROP PROCEDURE Get_Plan_Dates;
DROP PROCEDURE Get_Info_POI;
DROP PROCEDURE Get_POI_Reviews;
DROP PROCEDURE Get_Hotels;
DROP PROCEDURE Get_IDs_POI_Of_City;
DROP PROCEDURE Add_Visit_To_Plan;
DROP PROCEDURE Get_Info_User;


DELIMITER //
# obter as N cidades com mais planos criados
CREATE PROCEDURE Get_Top_Cities (num_results INT)
BEGIN
	select name, count(name) as plans from 
	(select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 group by plan.id) t 
    group by name order by plans desc limit num_results;
END //

# obter os N POI com mais planos criados
CREATE PROCEDURE Get_Top_POI (num_results INT)
BEGIN
	select id, name, place_id, city, count(name) as plans from 
    (select poi.id, poi.name, poi.place_id, city.name as city from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1) t 
    group by name order by plans desc limit num_results;
END //

# obter N cidades random
CREATE PROCEDURE Get_Random_Cities (num_results INT)
BEGIN
	select name, count(name) as plans from 
    (select city.name from plan join (visit join (poi join city on poi.city = city.id) on visit.poi_id = poi.id) on plan.id = visit.plan_id where plan.isActive = 1 group by plan.id) t 
    group by name order by rand() limit num_results;
END //

# obter todos os POI de uma determinada cidade
# TO DO: tentar retornar também o número de resultados
CREATE PROCEDURE Get_POI_Of_City (destination VARCHAR(255), query_text VARCHAR(255), limit_inf INT, total_results INT) 
BEGIN
	IF query_text = "" THEN
		SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination ORDER BY poi.num_reviews DESC LIMIT limit_inf, total_results;
	ELSE
		SET query_text = CONCAT('%', query_text,'%');
		SELECT city.name AS city, city.country AS country, poi.id AS id, poi.place_id AS place_id, poi.name AS place, poi.address AS address, poi.rating AS rating, poi.poi_type AS poi_type, poi.description as description FROM poi JOIN city ON poi.city = city.id WHERE city.name = destination AND poi.name LIKE query_text ORDER BY poi.num_reviews DESC LIMIT limit_inf, total_results;
	END IF;
END //

# obter uma lista de POI de um plano com os respetivos horarios
CREATE PROCEDURE Get_Visits_Time_Of_Plan (planID INT, isManual BIT)
BEGIN
	IF isManual = 1 THEN
		select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join plan on plan_id=plan.id where plan_id = planID and plan.isManual = 1;
	ELSE
		select poi_id, plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff, visit.start_time as start_time, visit.end_time as end_time from visit join plan on plan_id=plan.id where plan_id = planID and plan.isActive = 1 and visit.isActive = 1;
	END IF;
END //

# obter as datas (inicio e fim) de um plano 
CREATE PROCEDURE Get_Plan_Dates (planID INT)
BEGIN
	select plan.start_date as start_date, plan.end_date as end_date, datediff(plan.end_date, plan.start_date) as date_diff from plan where id = planID;
END //

# obter toda a informação de um POI
CREATE PROCEDURE Get_Info_POI (poiID INT)
BEGIN
	SELECT * FROM poi;
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
CREATE PROCEDURE Get_IDs_POI_Of_City (destination VARCHAR(255))
BEGIN
	select poi.id as poi from poi join city on poi.city = city.id where city.name = destination and poi.num_reviews > 100 and poi.poi_type != 'Hotel' and poi.poi_type != 'Restaurant';
END //

# adicionar visitas a um plano
CREATE PROCEDURE Add_Visit_To_Plan (planID INT, poiID INT, visit_start_time DATE, visit_end_time DATE)
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





DELIMITER ;
