const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3001;
const http = require("http");
const router = express.Router();
const generateWaiverPDF = require('./generateWaiver');
const multer = require("multer");
const fs = require("fs");

const wordList = require('./words');

const server = http.createServer(app);
require("dotenv").config();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const session = require("express-session");

const cors = require("cors");

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "strict",
    },
  })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "main.html"));
});

// Save the code in the session
app.post("/save-code", (req, res) => {
  const { email, code, firstName, lastName, date } = req.body;

  if (!email || !code) {
    return res.status(400).send("Email and code are required.");
  }

  req.session.verificationCode = code;
  req.session.email = email;

  console.log(
    "Saved to session:",
    req.session.verificationCode,
    req.session.email
  );
  res.send("Verification code saved.");
});

const generateSignedWaiver = require('./generateWaiver');

app.post("/verify-code", async (req, res) => {
    const { email, code, firstName, lastName, date } = req.body;

    if (code == req.session.verificationCode && email === req.session.email) {
        try {
            // Save waiver with signature
            const filePath = await generateSignedWaiver({ firstName, lastName, email, date});

            // Update DB & respond
            db.query("UPDATE users SET registered = TRUE WHERE email = ?", [email], (err) => {
                if (err) return res.status(500).send("Database error");

                req.session.destroy();
                res.json({
                    message: "Email verified successfully! Account registered.",
                    filePath,
                    generatedPassword: `Email verified successfully! Account registered.`
                });
            });
        } catch (err) {
            console.error("Signing error:", err);
            res.status(500).send("PDF signing failed.");
        }
    } else {
        req.session.destroy();
        res.status(400).send("Invalid code or email.");
    }
});

// const db = mysql.createConnection({
//   host: "localhost",
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

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

// Connecting to the database
db.query('SELECT 1', (err, results) => {
  if (err) {
    console.error("Error testing database connection:", err.stack);
    return;
  }
  console.log("Database connection pool is working.");
});

// User Table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) UNIQUE NOT NULL,
    password VARCHAR(30) NOT NULL,
    firstName VARCHAR(30) NOT NULL,
    lastName VARCHAR(30) NOT NULL,
    email VARCHAR(60) NOT NULL UNIQUE,
    registered BOOLEAN DEFAULT FALSE,
    membership INT DEFAULT FALSE,
    signInDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isSignedIn BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'approved', 'denied') DEFAULT 'pending' -- Add this column
);
`;

const createCourtsTable = `
CREATE TABLE IF NOT EXISTS court_players (
    player_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    court_id INT,  -- Could be any identifier for the court
    booking_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

db.query(createUsersTable, (err) => {
  if (err) throw err;
  console.log("Users table created");
});

db.query(createCourtsTable, (err) => {
  if (err) throw err;
  console.log("Court table created");
});

function generateRandomPassword(callback) {
  const words = wordList;

  const randomWord = words[Math.floor(Math.random() * words.length)];

  callback(randomWord);
}

// Routes
app.post("/register", (req, res) => {
  let { username, password, firstName, lastName } = req.body;
  username = username.toLowerCase();
  const email = username;

  const checkUserQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkUserQuery, [email], (err, result) => {
    if (err) {
      console.log("Error checking duplicates:", err);
      return res.status(500).json({ message: "Error checking user data" });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const sql =
      "INSERT INTO users (username, password, firstName, lastName, email) VALUES (?, ?, ?, ?, ?)";
    db.query(
      sql,
      [username, password, firstName, lastName, email],
      (err, result) => {
        if (err) {
          console.log("Error inserting user:", err);
          return res.status(500).json({ message: "Error registering user" });
        }
        res.json({ message: "User registered successfully" });
      }
    );
  });
});

// Profile Routes
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Save file with temporary unique name (timestamp + original extension)
    const tempName = Date.now() + path.extname(file.originalname);
    cb(null, tempName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    cb(null, allowed.includes(file.mimetype));
  },
});

