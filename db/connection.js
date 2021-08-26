const mysql = require('mysql');

const connection = mysql.createConnection({
  host: '18.191.200.241',
  user: 'root',
  password: 'password',
  database: 'Reviews',
});

connection.connect();

module.exports = connection;
