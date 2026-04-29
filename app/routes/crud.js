const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Todas las rutas CRUD requieren token JWT
router.use(verifyToken);

// GET /api/products — listar todos
router.get('/', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM products');
  res.json(rows);
});

// GET /api/products/:id — obtener uno
router.get('/:id', async (req, res) => {
  const [rows] = await db.execute(
    'SELECT * FROM products WHERE id = ?', [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

// POST /api/products — crear
router.post('/', async (req, res) => {
  const { name, description, price } = req.body;
  const [result] = await db.execute(
    'INSERT INTO products (name, description, price) VALUES (?, ?, ?)',
    [name, description, price]
  );
  res.status(201).json({ id: result.insertId, name, description, price });
});

// PUT /api/products/:id — actualizar
router.put('/:id', async (req, res) => {
  const { name, description, price } = req.body;
  await db.execute(
    'UPDATE products SET name=?, description=?, price=? WHERE id=?',
    [name, description, price, req.params.id]
  );
  res.json({ message: 'Producto actualizado' });
});

// DELETE /api/products/:id — eliminar
router.delete('/:id', async (req, res) => {
  await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Producto eliminado' });
});

module.exports = router;