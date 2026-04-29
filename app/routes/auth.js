const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ?', [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid)
      return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ message: 'Login exitoso', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashed]
    );
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;