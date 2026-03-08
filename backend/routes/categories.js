// routes/categories.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middlewares/auth');

const getCat = () => {
  try { return mongoose.model('Category'); } catch { return null; }
};

// GET /api/categories (público)
router.get('/', async (req, res) => {
  try {
    const Cat = getCat();
    if (!Cat) return res.json([
      { _id: '1', name: 'Hambúrgueres', slug: 'hambúrgueres', emoji: '🍔' },
      { _id: '2', name: 'Combos',       slug: 'combos',       emoji: '🎁' },
      { _id: '3', name: 'Porções',      slug: 'porções',      emoji: '🍟' },
      { _id: '4', name: 'Bebidas',      slug: 'bebidas',      emoji: '🥤' },
    ]);
    const cats = await Cat.find({ active: true }).sort({ order: 1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories (admin)
router.post('/', protect, async (req, res) => {
  try {
    const Cat = getCat();
    const { name, emoji, order } = req.body;
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
    const cat = await Cat.create({ name, slug, emoji, order: parseInt(order) || 0 });
    res.status(201).json(cat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/categories/:id (admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const Cat = getCat();
    const cat = await Cat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(cat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/categories/:id (admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const Cat = getCat();
    await Cat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Categoria removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
