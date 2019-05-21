/*
CREATE TABLE User (
	id INT AUTO_INCREMENT NOT NULL, 
	username VARCHAR(255) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	picture BLOB,
    PRIMARY KEY(id),
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
    type_use VARCHAR(255) DEFAULT 'Free' NOT NULL,
    password BINARY(128) NOT NULL,
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES User(id),
	CHECK(gender = 'M' OR gender = 'F'), 
    CHECK(type_use = 'Free' or type_use = 'Premium')
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

CREATE TABLE Hotel (
	poi_id INT NOT NULL,
    stars INT,
	PRIMARY KEY (poi_id),
    FOREIGN KEY (poi_id) REFERENCES Poi(id),
    CHECK(stars > 0 and stars < 6)
);



