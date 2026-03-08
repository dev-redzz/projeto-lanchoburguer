// routes/orders.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/auth');

const getOrder = () => {
  try { return require('mongoose').model('Order'); } catch { return null; }
};

// POST /api/orders (público)
router.post('/', async (req, res) => {
  try {
    const Order = getOrder();
    if (!Order) return res.status(201).json({ message: 'Pedido recebido' });

    const { name, phone, address, obs, items, total } = req.body;
    const orderItems = items.map(i => ({
      productId: i._id,
      name:      i.name,
      price:     i.price,
      qty:       i.qty,
      subtotal:  i.price * i.qty,
    }));
    const subtotal    = orderItems.reduce((s, i) => s + i.subtotal, 0);
    const deliveryFee = Math.max(0, total - subtotal);

    const order = await Order.create({
      clientName: name, clientPhone: phone, clientAddress: address,
      items: orderItems, subtotal, deliveryFee, total,
      observations: obs || '',
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders (admin)
router.get('/', protect, async (req, res) => {
  try {
    const Order = getOrder();
    if (!Order) return res.json({ orders: [], total: 0, pages: 0 });
    const { status, limit = 50, page = 1 } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 })
      .limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Order.countDocuments(filter);
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status (admin)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const Order = getOrder();
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders/stats (admin - dashboard)
router.get('/stats', protect, async (req, res) => {
  try {
    const Order = getOrder();
    if (!Order) return res.json({ totalOrders: 0, revenue: 0, recentOrders: [] });

    const [totalOrders, revenue, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.find().sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      totalOrders,
      revenue: revenue[0]?.total || 0,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
