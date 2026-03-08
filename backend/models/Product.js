// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  image:       { type: String, default: '' },
  emoji:       { type: String, default: '🍔' },
  category:    { type: String, required: true, trim: true, lowercase: true },
  available:   { type: Boolean, default: true },
  featured:    { type: Boolean, default: false },
  order:       { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
