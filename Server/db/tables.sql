/*
CREATE TABLE User (
	id INT AUTO_INCREMENT NOT NULL, 
	username VARCHAR(255) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	picture BLOB,
    type_use VARCHAR(255) DEFAULT 'Free' NOT NULL,
    PRIMARY KEY(id),
    CHECK(type_use = 'Free' or type_use = 'Premium' or type_use = 'Ultra Premium'),
    UNIQUE(username)
);

CREATE TABLE User_G (
	user_id INT NOT NULL, 
    google_id INT NOT NULL, 
    birthday DATE, 
    gender CHAR,
    country VARCHAR(255),
    phone_number INT,
    address VARCHAR(255),
    PRIMARY KEY(user_id),
    FOREIGN KEY (user_id) REFERENCES User(id),
    UNIQUE(google_id),
	CHECK(gender = 'M' OR gender = 'F')
);

CREATE TABLE User_E (
	user_id INT NOT NULL, 
    birthday DATE, 
    gender CHAR NOT NULL,
    country VARCHAR(255),
    phone_number INT,
    password BINARY(128) NOT NULL,
    address VARCHAR(255),
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
    review_rating_accessibility INT,
    review_rating_security INT,
    review_rating_price DECIMAL(10,2),
    review_rating_duration INT,
    review_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    FOREIGN KEY (review_id) REFERENCES Review(id),
    FOREIGN KEY (poi_id) REFERENCES POI(id),
    CHECK(review_rating > 0 and review_rating < 6)
);

CREATE TABLE Review_Plan (
	review_id INT NOT NULL,
    plan_id INT NOT NULL,
    review_text TEXT,
    review_rating INT NOT NULL,
    review_rating_accessibility INT,
    review_rating_security INT,
    review_rating_price INT,
    review_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    FOREIGN KEY (review_id) REFERENCES Review(id),
    FOREIGN KEY (plan_id) REFERENCES Plan(id),
    CHECK(review_rating > 0 and review_rating < 6),
    CHECK(review_rating_accessibility > 0 and review_rating_accessibility < 6),
    CHECK(review_rating_security > 0 and review_rating_security < 6),
    CHECK(review_rating_price > 0 and review_rating_price < 6)
);


CREATE TABLE Hotel (
	poi_id INT NOT NULL,
    stars INT,
	PRIMARY KEY (poi_id),
    FOREIGN KEY (poi_id) REFERENCES Poi(id),
    CHECK(stars > 0 and stars < 6)
);

CREATE TABLE User_isInterested_Plan (
	user_id INT NOT NULL,
    plan_id INT NOT NULL,
	isInterested BIT NOT NULL,
    PRIMARY KEY (user_id, plan_id),
    FOREIGN KEY (user_id) REFERENCES User(id),
    FOREIGN KEY (plan_id) REFERENCES Plan(id)
);*/

CREATE TABLE Photo_POI (
	photo_id INT AUTO_INCREMENT NOT NULL, 
    poi_id INT NOT NULL,
    user_id INT NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    photo_timestamp TIMESTAMP DEFAULT current_timestamp,
	PRIMARY KEY (photo_id),
    FOREIGN KEY (user_id) REFERENCES User(id),
    FOREIGN KEY (poi_id) REFERENCES Poi(id)
);






