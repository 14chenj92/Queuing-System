const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("./db");

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM admins WHERE username = ?", [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = results[0];
    bcrypt.compare(password, admin.password_hash, (err, match) => {
      if (err || !match) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.adminUser = admin.username;
      const isSuperadmin = admin.username === "admin21";
      res.json({ message: "Logged in", superadmin: isSuperadmin });
    });
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

router.post("/create", (req, res) => {
  const currentAdmin = req.session.adminUser;
  if (!currentAdmin) return res.status(403).json({ message: "Unauthorized" });

  const { username, password } = req.body;

  db.query("SELECT * FROM admins WHERE username = ?", [username], (err, existing) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (existing.length > 0) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ message: "Hashing failed" });

      db.query(
        "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
        [username, hash],
        (err) => {
          if (err) return res.status(500).json({ message: "Insert failed" });

          res.json({ message: `Admin '${username}' created.` });
        }
      );
    });
  });
});

router.post("/change-password", (req, res) => {
  const username = req.session.adminUser;
  const { oldPassword, newPassword } = req.body;

  db.query("SELECT * FROM admins WHERE username = ?", [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length === 0) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const admin = results[0];
    bcrypt.compare(oldPassword, admin.password_hash, (err, match) => {
      if (err || !match) {
        return res.status(401).json({ message: "Incorrect old password" });
      }

      bcrypt.hash(newPassword, 10, (err, newHash) => {
        if (err) return res.status(500).json({ message: "Hashing failed" });

        db.query(
          "UPDATE admins SET password_hash = ? WHERE username = ?",
          [newHash, username],
          (err) => {
            if (err) return res.status(500).json({ message: "Update failed" });

            res.json({ message: "Password updated successfully" });
          }
        );
      });
    });
  });
});

router.post("/reset-password", (req, res) => {
  if (req.session.adminUser !== "admin21") {
    return res.status(403).json({ message: "Forbidden: Superadmin only" });
  }

  const { targetUsername, newPassword } = req.body;

  if (!targetUsername || !newPassword) {
    return res.status(400).json({ message: "Missing username or new password" });
  }

  bcrypt.hash(newPassword, 10, (err, newHash) => {
    if (err) return res.status(500).json({ message: "Hashing failed" });

    db.query(
      "UPDATE admins SET password_hash = ? WHERE username = ?",
      [newHash, targetUsername],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Update failed" });

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Admin not found" });
        }

        res.json({ message: `Password reset for '${targetUsername}'` });
      }
    );
  });
});

router.get("/list", (req, res) => {
  if (req.session.adminUser !== "admin21") {
    return res.status(403).json({ message: "Forbidden: Superadmin only" });
  }

  db.query("SELECT username FROM admins", (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching admins" });
    res.json(results);
  });
});

router.post("/edit", (req, res) => {
  if (req.session.adminUser !== "admin21") {
    return res.status(403).json({ message: "Forbidden: Superadmin only" });
  }

  const { oldUsername, newUsername, newPassword } = req.body;

  if (!oldUsername || !newUsername || !newPassword) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) return res.status(500).json({ message: "Hash error" });

    db.query(
      "UPDATE admins SET username = ?, password_hash = ? WHERE username = ?",
      [newUsername, hash, oldUsername],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Update failed" });

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Admin not found" });
        }

        res.json({ message: `Admin '${oldUsername}' updated to '${newUsername}'.` });
      }
    );
  });
});

router.delete("/delete", (req, res) => {
  if (req.session.adminUser !== "admin21") {
    return res.status(403).json({ message: "Forbidden: Superadmin only" });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Missing username" });
  }

  if (username === "admin21") {
    return res.status(400).json({ message: "Cannot delete superadmin" });
  }

  db.query("DELETE FROM admins WHERE username = ?", [username], (err, result) => {
    if (err) return res.status(500).json({ message: "Delete failed" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: `Admin '${username}' deleted.` });
  });
});

function createDefaultSuperAdmin() {
  const username = "admin21";
  const plainPassword = "21bc2025";

  db.query("SELECT * FROM admins WHERE username = ?", [username], (err, results) => {
    if (err) return console.error("DB error during admin check:", err);

    if (results.length > 0) {
      console.log(`Admin '${username}' already exists.`);
      return;
    }

    bcrypt.hash(plainPassword, 10, (err, hash) => {
      if (err) return console.error("Error hashing password:", err);

      db.query(
        "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
        [username, hash],
        (err) => {
          if (err) return console.error("Error inserting admin:", err);
          console.log(`Admin '${username}' created.`);
        }
      );
    });
  });
}

setTimeout(createDefaultSuperAdmin, 2000); 

module.exports = router;
