-- FUNCTIONS

DROP FUNCTION Check_If_Plan_Is_Manual;

DELIMITER //
# verificar se um plano é manual ou automatico
CREATE FUNCTION Check_If_Plan_Is_Manual (planID INT) RETURNS BIT DETERMINISTIC
BEGIN
	DECLARE isMan BIT;
	SELECT isManual INTO isMan FROM plan WHERE id = planID;
    RETURN isMan;
END //
 

 # criar um plano
CREATE FUNCTION Create_Plan (destination VARCHAR(255), arrival DATE, departure DATE, userID INT) RETURNS INT NOT DETERMINISTIC MODIFIES SQL DATA 
BEGIN
	declare cityID INT;
	declare planID INT;
    
    SELECT id INTO cityID FROM city WHERE name = destination;
		
    INSERT INTO Plan (start_date, end_date, user, city) VALUES (arrival, departure, userID, cityID);
	SET planID = LAST_INSERT_ID();
    RETURN planID;
END //