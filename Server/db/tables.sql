/*
CREATE TABLE User (
	id INT AUTO_INCREMENT NOT NULL, 
	username VARCHAR(255) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	picture BLOB,
    type_use VARCHAR(255) DEFAULT 'Free' NOT NULL,
    PRIMARY KEY(id),
    CHECK(type_use = 'Free' or type_use = 'Premium'),
    UNIQUE(username)
);

CREATE TABLE User_G (
	user_id INT NOT NULL, 
    google_id INT NOT NULL, 
    PRIMARY KEY(user_id),
    FOREIGN KEY (user_id) REFERENCES User(id),
    UNIQUE(google_id)
);

CREATE TABLE User_E (
	user_id INT NOT NULL, 
    birthday DATE, 
    gender CHAR NOT NULL,
    country VARCHAR(255),
    phone_number INT,
    password BINARY(128) NOT NULL,
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES User(id),
	CHECK(gender = 'M' OR gender = 'F')
);


CREATE TABLE Review (
	id INT AUTO_INCREMENT NOT NULL,
	user_id INT NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(user_id) REFERENCES User(id)
);

CREATE TABLE Review_POI (
	review_id INT NOT NULL,
    poi_id INT NOT NULL,
    review_text TEXT NOT NULL,
    review_rating INT,
    review_timestamp TIMESTAMP NOT NULL,
    PRIMARY KEY (review_id),
    FOREIGN KEY (review_id) REFERENCES Review(id),
    FOREIGN KEY (poi_id) REFERENCES POI(id),
    CHECK(review_rating > 0 and review_rating < 6)
);*/

CREATE TABLE Review_Plan (
	review_id INT NOT NULL,
    plan_id INT NOT NULL,
    review_text TEXT,
    review_rating INT NOT NULL,
    review_rating_accessibility INT,
    review_rating_security INT,
    review_rating_price INT,
    review_timestamp TIMESTAMP NOT NULL,
    PRIMARY KEY (review_id),
    FOREIGN KEY (review_id) REFERENCES Review(id),
    FOREIGN KEY (plan_id) REFERENCES Plan(id),
    CHECK(review_rating > 0 and review_rating < 6),
    CHECK(review_rating_accessibility > 0 and review_rating_accessibility < 6),
    CHECK(review_rating_security > 0 and review_rating_security < 6),
    CHECK(review_rating_price > 0 and review_rating_price < 6)
);




/*
CREATE TABLE Hotel (
	poi_id INT NOT NULL,
    stars INT,
	PRIMARY KEY (poi_id),
    FOREIGN KEY (poi_id) REFERENCES Poi(id),
    CHECK(stars > 0 and stars < 6)
);*/



