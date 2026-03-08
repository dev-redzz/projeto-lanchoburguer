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


// models/Category.js
const mongoose2 = require('mongoose');

const CategorySchema = new mongoose2.Schema({
  name:      { type: String, required: true, trim: true },
  slug:      { type: String, required: true, unique: true, lowercase: true },
  emoji:     { type: String, default: '🍽️' },
  order:     { type: Number, default: 0 },
  active:    { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose2.model('Category', CategorySchema);


// models/Order.js
const mongoose3 = require('mongoose');

const OrderItemSchema = new mongoose3.Schema({
  productId:   String,
  name:        String,
  price:       Number,
  qty:         Number,
  subtotal:    Number,
}, { _id: false });

const OrderSchema = new mongoose3.Schema({
  clientName:    { type: String, required: true },
  clientPhone:   { type: String, required: true },
  clientAddress: { type: String, required: true },
  items:         [OrderItemSchema],
  subtotal:      { type: Number, required: true },
  deliveryFee:   { type: Number, default: 5.00 },
  total:         { type: Number, required: true },
  observations:  { type: String, default: '' },
  status: {
    type: String,
    enum: ['novo', 'confirmado', 'preparando', 'saiu', 'entregue', 'cancelado'],
    default: 'novo',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose3.model('Order', OrderSchema);


// models/Settings.js
const mongoose4 = require('mongoose');

const SettingsSchema = new mongoose4.Schema({
  storeName:         { type: String, default: 'LanchoBurguer' },
  whatsappNumber:    { type: String, default: '5511999999999' },
  deliveryFee:       { type: Number, default: 5.00 },
  freeDeliveryAbove: { type: Number, default: 50.00 },
  openingHours: {
    weekdays: { type: String, default: '11:00 - 23:00' },
    weekends:  { type: String, default: '11:00 - 00:00' },
  },
  orderMessageTemplate: {
    type: String,
    default: '🍔 Pedido - {storeName}\n\nNome: {name}\nTelefone: {phone}\nEndereço: {address}\n\nItens:\n{items}\n\nTotal: {total}',
  },
  isOpen:    { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose4.model('Settings', SettingsSchema);
