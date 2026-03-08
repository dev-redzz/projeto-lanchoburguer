// routes/settings.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/auth');

const getSettings = () => {
  try { return require('mongoose').model('Settings'); } catch { return null; }
};

// GET /api/settings (público)
router.get('/', async (req, res) => {
  try {
    const Settings = getSettings();
    if (!Settings) return res.json({
      storeName:         'LanchoBurguer',
      whatsappNumber:    process.env.WHATSAPP_NUMBER || '5511999999999',
      deliveryFee:       parseFloat(process.env.DELIVERY_FEE) || 5.00,
      freeDeliveryAbove: parseFloat(process.env.FREE_DELIVERY_ABOVE) || 50.00,
      isOpen: true,
    });
    let s = await Settings.findOne();
    if (!s) s = await Settings.create({});
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings (admin)
router.put('/', protect, async (req, res) => {
  try {
    const Settings = getSettings();
    let s = await Settings.findOne();
    if (!s) { s = await Settings.create(req.body); }
    else { Object.assign(s, req.body); s.updatedAt = Date.now(); await s.save(); }
    res.json(s);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
