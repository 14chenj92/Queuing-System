const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

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
    email VARCHAR(60) NOT NULL UNIQUE
)`;



db.query(createUsersTable, (err) => {
    if (err) throw err;
    console.log('Users table created');
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

        // If the result is not empty, it means username or email already exists
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
    const sql = 'SELECT username, password FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch users' });
        }
        res.json(results);
    });
});

app.put('/users/:username', (req, res) => {
    const { username } = req.params;
    const { password } = req.body;

    const sql = 'UPDATE users SET password = ? WHERE username = ?';
    db.query(sql, [password, username], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error updating password' });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'Password updated successfully' });
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
    "Court 9": { timeLeft: 20, currentPlayers: [], queue: [] }
};


function startCourtTimers() {
    setInterval(() => {
        Object.keys(courts).forEach(court => {
            const courtData = courts[court];
            if (courtData.currentPlayers.length > 0 && courtData.timeLeft > 0) {
                courtData.timeLeft--; // Decrement the time left by 1 second
            } else if (courtData.timeLeft === 0 && courtData.queue.length > 0) {
                // Move the next group in the queue to the current players
                courtData.currentPlayers = courtData.queue.shift();
                courtData.timeLeft = 20; // Reset the timer for the next group
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

app.delete('/remove-player/:id', async (req, res) => {
    const playerId = req.params.id;

    try {
        await db.query('DELETE FROM court_players WHERE player_id = ?', [playerId]);
        res.status(200).send('Player removed successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error removing player');
    }
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