app.post("/api/upload-profile-pic", upload.single("image"), (req, res) => {
  if (!req.file || !req.body.email) {
    return res
      .status(400)
      .json({ success: false, message: "Missing file or email." });
  }

  const email = req.body.email;
  const safeEmail = email.replace(/[^a-zA-Z0-9.@_-]/g, "");
  const newFilename = `${safeEmail}.jpg`;

  const oldPath = req.file.path;
  const newPath = path.join(uploadDir, newFilename);

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      console.error("Error renaming file:", err);
      return res
        .status(500)
        .json({ success: false, message: "File rename failed." });
    }

    return res.json({ success: true, message: "Image uploaded successfully." });
  });
});

app.delete("/api/delete-profile-pic", (req, res) => {
  const email = req.body.email;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email required." });
  }

  const safeEmail = email.replace(/[^a-zA-Z0-9.@_-]/g, "");
  const filePath = path.join(uploadDir, `${safeEmail}.jpg`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File doesn’t exist
      return res
        .status(404)
        .json({ success: false, message: "Profile picture not found." });
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to delete picture." });
      }

      res.json({ success: true, message: "Profile picture deleted." });
    });
  });
});

app.get("/api/check-profile-pic/:email", (req, res) => {
  const email = req.params.email;
  const safeEmail = email.replace(/[^a-zA-Z0-9.@_-]/g, "");
  const imagePath = path.join(__dirname, "uploads", `${safeEmail}.jpg`);

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.json({ exists: false });
    }
    return res.json({ exists: true });
  });
});

app.post("/check-login-id", (req, res) => {
  const { loginID } = req.body;

  const query = "SELECT * FROM users WHERE email = ? OR username = ?";
  db.query(query, [loginID, loginID], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send({ exists: false });
    }
    if (results.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  });
});

app.post("/check-email", (req, res) => {
  const { loginID } = req.body;
  const query = "SELECT COUNT(*) AS count FROM users WHERE email = ?";
  db.query(query, [loginID], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    const emailExists = result[0].count > 0;
    res.json({ exists: emailExists });
  });
});

app.get("/users", (req, res) => {
  const sql =
    "SELECT username, password, firstName, lastName, email, registered, membership, signInDate, isSignedIn FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(results);
  });
});

app.put("/users/:username", (req, res) => {
  const { username } = req.params;
  const {
    password,
    firstName,
    lastName,
    email,
    registered,
    membership,
    signInDate,
    isSignedIn,
  } = req.body;

  if (
    !password &&
    !firstName &&
    !lastName &&
    !email &&
    registered === undefined
  ) {
    return res.status(400).json({ error: "No data provided to update" });
  }

  const checkUserApprovalQuery =
    "SELECT registered FROM users WHERE username = ?";
  db.query(checkUserApprovalQuery, [username], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Failed to check user approval status" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    let updates = [];
    let values = [];

    if (password) {
      updates.push("password = ?");
      values.push(password);
    }
    if (firstName) {
      updates.push("firstName = ?");
      values.push(firstName);
    }
    if (lastName) {
      updates.push("lastName = ?");
      values.push(lastName);
    }
    if (email) {
      updates.push("email = ?");
      values.push(email);
      updates.push("username = ?");
      values.push(email);
    }
    if (registered !== undefined) {
      updates.push("registered = ?");
      values.push(registered);
    }
    if (membership !== undefined) {
      updates.push("membership = ?");
      values.push(membership);
    }
    if (signInDate !== undefined) {
      updates.push("signInDate = ?");
      values.push(signInDate);
    }
    if (isSignedIn !== undefined) {
      updates.push("isSignedIn = ?");
      values.push(isSignedIn);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const query = `UPDATE users SET ${updates.join(", ")} WHERE username = ?`;
    values.push(username);

    db.query(query, values, (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Database error", details: err });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User updated successfully" });
    });
  });
});

app.post("/users/validate", (req, res) => {
  const { username, password } = req.body;

  const sql =
    "SELECT password, registered, isSignedIn FROM users WHERE username = ?";
  db.query(sql, [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: `User '${username}' not found` });
    }

    const user = results[0];

    if (user.password !== password) {
      return res.status(401).json({ error: `Incorrect password for ${username}` });
    }

    if (user.registered !== 1) {
      return res
        .status(403)
        .json({
          error: `${username} is not registered. Please verify your email.`,
        });
    }

    if (user.isSignedIn !== 1) {
      return res
        .status(403)
        .json({ error: `${username} is not signed in. Please sign in first.` });
    }

    return res
      .status(200)
      .json({ message: `${username} validated successfully` });
  });
});

