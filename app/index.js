const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db'); // conexión a MySQL
const authRoutes = require('./routes/auth');
const crudRoutes = require('./routes/crud');

const app = express();
const PORT = process.env.PORT || 8081;
const INSTANCE_ID = process.env.INSTANCE_ID || 'A';


// Middlewares
app.use(cors());
// Ruta de info — útil para el frontend
app.get('/api/info', (req, res) => {
  res.json({
    backend: `Backend en puerto ${PORT}`,
    port: PORT
  });
});
app.use(express.json());

// 🔥 Verificar conexión a la base de datos al iniciar
(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ Conectado a MySQL");
    conn.release();
  } catch (err) {
    console.error("❌ Error DB:", err.message);
  }
})();

// Ruta de prueba
/*app.get('/', (req, res) => {
  res.json({
    message: '✅ Server activo',
    backend: `Backend en puerto ${PORT}`,
    timestamp: new Date().toISOString()
  });
});*/
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static('public'));

// Rutas
app.use('/auth', authRoutes);
app.use('/api/products', crudRoutes);

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});