const mysql = require("mysql2");
require("dotenv").config();

let db;

if (process.env.JAWSDB_URL) {
  db = mysql.createPool(process.env.JAWSDB_URL);
} else {
  db = mysql.createPool({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });
}

db.query("SELECT 1", (err) => {
  if (err) {
    console.error("DB connection failed:", err);
  } else {
    console.log("DB connected.");
  }
});

module.exports = db;
