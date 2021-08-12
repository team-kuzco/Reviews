const connection = require('../db/connection.js');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const port = 3000;

app.get('/Reviews', (req, res) => {
  var productId = req.query.product_id;
  var limit = req.query.count || 5;
  var sortBy = req.query.sort = 'helpful' ? 'Helpfulness' : req.query.sort = 'newest' ? 'Date' : req.query.sort = 'relevant' ? 'Helpfulness' : 'Helpfulness';
  console.log(sortBy);
  var connectionArgs = [productId, sortBy, limit]
  connection.query(`SELECT * from Review_data WHERE Product_id = ? ORDER BY (?) DESC LIMIT ?`, connectionArgs, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  })
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})