/* eslint-disable no-param-reassign */
/* eslint-disable guard-for-in */
const express = require('express');
const cors = require('cors');
const connection = require('../db/connection');

const app = express();
app.use(express.json());
app.use(cors());

const port = 3000;

const getAvg = (metaData, numOfResponses) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in metaData) {
    metaData[key] /= numOfResponses;
  }
  return metaData;
};

app.get('/reviews', (req, res) => {
  const productId = req.query.product_id;
  const limit = Number(req.query.count) || 5;
  const reveiwResponse = {
    product: req.query.product_id,
    count: limit,
    results: [],
  };
  // eslint-disable-next-line no-multi-assign
  let sortBy;
  if (req.query.sort === 'helpful') {
    sortBy = 'Helpfulness';
  } else if (req.query.sort === 'newest') {
    sortBy = 'Date';
  } else {
    sortBy = 'Helpfulness DESC, Date';
  }
  // const sortBy = (req.query.sort === 'helpful'
  //   ? 'Helpfulness'
  //   : (req.query.sort === 'newest' ? 'Date' : 'Helpfulness DESC, Date'));
  const connectionArgs = [productId, limit];
  connection.query(
    `SELECT * from Review_data WHERE Product_id = ? AND reported <> 1 ORDER BY ${sortBy} DESC LIMIT ?`,
    connectionArgs,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        for (let i = 0; i < result.length; i += 1) {
          reveiwResponse.results.push({
            review_id: result[i].Review_id,
            rating: result[i].Rating,
            summary: result[i].Summary,
            recommend: (result[i].recommend = 0
              ? false
              : (result[i].recommend = 1 ? true : null)),
            response: result[i].Response,
            body: result[i].Body,
            date: new Date(result[i].Date),
            reviewer_name: result[i].Reviewer_Name,
            helpfulness: result[i].Helpfulness,
            photos: [],
          });
          connection.query(
            `SELECT * from Photos WHERE review_id = ${result[i].Review_id}`,
            (error, photoResult) => {
              if (err) {
                res.status(500);
                res.send(error);
                console.error(error);
              } else {
                for (let j = 0; j < photoResult.length; j += 1) {
                  reveiwResponse.results[i].photos.push({
                    id: j + 1,
                    url: photoResult[j].photo_url,
                  });
                }
                if (i === result.length - 1) {
                  res.send(reveiwResponse);
                }
              }
            },
          );
        }
      }
    },
  );
});

app.get('/reviews/meta', (req, res) => {
  const response = {
    product_id: req.query.product_id,
    ratings: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    recommended: {
      0: 0,
      1: 0,
    },
    characteristics: {},
  };
  const productId = req.query.product_id;
  connection.query(
    'SELECT Rating, recommend, Review_id from Review_data WHERE Product_id = ?',
    [productId],
    (err, result) => {
      if (err) {
        res.sendStatus(400);
      } else {
        for (let i = 0; i < result.length; i += 1) {
          response.ratings[result[i].Rating] += 1;
          response.recommended[result[i].recommend] += 1;
          connection.query(
            'SELECT * from Characteristics, Characteristic_reviews WHERE review_id = ? AND Characteristics.Characteristic_id = Characteristic_reviews.characteristic_id',
            [result[i].Review_id],
            (error, metaResult) => {
              if (err) {
                console.error(err);
                res.sendStatus(400);
              } else {
                for (let j = 0; j < metaResult.length; j += 1) {
                  if (!response.characteristics[metaResult[j].name]) {
                    response.characteristics[metaResult[j].name] = 0;
                  }
                  response.characteristics[metaResult[j].name]
                  += metaResult[j].rating;
                }
                if (i === result.length - 1) {
                  response.characteristics = getAvg(
                    response.characteristics,
                    response.recommended[0] + response.recommended[1],
                  );
                  res.send(response);
                }
              }
            },
          );
        }
      }
    },
  );
});

app.post('/reviews', (req, res) => {
  const date = new Date().valueOf();
  const queryArgs = [
    req.query.product_id,
    req.query.rating,
    date,
    req.query.summary,
    req.query.body,
    req.query.recommend,
    req.query.name,
    req.query.email,
  ];
  connection.query(
    'SELECT Review_id from Review_data ORDER BY Review_id DESC LIMIT 1',
    (err, reviewId) => {
      if (err) {
        res.sendStatus(500);
        console.error(err);
      } else {
        connection.query(
          `INSERT INTO Review_data (Review_id, Product_id, Rating, Date, Summary, Body, recommend, Reviewer_name, Reviewer_email, Helpfulness, reported) VALUES (${
            reviewId[0].Review_id + 1
          }, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
          queryArgs,
          (error) => {
            if (err) {
              console.error(error);
              res.status(500);
            } else {
              res.status(201);
            }
          },
        );
        if (req.query.photos) {
          for (let i = 0; i < req.query.photos.length; i += 1) {
            connection.query(
              `INSERT INTO Photos (review_id, photo_url) VALUES (${
                reviewId[0].Review_id + 1
              }, ?)`,
              [req.query.photos[i]],
              (error) => {
                if (error) {
                  res.status(500);
                } else {
                  res.status(201);
                }
              },
            );
          }
        }
      }
      res.end();
    },
  );
});

app.put('/reviews/:review_id/helpful', (req, res) => {
  connection.query(
    'UPDATE Review_data SET Helpfulness = Helpfulness + 1 WHERE Review_id = ?',
    [req.params.review_id],
    (err) => {
      if (err) {
        console.error(err);
        res.sendStatus(500);
        res.end();
      } else {
        res.sendStatus(204);
        res.end();
      }
    },
  );
});

app.put('/reviews/:review_id/report', (req, res) => {
  connection.query(
    'UPDATE Review_data SET reported = 1 WHERE Review_id = ?',
    [req.params.review_id],
    (err) => {
      if (err) {
        console.error(err);
        res.sendStatus(500);
        res.end();
      } else {
        res.sendStatus(204);
        res.end();
      }
    },
  );
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
