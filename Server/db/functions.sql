-- FUNCTIONS

DROP FUNCTION isPlanManual;
DROP FUNCTION createPlan;
DROP FUNCTION editUserName;
DROP FUNCTION editUserPicture;
DROP FUNCTION editUserBirthday;
DROP FUNCTION editUserCountry;
DROP FUNCTION editUserAddress;
DROP FUNCTION editUserPhoneNumber;

DELIMITER //
# verificar se um plano é manual ou automatico
CREATE FUNCTION isPlanManual (planID INT) RETURNS BIT DETERMINISTIC
BEGIN
	DECLARE isMan BIT;
	SELECT isManual INTO isMan FROM plan WHERE id = planID;
    RETURN isMan;
END //
 

 # criar um plano
CREATE FUNCTION createPlan (destination VARCHAR(255), arrival DATE, departure DATE, userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
BEGIN
	declare cityID INT;
	declare planID INT;
    
    SELECT id INTO cityID FROM city WHERE name = destination;
		
    INSERT INTO Plan (start_date, end_date, user, city) VALUES (arrival, departure, userID, cityID);
	SET planID = LAST_INSERT_ID();
    RETURN planID;
END //


# editar nome do utilizador
CREATE FUNCTION editUserName (new_value VARCHAR(255), userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
BEGIN
	declare result INT;
    
    UPDATE user SET name = new_value WHERE id = userID;
    set result = ROW_COUNT();
    
    return result;
END //


# editar foto do utilizador
CREATE FUNCTION editUserPicture (new_value VARCHAR(255), userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
BEGIN
	declare result INT;
    
    UPDATE user SET picture = new_value WHERE id = userID;
    set result = ROW_COUNT();
    
    return result;
END //



# editar data de nascimento do utilizador
CREATE FUNCTION editUserBirthday (new_value DATE, userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
BEGIN
	declare result INT;
    declare isGoogle INT;
    
	SELECT COUNT(*) INTO isGoogle FROM user_g WHERE user_id = userID;
    
    IF isGoogle = 1 THEN
		UPDATE user_g SET birthday = new_value WHERE user_id = userID;
    ELSE
		UPDATE user_e SET birthday = new_value WHERE user_id = userID;
	END IF;
    
    set result = ROW_COUNT();
    return result;
END //


# editar país do utilizador
CREATE FUNCTION editUserCountry (new_value VARCHAR(255), userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
BEGIN
	declare result INT;
    declare isGoogle INT;
    
	SELECT COUNT(*) INTO isGoogle FROM user_g WHERE user_id = userID;
    
    IF isGoogle = 1 THEN
		UPDATE user_g SET country = new_value WHERE user_id = userID;
    ELSE
		UPDATE user_e SET country = new_value WHERE user_id = userID;
	END IF;
    
    set result = ROW_COUNT();
    return result;
END //


# editar morada do utilizador
CREATE FUNCTION editUserAddress (new_value VARCHAR(255), userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
BEGIN
	declare result INT;
    declare isGoogle INT;
    
	SELECT COUNT(*) INTO isGoogle FROM user_g WHERE user_id = userID;
    
    IF isGoogle = 1 THEN
		UPDATE user_g SET address = new_value WHERE user_id = userID;
    ELSE
		UPDATE user_e SET address = new_value WHERE user_id = userID;
	END IF;
    
    set result = ROW_COUNT();
    return result;
END //

# editar numero de telefone do utilizador
CREATE FUNCTION editUserPhoneNumber (new_value INT, userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
BEGIN
	declare result INT;
    declare isGoogle INT;
    
	SELECT COUNT(*) INTO isGoogle FROM user_g WHERE user_id = userID;
    
    IF isGoogle = 1 THEN
		UPDATE user_g SET phone_number = new_value WHERE user_id = userID;
    ELSE
		UPDATE user_e SET phone_number = new_value WHERE user_id = userID;
	END IF;
    
    set result = ROW_COUNT();
    return result;
END //





