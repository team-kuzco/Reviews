const connection = require("../db/connection.js");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const port = 3000;

var getAvg = function (metaData, numOfResponses) {
  for (var key in metaData) {
    metaData[key] = metaData[key] / numOfResponses;
  }
  return metaData;
};

app.get("/reviews", (req, res) => {
  var productId = req.query.product_id;
  var limit = Number(req.query.count) || 5;
  var reveiwResponse = {
    product: req.query.product_id,
    count: limit,
    results: [],
  };
  var sortBy = (req.query.sort = "helpful"
    ? "Helpfulness"
    : (req.query.sort = "newest"
        ? "Date"
        : (req.query.sort = "relevant" ? "Helpfulness DESC, Date" : "Helpfulness")));
  var connectionArgs = [productId, limit];
  connection.query(
    `SELECT * from Review_data WHERE Product_id = ? AND reported <> 1 ORDER BY ${sortBy} DESC LIMIT ?`,
    connectionArgs,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        for (let i = 0; i < result.length; i++) {
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
              (err, result) => {
                if (err) {
                  console.error(err);
                } else {
                  for (let j = 0; j < result.length; j++) {
                    reveiwResponse.results[i].photos.push({
                      id: j + 1,
                      url: result[j].photo_url,
                    });
                  }

                }
              }
            );
          if (i === result.length - 1) {
            res.send(reveiwResponse);
          }
        }
      }
    }
  );
});

app.get("/reviews/meta", (req, res) => {
  var response = {
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
  var productId = req.query.product_id;
  connection.query(
    "SELECT Rating, recommend, Review_id from Review_data WHERE Product_id = ?",
    [productId],
    (err, result) => {
      if (err) {
        res.sendStatus(400);
      } else {
        for (let i = 0; i < result.length; i++) {
          response.ratings[result[i].Rating]++;
          response.recommended[result[i].recommend]++;
          connection.query(
            "SELECT * from Characteristics, Characteristic_reviews WHERE review_id = ? AND Characteristics.Characteristic_id = Characteristic_reviews.characteristic_id",
            [result[i].Review_id],
            (err, metaResult) => {
              if (err) {
                console.error(err);
                res.sendStatus(400);
              } else {
                for (var j = 0; j < metaResult.length; j++) {
                  if (!response.characteristics[metaResult[j].name]) {
                    response.characteristics[metaResult[j].name] = 0;
                  }
                  response.characteristics[metaResult[j].name] +=
                    metaResult[j].rating;
                }
                if (i === result.length - 1) {
                  response.characteristics = getAvg(
                    response.characteristics,
                    response.recommended[0] + response.recommended[1]
                  );
                  res.send(response);
                }
              }
            }
          );
        }
      }
    }
  );
});

app.post('/reviews', (req, res) => {
  var date = new Date().valueOf()
  var queryArgs = [req.query.product_id, req.query.rating, date, req.query.summary, req.query.body, req.query.recommend, req.query.name, req.query.email]
  connection.query('SELECT Review_id from Review_data ORDER BY Review_id DESC LIMIT 1', (err, reviewId) => {
    if (err) {
      console.error(err);
    } else {
      connection.query(`INSERT INTO Review_data (Review_id, Product_id, Rating, Date, Summary, Body, recommend, Reviewer_name, Reviewer_email, Helpfulness, reported) VALUES (${reviewId[0].Review_id + 1}, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`, queryArgs, (err, result) => {
        if (err) {
          console.error(err);
          res.sendStatus(500);
        } else {
          res.sendStatus(201);
        }
  })
    }
  })

})

app.put('/reviews/:review_id/helpful', (req, res) => {
  connection.query('UPDATE Review_data SET Helpfulness = Helpfulness + 1 WHERE Review_id = ?', [req.params.review_id], (err, result) => {
    if (err) {
      console.error(err)
      res.sendStatus(500);
      res.end();
    } else {
      res.sendStatus(204);
      res.end();
    }
  })
})

app.put('/reviews/:review_id/report', (req, res) => {
  connection.query('UPDATE Review_data SET reported = 1 WHERE Review_id = ?', [req.params.review_id], (err, result) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
      res.end();
    } else {
      res.sendStatus(204);
      res.end()
    }
  })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
