DROP DATABASE IF EXISTS Reviews;

CREATE DATABASE Reviews;

USE Reviews;

CREATE TABLE Review_data (
  Review_id INT NOT NULL,
  Product_id INT NOT NULL,
  Rating INT NOT NULL,
  Date INT NOT NULL,
  Summary VARCHAR(60) NOT NULL,
  Body VARCHAR(1000) NOT NULL,
  recommend INT NOT NULL,
  reported INT NOT NULL,
  Reviewer_Name VARCHAR(60) NOT NULL,
  Reviewer_email VARCHAR(60) NOT NULL,
  Response VARCHAR(400),
  Helpfulness INT NOT NULL,
  PRIMARY KEY (Review_Id)
);

CREATE TABLE Characteristics (
  Characteristic_id INT NOT NULL,
  Product_id INT,
  name TINYTEXT NOT NULL,
  PRIMARY KEY (Characteristic_id)
);

CREATE TABLE Photos (
  id INT NOT NULL,
  review_id INT,
  photo_url TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE Characteristic_reviews (
  id INT NOT NULL,
  characteristic_id INT NOT NULL,
  review_id INT NOT NULL,
  rating INT NOT NULL,
  PRIMARY KEY (id)
);

ALTER TABLE Characteristic_reviews
ADD FOREIGN KEY (characteristic_id) REFERENCES Characteristics(Characteristic_id),
ADD FOREIGN KEY (review_id) REFERENCES Review_data(Review_id);

ALTER TABLE Photos
ADD FOREIGN KEY (review_id) REFERENCES Review_data(Review_id);

LOAD DATA LOCAL INFILE '/Users/dillan/Documents/School/SDCDataFiles/reviews.csv'
INTO TABLE Review_Data
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE '/Users/dillan/Documents/School/SDCDataFiles/characteristics.csv'
INTO TABLE Characteristics
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE '/Users/dillan/Documents/School/SDCDataFiles/characteristic_reviews.csv'
INTO TABLE Characteristic_reviews
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE '/Users/dillan/Documents/School/SDCDataFiles/reviews_photos.csv'
INTO TABLE Photos
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
