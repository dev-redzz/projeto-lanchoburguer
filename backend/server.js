// ============================================
// LanchoBurguer - Server Entry Point
// server.js
// ============================================
'use strict';

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB = require('./config/database');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Conectar ao banco de dados ──
connectDB();

// ── Middlewares globais ──
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Arquivos estáticos (uploads) ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rotas ──
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/settings',   require('./routes/settings'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor',
  });
});

// ── Iniciar servidor ──
app.listen(PORT, () => {
  console.log(`\n🍔 LanchoBurguer API rodando!`);
  console.log(`🚀 Servidor: http://localhost:${PORT}`);
  console.log(`📋 Health:   http://localhost:${PORT}/api/health`);
  console.log(`🌎 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});
