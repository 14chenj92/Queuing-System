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

    // Always drop and recreate the 'courts' table
    db.query("DROP TABLE IF EXISTS courts", (err) => {
      if (err) {
        console.error("Failed to drop 'courts' table:", err);
      } else {
        console.log("✅ Dropped 'courts' table.");

        const createCourtsTable = `
          CREATE TABLE IF NOT EXISTS courts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            time_left BIGINT DEFAULT 0,
            current_players JSON DEFAULT NULL,
            current_usernames JSON DEFAULT NULL,
            queue JSON DEFAULT NULL,
            queue_usernames JSON DEFAULT NULL,
            available ENUM('available', 'unavailable') DEFAULT 'available'
          );
        `;

        db.query(createCourtsTable, (err) => {
          if (err) {
            console.error("❌ Failed to create 'courts' table:", err);
          } else {
            console.log("✅ Created 'courts' table.");
          }
        });
      }
    });
  }
});

module.exports = db;
