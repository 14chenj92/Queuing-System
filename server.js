const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const session = require("express-session");

const cors = require("cors");

// Middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000", 
    credentials: true
}));

app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 5 * 60 * 1000 } 
}));

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



// Verify the code
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

            // Update approved status
            db.query("UPDATE users SET approved = TRUE WHERE email = ?", [email], (err) => {
                if (err) {
                    console.error("Database update error:", err);
                    return res.status(500).send("Error updating approval status.");
                }

                req.session.destroy(); // Clear session after verification
                res.send("Email verified successfully! Account approved.");
            });
        });
    } else {
        req.session.destroy(); // Prevent infinite retries with the same session
        res.status(400).send("Invalid code. Request a new one.");
    }
});




// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'root', 
    database: 'users_db' 
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to MySQL database');
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
    approved BOOLEAN DEFAULT FALSE
)`;

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

// Routes
app.post('/register', (req, res) => {
    const { username, password, firstName, lastName, email } = req.body;

    // Check if username already exists
    const checkUserQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
    db.query(checkUserQuery, [username, email], (err, result) => {
        if (err) {
            console.log("Error checking duplicates:", err);
            return res.status(500).json({ message: 'Error checking user data' });
        }

        if (result.length > 0) {
            const existingUser = result[0];
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        // If no duplicates, proceed with the insertion
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
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.json({ message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

app.get('/users', (req, res) => {
    const sql = 'SELECT username, password, firstName, lastName, email, approved FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch users' });
        }
        res.json(results);
    });
});

app.put('/users/:username', (req, res) => {
    const { username } = req.params;
    const { password, firstName, lastName, email, approved } = req.body;

    // Ensure at least one field to update
    if (!password && !firstName && !lastName && !email && approved === undefined) {
        return res.status(400).json({ error: 'No data provided to update' });
    }

    // Query to check if the user is approved
    const checkUserApprovalQuery = 'SELECT approved FROM users WHERE username = ?';
    db.query(checkUserApprovalQuery, [username], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to check user approval status' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If the user is not approved, prevent update
        // if (result[0].approved !== 1) {
        //     return res.status(403).json({ error: `User ${username} is not approved. Please verify your email first.` });
        // }

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
        if (approved !== undefined) {
            updates.push('approved = ?');
            values.push(approved);
        }

        // Ensure there are fields to update
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

    const sql = 'SELECT password, approved FROM users WHERE username = ?';
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

        if (user.approved !== 1) {
            return res.status(403).json({ error: 'User not approved. Please verify your email.' });
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
    "Court 1": { timeLeft: 20, currentPlayers: [], queue: [] },
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
                courtData.timeLeft = 20; // Reset the timer 
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


app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
