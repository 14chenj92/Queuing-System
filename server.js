const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer(app);
const io = socketIo(server);
require('dotenv').config();



app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const session = require("express-session");

const cors = require("cors");

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 5 * 60 * 1000, 
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict"
    }
}));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "main.html"));
});

// Save the code in the session
app.post("/save-code", (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).send("Email and code are required.");
    }

    req.session.verificationCode = code;
    req.session.email = email; 

    console.log("Saved to session:", req.session.verificationCode, req.session.email);
    res.send("Verification code saved.");
});



app.post("/verify-code", (req, res) => {
    const { email, code } = req.body;

    // Ensure session data exists
    if (!req.session.verificationCode || !req.session.email) {
        return res.status(400).send("No verification code found. Request a new one.");
    }

    // Check if email matches the one stored in session
    if (email !== req.session.email) {
        return res.status(400).send("Email does not match.");
    }

    // Check if the entered code matches the stored session code
    if (code == req.session.verificationCode) {
        db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).send("Internal Server Error");
            }

            if (results.length === 0) {
                return res.status(404).send("User not found.");
            }

            const user = results[0];
            const password = user.password; // Fetch the password

            // Update registered status
            db.query("UPDATE users SET registered = TRUE WHERE email = ?", [email], (err) => {
                if (err) {
                    console.error("Database update error:", err);
                    return res.status(500).send("Error updating approval status.");
                }

                req.session.destroy(); // Clear session after verification
                res.json({
                    message: "Email verified successfully! Account registered.",
                    generatedPassword: `Email verified successfully! Account registered.`
                });
                
            });
        });
    } else {
        req.session.destroy(); // Prevent infinite retries with the same session
        res.status(400).send("Invalid code. Request a new one.");
    }
});





// Database Connection
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root', 
//     password: 'root', 
//     database: 'users_db' 
// });

// const db = mysql.createPool({
//     host: process.env.DB_HOST, 
//     user: process.env.DB_USER, 
//     password: process.env.DB_PASS, 
//     database: process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

const db = mysql.createConnection(process.env.JAWSDB_URL);

