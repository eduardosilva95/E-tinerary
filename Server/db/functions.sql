-- FUNCTIONS

DROP FUNCTION Check_If_Plan_Is_Manual;
DROP FUNCTION Create_Plan;
DROP FUNCTION Edit_User_Name;
DROP FUNCTION Edit_User_Picture;
DROP FUNCTION Edit_User_Birthday;
DROP FUNCTION Edit_User_Country;
DROP FUNCTION Edit_User_Address;
DROP FUNCTION Edit_User_Phone_Number;

DELIMITER //
# verificar se um plano é manual ou automatico
CREATE FUNCTION Check_If_Plan_Is_Manual (planID INT) RETURNS BIT DETERMINISTIC
BEGIN
	DECLARE isMan BIT;
	SELECT isManual INTO isMan FROM plan WHERE id = planID;
    RETURN isMan;
END //
 

 # criar um plano
CREATE FUNCTION Create_Plan (destination VARCHAR(255), arrival DATE, departure DATE, userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
BEGIN
	declare cityID INT;
	declare planID INT;
    
    SELECT id INTO cityID FROM city WHERE name = destination;
		
    INSERT INTO Plan (start_date, end_date, user, city) VALUES (arrival, departure, userID, cityID);
	SET planID = LAST_INSERT_ID();
    RETURN planID;
END //


# editar nome do utilizador
CREATE FUNCTION Edit_User_Name (new_value VARCHAR(255), userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
BEGIN
	declare result INT;
    
    UPDATE user SET name = new_value WHERE id = userID;
    set result = ROW_COUNT();
    
    return result;
END //


# editar foto do utilizador
CREATE FUNCTION Edit_User_Picture (new_value VARCHAR(255), userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
BEGIN
	declare result INT;
    
    UPDATE user SET picture = new_value WHERE id = userID;
    set result = ROW_COUNT();
    
    return result;
END //



# editar data de nascimento do utilizador
CREATE FUNCTION Edit_User_Birthday (new_value DATE, userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
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
CREATE FUNCTION Edit_User_Country (new_value VARCHAR(255), userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
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
CREATE FUNCTION Edit_User_Address (new_value VARCHAR(255), userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
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
CREATE FUNCTION Edit_User_Phone_Number (new_value INT, userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA READS SQL DATA
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





