const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { authenticateToken, requireRole, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
});

router.post('/change-password', authenticateToken, (req, res) => {
  const { oldPassword, newPassword, targetUserId } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old password and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  }

  let targetId = req.user.id;
  
  if (targetUserId && req.user.role === 'BOSS') {
    targetId = targetUserId;
  } else if (targetUserId && req.user.role !== 'BOSS') {
    return res.status(403).json({ error: 'Only BOSS can change other users passwords' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(targetId);

    if (!user) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // If BOSS is changing another user's password, skip old password validation
    // Otherwise, validate the current password
    if (targetId === req.user.id) {
      if (!bcrypt.compareSync(oldPassword, user.password)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    } else if (req.user.role === 'BOSS') {
      // BOSS doesn't need to provide the target user's old password
      // but we still require the oldPassword field for consistency
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    const updateStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    updateStmt.run(hashedPassword, targetId);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

router.get('/users', authenticateToken, requireRole(['BOSS']), (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, username, role, created_at FROM users');
    const users = stmt.all();
    res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

module.exports = router;