app.post("/admin/reset-signedin", (req, res) => {
  const sql = "UPDATE users SET isSignedIn = 0, password = ''";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error resetting users:", err);
      return res
        .status(500)
        .json({ error: "Database error while resetting users" });
    }

    return res
      .status(200)
      .json({ message: "All users have been signed out and passwords reset." });
  });
});


app.put("/update-signin-status", (req, res) => {
  const { loginID, isSignedIn } = req.body;

  const query = "UPDATE users SET isSignedIn = ? WHERE email = ?";
  db.query(query, [isSignedIn, loginID], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to update sign-in status" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });
  });
});

// Delete User
app.delete("/users/:username", (req, res) => {
  const { username } = req.params;
  const sql = "DELETE FROM users WHERE username = ?";
  db.query(sql, [username], (err, result) => {
    if (err) return res.status(500).json({ error: "Error deleting user" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  });
});

let courts = {
  Paris: { timeLeft: 1800, currentPlayers: [], queue: [] },
  London: { timeLeft: 1800, currentPlayers: [], queue: [] },
  Berlin: { timeLeft: 1800, currentPlayers: [], queue: [] },
  Tokyo: { timeLeft: 1800, currentPlayers: [], queue: [] },
  "New Delhi": { timeLeft: 1800, currentPlayers: [], queue: [] },
  Jakarta: { timeLeft: 1800, currentPlayers: [], queue: [] },
  Beijing: { timeLeft: 1800, currentPlayers: [], queue: [] },
  Toronto: { timeLeft: 1800, currentPlayers: [], queue: [] },
  "New York": { timeLeft: 1800, currentPlayers: [], queue: [] },
  "Rest Area": { timeLeft: 1800, currentPlayers: [], queue: [] },
};

let courtsData = {
  Paris: "available",
  London: "available",
  Berlin: "available",
  Tokyo: "available",
  "New Delhi": "available",
  Jakarta: "available",
  Beijing: "available",
  Toronto: "available",
  "New York": "available",
};

app.get("/api/court-status", (req, res) => {
  res.json(courtsData);
});

app.post("/api/court-status", (req, res) => {
  const { court, status } = req.body;
  if (!court || !status || !courtsData.hasOwnProperty(court)) {
    return res.status(400).json({ error: "Invalid court or status" });
  }
  courtsData[court] = status;
  res.json({ court, status });
});

let version = 0;

function startCourtTimers() {
  setInterval(() => {
    Object.keys(courts).forEach((court) => {
      const courtData = courts[court];
      if (courtData.currentPlayers.length > 0 && courtData.timeLeft > 0) {
        courtData.timeLeft--;
      } else if (courtData.timeLeft === 0 && courtData.queue.length > 0) {
        courtData.currentPlayers = courtData.queue.shift();
        courtData.timeLeft = 20; // Reset the timer
      }
    });
  }, 1000);
}

startCourtTimers();

app.get("/courts", (req, res) => {
  res.json({ courts, version });
});

app.post("/update-courts", (req, res) => {
  courts = req.body;
  version++; 
  console.log("Courts updated. New version:", version);
  res.sendStatus(200);
});

app.post("/unbook-court", async (req, res) => {
  const { courtId, playersToRemove } = req.body;

  if (
    !courtId ||
    !Array.isArray(playersToRemove) ||
    playersToRemove.length === 0
  ) {
    return res.status(400).send("Court ID and players to remove are required.");
  }

  try {
    const court = courts[courtId];
    if (!court) {
      return res.status(404).send("Court not found.");
    }

    let removedPlayers = [];

    for (const player of playersToRemove) {
      const playerIndex = court.currentPlayers.indexOf(player);
      if (playerIndex !== -1) {
        court.currentPlayers.splice(playerIndex, 1);
        removedPlayers.push(player);
      } else {
        console.log(`Player ${player} is not booked on this court.`);
      }
    }

    if (removedPlayers.length === 0) {
      return res.status(400).send("No players were removed.");
    }

    const removeQuery =
      "DELETE FROM court_players WHERE user_id IN (?) AND court_id = ?";
    const [result] = await db
      .promise()
      .query(removeQuery, [playersToRemove, courtId]);

    if (result.affectedRows === 0) {
      return res
        .status(500)
        .send("Failed to remove players from the database.");
    }

    res.status(200).json({
      message: "Players removed successfully",
      removedPlayers,
      courtState: court,
    });
  } catch (error) {
    console.error("Error unbooking players:", error);
    res.status(500).send("Error unbooking players.");
  }
});

// Remove player from a court
app.delete("/remove-player/:playerId", async (req, res) => {
  const playerId = req.params.playerId;

  try {
    const [result] = await db
      .promise()
      .query("SELECT * FROM court_players WHERE player_id = ?", [playerId]);

    if (result.length === 0) {
      return res.status(404).send("Player not found.");
    }

    await db
      .promise()
      .query("DELETE FROM court_players WHERE player_id = ?", [playerId]);

    res.status(200).send("Player removed successfully!");
  } catch (error) {
    console.error("Error removing player:", error);
    res.status(500).send("Error removing player.");
  }
});

let pendingLogins = [];
let approvedLogins = [];

app.post("/login", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  console.log(`Login attempt for email: ${email}`);

  const sql =
    "SELECT email, status, password, isSignedIn FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Database query failed" });
    }

    console.log("Query results:", results);

    if (results.length === 0) {
      return res.status(404).json({ status: "failed" });
    }

    const user = results[0];

    if (user.isSignedIn === 0) {
      // If isSignedIn is 0, change status to "pending" and update signInDate
      const updateSql =
        'UPDATE users SET status = "pending", signInDate = NOW() WHERE email = ?';
      db.query(updateSql, [email], (err, updateResults) => {
        if (err) {
          console.error("Failed to update status:", err);
          return res
            .status(500)
            .json({ error: "Failed to update user status" });
        }
        return res.status(200).json({ status: "pending" });
      });
    } else if (user.isSignedIn === 1) {
      const updateSql =
        'UPDATE users SET status = "approved", signInDate = NOW() WHERE email = ?';
      db.query(updateSql, [email], (err, updateResults) => {
        if (err) {
          console.error("Failed to update status:", err);
          return res
            .status(500)
            .json({ error: "Failed to update user status" });
        }
        return res.json({ status: "approved", password: user.password });
      });
    }
  });
});

