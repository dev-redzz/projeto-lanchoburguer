// routes/products.js
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const Product  = require('../models/Product');
const { protect } = require('../middlewares/auth');

// Config multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas'));
  },
});

// ── GET /api/products (público) ──
router.get('/', async (req, res) => {
  try {
    const { category, available } = req.query;
    const filter = {};
    if (category)  filter.category = category.toLowerCase();
    if (available !== undefined) filter.available = available === 'true';

    const products = await Product.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/products/:id (público) ──
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/products (admin) ──
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, emoji, featured, available, order } = req.body;
    const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : '';

    const product = await Product.create({
      name, description, price: parseFloat(price), category,
      emoji, image: imageUrl, featured: featured === 'true',
      available: available !== 'false', order: parseInt(order) || 0,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PUT /api/products/:id (admin) ──
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = `/uploads/products/${req.file.filename}`;
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.featured !== undefined) updates.featured = updates.featured === 'true';
    if (updates.available !== undefined) updates.available = updates.available !== 'false';

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/products/:id (admin) ──
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ message: 'Produto removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