db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to MySQL database');
    connection.release(); // Release the connection
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
`

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
    console.log('Users table created');
});

db.query(createCourtsTable, (err) => {
    if (err) throw err;
    console.log('Court table created');
});

function generateRandomPassword(callback) {
    const words = [
        "bear", "lion", "wolf", "frog", "hawk", "seal", "deer", "crow", 
        "cat", "dog", "fox", "bird", "fish", "duck", "moth", "bee", 
        "rose", "lily", "daisy", "iris", "fern", "ivy", "bloom", 
        "gold", "blue", "pink", "red", "cyan", "gray", "aqua", "teal", 
        "amber", "peach", "plum", "green", "snow", "lava", "sky", 
        "fire", "wood", "leaf", "sand", "stone", "vibe", "glow",     
        "bmw", "kia", "gmc", "audi", "ford", "jeep", "tesla", "volvo", 
        "opel", "mazda"
    ];

    const randomWord = words[Math.floor(Math.random() * words.length)];

    db.query("SELECT password FROM users WHERE password = ?", [randomWord], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return;
        }

        if (results.length > 0) {
            generateRandomPassword(callback);
        } else {
            callback(randomWord);
        }
    });
}


// Routes
app.post('/register', (req, res) => {
    const { username, password, firstName, lastName } = req.body;
    const email = username; 

    const checkUserQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkUserQuery, [username], (err, result) => {
        if (err) {
            console.log("Error checking duplicates:", err);
            return res.status(500).json({ message: 'Error checking user data' });
        }

        if (result.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const sql = 'INSERT INTO users (username, password, firstName, lastName, email) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [username, password, firstName, lastName, email], (err, result) => {
            if (err) {
                console.log("Error inserting user:", err);
                return res.status(500).json({ message: 'Error registering user' });
            }
            res.json({ message: 'User registered successfully' });
        });
    });
});


  
// Login Route
// app.post('/login', (req, res) => {
//     const { username, password } = req.body;
//     const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
//     db.query(sql, [username, password], (err, result) => {
//         if (err) throw err;
//         if (result.length > 0) {
//             res.json({ message: 'Login successful' });
//         } else {
//             res.status(401).json({ error: 'Invalid credentials' });
//         }
//     });
// });

app.post("/check-login-id", (req, res) => {
    const { loginID } = req.body;
  
    const query = "SELECT * FROM users WHERE email = ? OR username = ?";
    db.query(query, [loginID, loginID], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send({ exists: false });
      }
      if (results.length > 0) {
        return res.json({ exists: true }); // User exists
      } else {
        return res.json({ exists: false }); // User does not exist
      }
    });
  });


app.post('/check-email', (req, res) => {
    const { loginID } = req.body;  // loginID is either the email or username entered by the user

    // Query to check if the email exists in the database
    const query = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
    db.query(query, [loginID], (err, result) => {
        if (err) {
            // If there's an error with the database query
            return res.status(500).json({ error: 'Database error' });
        }

        // If count > 0, it means the email exists
        const emailExists = result[0].count > 0;
        res.json({ exists: emailExists });  // Respond with JSON
    });
});


app.get('/users', (req, res) => {
    const sql = 'SELECT username, password, firstName, lastName, email, registered, membership, signInDate, isSignedIn FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch users' });
        }
        res.json(results);
    });
});

app.put('/users/:username', (req, res) => {
    const { username } = req.params;
    const { password, firstName, lastName, email, registered, membership, signInDate, isSignedIn } = req.body;

    // Ensure at least one field to update
    if (!password && !firstName && !lastName && !email && registered === undefined) {
        return res.status(400).json({ error: 'No data provided to update' });
    }

    // Query to check if the user exists
    const checkUserApprovalQuery = 'SELECT registered FROM users WHERE username = ?';
    db.query(checkUserApprovalQuery, [username], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to check user approval status' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Dynamically build the SET clause based on provided fields
        let updates = [];
        let values = [];

        if (password) {
            updates.push('password = ?');
            values.push(password);
        }
        if (firstName) {
            updates.push('firstName = ?');
            values.push(firstName);
        }
        if (lastName) {
            updates.push('lastName = ?');
            values.push(lastName);
        }
        if (email) {
            updates.push('email = ?');
            values.push(email);
        }
        if (registered !== undefined) {
            updates.push('registered = ?');
            values.push(registered);
        }
        if (membership !== undefined) {
            updates.push('membership = ?');
            values.push(membership);
        }
        if (signInDate !== undefined) {
            updates.push('signInDate = ?');
            values.push(signInDate);
        }
        if (isSignedIn !== undefined) {
            updates.push('isSignedIn = ?');
            values.push(isSignedIn);
        }

        // Ensure there are fields to update
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Build the update query
        const query = `UPDATE users SET ${updates.join(', ')} WHERE username = ?`;
        values.push(username);

        // Execute the update query
        db.query(query, values, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error', details: err });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ message: 'User updated successfully' });
        });
    });
});

app.post('/users/validate', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT password, registered, isSignedIn FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = results[0];

        if (user.password !== password) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        if (user.registered !== 1) {
            return res.status(403).json({ error: 'User not registered. Please verify your email.' });
        }

        if (user.isSignedIn !== 1) {
            return res.status(403).json({ error: 'User not signed in. Please sign in first.' });
        }

        return res.status(200).json({ message: 'User validated successfully' });
    });
});


// Endpoint to update the isSignedIn status
app.put('/update-signin-status', (req, res) => {
    const { loginID, isSignedIn } = req.body;
  
    const query = 'UPDATE users SET isSignedIn = ? WHERE email = ?';  // Assuming you're using email as loginID
    db.query(query, [isSignedIn, loginID], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update sign-in status' });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json({ success: true });
    });
  });
  


// Delete User
app.delete('/users/:username', (req, res) => {
    const { username } = req.params;
    const sql = 'DELETE FROM users WHERE username = ?';
    db.query(sql, [username], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error deleting user' });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

let courts = {
    "Court 1": { timeLeft: 150, currentPlayers: [], queue: [] },
    "Court 2": { timeLeft: 20, currentPlayers: [], queue: [] },
    "Court 3": { timeLeft: 20, currentPlayers: [], queue: [] },
    "Court 4": { timeLeft: 20, currentPlayers: [], queue: [] },
    "Court 5": { timeLeft: 20, currentPlayers: [], queue: [] },
    "Court 6": { timeLeft: 20, currentPlayers: [], queue: [] },
    "Court 7": { timeLeft: 20, currentPlayers: [], queue: [] },
    "Court 8": { timeLeft: 20, currentPlayers: [], queue: [] },
    "Court 9": { timeLeft: 20, currentPlayers: [], queue: [] },
    "Court 10": { timeLeft: 20, currentPlayers: [], queue: [] }
};


function startCourtTimers() {
    setInterval(() => {
        Object.keys(courts).forEach(court => {
            const courtData = courts[court];
            if (courtData.currentPlayers.length > 0 && courtData.timeLeft > 0) {
                courtData.timeLeft--; 
            } else if (courtData.timeLeft === 0 && courtData.queue.length > 0) {
                courtData.currentPlayers = courtData.queue.shift();
                courtData.timeLeft = 150; // Reset the timer 
            }
        });
    }, 1000); 
}

startCourtTimers();

app.get('/courts', (req, res) => {
    res.json(courts);
});

app.post('/update-courts', (req, res) => {
    courts = req.body;
    res.json({ message: 'Court data updated successfully.' });
});

app.post('/unbook-court', async (req, res) => {
    const { courtId, playersToRemove } = req.body;
  
    if (!courtId || !Array.isArray(playersToRemove) || playersToRemove.length === 0) {
      return res.status(400).send("Court ID and players to remove are required.");
    }
  
    try {
      const court = courts[courtId];
      if (!court) {
        return res.status(404).send('Court not found.');
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
        return res.status(400).send('No players were removed.');
      }
  
      const removeQuery = 'DELETE FROM court_players WHERE user_id IN (?) AND court_id = ?';
      const [result] = await db.promise().query(removeQuery, [playersToRemove, courtId]);
  
      if (result.affectedRows === 0) {
        return res.status(500).send('Failed to remove players from the database.');
      }
  
      res.status(200).json({
        message: 'Players removed successfully',
        removedPlayers,
        courtState: court
      });
  
    } catch (error) {
      console.error('Error unbooking players:', error);
      res.status(500).send('Error unbooking players.');
    }
  });
  



// Remove player from a court
app.delete('/remove-player/:playerId', async (req, res) => {
    const playerId = req.params.playerId;  

    try {
        const [result] = await db.promise().query('SELECT * FROM court_players WHERE player_id = ?', [playerId]);

        if (result.length === 0) {
            return res.status(404).send('Player not found.');
        }

        await db.promise().query('DELETE FROM court_players WHERE player_id = ?', [playerId]);

        res.status(200).send('Player removed successfully!');
    } catch (error) {
        console.error('Error removing player:', error);
        res.status(500).send('Error removing player.');
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
  
    const sql = 'SELECT email, status, password FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: 'Database query failed' });
      }
  
      console.log('Query results:', results);
  
      if (results.length === 0) {
        return res.status(404).json({ status: "failed" });
      }
  
      const user = results[0];
  
      if (user.status === "approved") {
        const updateSql = 'UPDATE users SET isSignedIn = 1 WHERE email = ?';
        db.query(updateSql, [email], (err, updateResults) => {
            if (err) {
                console.error('Failed to update isSignedIn:', err);
                return res.status(500).json({ error: 'Failed to update user status' });
            }
            return res.json({ status: 'approved', password: user.password });
        });
    }
    
  
      if (user.status === "pending") {
        return res.status(200).json({ status: "pending" });
      }
  
      if (user.status === "denied") {
        const updateSql = 'UPDATE users SET status = "pending" WHERE email = ?';
        db.query(updateSql, [email], (err, updateResults) => {
            if (err) {
                console.error('Failed to update status:', err);
                return res.status(500).json({ error: 'Failed to update user status' });
            }
            return res.status(200).json({ status: "pending" });
        });
    }
    });
});


// Admin fetch pending users
app.get("/admin/pending", (req, res) => {
    const sql = 'SELECT username, email FROM users WHERE status = "pending"';
    db.query(sql, (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database query failed' });
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
        // Update the user's password and set the status to 'approved'
        const sql = 'UPDATE users SET password = ?, status = "approved" WHERE username = ?';
        db.query(sql, [newPassword, username], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database query failed' });
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
        return res.status(500).json({ error: 'Database query failed' });
      }
  
      res.status(200).json({ status: "denied" });
    });
  });
  

app.use(express.static(__dirname));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