app.post("/check-status", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  console.log(`Checking status for email: ${email}`);

  const sql =
    "SELECT email, status, password, isSignedIn FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({
          status: "failed",
          message: "Email not found. Please register first.",
        });
    }

    const user = results[0];

    if (user.isSignedIn === 1 && user.status === "approved") {
      return res.json({ status: "approved", password: user.password });
    }

    if (user.isSignedIn === 0 && user.status === "pending") {
      return res.json({ status: "pending" });
    }

    if (user.isSignedIn === 0 && user.status === "denied") {
      return res.json({ status: "denied" });
    }

    return res
      .status(400)
      .json({ status: "failed", message: "Unexpected status or state." });
  });
});

// Admin fetch pending users
app.get("/admin/pending", (req, res) => {
  const sql = 'SELECT username, email FROM users WHERE status = "pending"';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

app.post("/admin/approve", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  generateRandomPassword((newPassword) => {
    const sql =
      'UPDATE users SET password = ?, status = "approved", isSignedIn = 1 WHERE username = ?';
    db.query(sql, [newPassword, username], (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Database query failed" });
      }

      res.status(200).json({ status: "approved", newPassword });
    });
  });
});

// Admin denies the user
app.post("/admin/deny", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  const sql = 'UPDATE users SET status = "denied" WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database query failed" });
    }

    res.status(200).json({ status: "denied" });
  });
});

app.use(express.static(__dirname));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
