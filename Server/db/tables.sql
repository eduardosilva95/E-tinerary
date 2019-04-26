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
