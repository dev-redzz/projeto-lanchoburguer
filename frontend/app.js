/* ========================================
   LANCHOBURGUER - DELIVERY SYSTEM
   app.js
   ======================================== */

'use strict';

// =========================================
// CONFIG - Altere o número do WhatsApp aqui
// =========================================
const CONFIG = {
  whatsappNumber: '5599984323844', // Número com DDI + DDD (sem espaços ou traços)
  deliveryFee: 5.00,
  storeName: 'LanchoBurguer',
  freeDeliveryAbove: 50.00,  // Frete grátis acima desse valor
  apiUrl: 'https://projeto-lanchoburguer-production.up.railway.app/api', // URL do backend
  useApi: true, // true = busca dados do backend; false = usa dados mockados
};

// =========================================
// DADOS MOCKADOS (enquanto backend não está)
// =========================================
const MOCK_PRODUCTS = [
  {
    _id: '1', name: 'X-Burguer Clássico', category: 'hambúrgueres',
    description: 'Pão brioche, hambúrguer 180g, queijo cheddar, alface, tomate e molho especial.',
    price: 24.90, emoji: '🍔', featured: true
  },
  {
    _id: '2', name: 'X-Bacon Smash', category: 'hambúrgueres',
    description: 'Dois smash burgers, bacon crocante, queijo americano e maionese defumada.',
    price: 32.90, emoji: '🥓', featured: true
  },
  {
    _id: '3', name: 'X-Frango Crispy', category: 'hambúrgueres',
    description: 'Frango empanado crocante, cream cheese, jalapeño e coleslaw especial.',
    price: 27.90, emoji: '🍗', featured: false
  },
  {
    _id: '4', name: 'Combo Família', category: 'combos',
    description: '2 X-Burguer Clássico + 2 Batatas Médias + 2 Refrigerantes. Para 2 pessoas!',
    price: 69.90, emoji: '🎁', featured: true
  },
  {
    _id: '5', name: 'Combo Solteiro', category: 'combos',
    description: 'X-Bacon Smash + Batata Frita P + Refrigerante lata.',
    price: 42.90, emoji: '🎯', featured: false
  },
  {
    _id: '6', name: 'Batata Frita Rústica', category: 'porções',
    description: 'Batata rústica crocante com orégano, alho e sal temperado. Serve 2 pessoas.',
    price: 18.90, emoji: '🍟', featured: false
  },
  {
    _id: '7', name: 'Onion Rings', category: 'porções',
    description: 'Argolas de cebola empanadas e fritas, com molho ranch. Serve 2.',
    price: 16.90, emoji: '🧅', featured: false
  },
  {
    _id: '8', name: 'Coca-Cola Lata', category: 'bebidas',
    description: 'Refrigerante gelado 350ml.',
    price: 6.00, emoji: '🥤', featured: false
  },
  {
    _id: '9', name: 'Suco Natural', category: 'bebidas',
    description: 'Laranja, limão ou maracujá - 400ml.',
    price: 9.00, emoji: '🍹', featured: false
  },
  {
    _id: '10', name: 'Milk Shake', category: 'bebidas',
    description: 'Chocolate, morango ou baunilha - 500ml.',
    price: 16.00, emoji: '🥛', featured: false
  },
];

// =========================================
// STATE
// =========================================
let cart = [];
let products = [];
let currentCategory = 'todos';

// =========================================
// UTILS
// =========================================
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function showToast(message, type = '') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toastContainer';
  div.className = 'toast-container';
  document.body.appendChild(div);
  return div;
}

// =========================================
// PRODUCTS - Buscar e Renderizar
// =========================================
async function fetchProducts() {
  if (CONFIG.useApi) {
    try {
      const res = await fetch(`${CONFIG.apiUrl}/products`);
      if (!res.ok) throw new Error('Falha na API');
      const data = await res.json();
      products = data;
    } catch (err) {
      console.warn('API indisponível, usando dados mockados:', err.message);
      products = MOCK_PRODUCTS;
    }
  } else {
    products = MOCK_PRODUCTS;
  }
}

function renderProducts(list) {
  const grid = document.getElementById('productsGrid');

  if (!list || list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px; color: var(--gray-light);">
        <div style="font-size:4rem; margin-bottom:16px;">🔍</div>
        <p style="font-size:1.1rem; font-weight:700;">Nenhum produto encontrado</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(product => `
    <div class="product-card" data-id="${product._id}">
      <div class="product-card__image">${product.emoji || '🍔'}</div>
      <div class="product-card__body">
        <div class="product-card__cat">${product.category}</div>
        <h3 class="product-card__name">${product.name}</h3>
        <p class="product-card__desc">${product.description}</p>
        <div class="product-card__footer">
          <div class="product-card__price">
            <span>R$</span>${product.price.toFixed(2).replace('.', ',')}
          </div>
          <button class="btn-add" onclick="addToCart('${product._id}')">
            + Adicionar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function initProducts() {
  await fetchProducts();

  // Remove skeletons e mostra produtos
  setTimeout(() => {
    renderProducts(products);
  }, 800); // Simula delay de loading

  // Filtros de categoria
  document.getElementById('categoriesFilter').addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;

    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentCategory = btn.dataset.category;
    const filtered = currentCategory === 'todos'
      ? products
      : products.filter(p => p.category === currentCategory);
    renderProducts(filtered);
  });
}

// =========================================
// CART
// =========================================
function addToCart(productId) {
  const product = products.find(p => p._id === productId);
  if (!product) return;

  const existing = cart.find(item => item._id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  openCart();
  showToast(`✅ ${product.name} adicionado!`);

  // Animação no badge
  const badge = document.getElementById('cartBadge');
  badge.classList.remove('bump');
  void badge.offsetWidth; // reflow
  badge.classList.add('bump');
}

function removeFromCart(productId) {
  cart = cart.filter(item => item._id !== productId);
  updateCartUI();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i._id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  updateCartUI();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getDeliveryFee() {
  const subtotal = getCartTotal();
  return subtotal >= CONFIG.freeDeliveryAbove ? 0 : CONFIG.deliveryFee;
}

function updateCartUI() {
  const count = getCartCount();
  const subtotal = getCartTotal();
  const deliveryFee = getDeliveryFee();
  const total = subtotal + deliveryFee;

  // Badge
  document.getElementById('cartBadge').textContent = count;

  // Items
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmptyEl = document.getElementById('cartEmpty');
  const cartFooter = document.getElementById('cartFooter');

  if (cart.length === 0) {
    cartEmptyEl.style.display = 'flex';
    cartFooter.style.display = 'none';
    cartItemsEl.innerHTML = '';
    cartItemsEl.appendChild(cartEmptyEl);
    return;
  }

  cartEmptyEl.style.display = 'none';
  cartFooter.style.display = 'block';

  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item__emoji">${item.emoji || '🍔'}</div>
      <div class="cart-item__info">
        <div class="cart-item__name">${item.name}</div>
        <div class="cart-item__price">${formatCurrency(item.price * item.qty)}</div>
      </div>
      <div class="cart-item__controls">
        <button class="qty-btn" onclick="changeQty('${item._id}', -1)">−</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item._id}', 1)">+</button>
      </div>
    </div>
  `).join('');

  // Footer
  document.getElementById('cartSubtotal').textContent = formatCurrency(subtotal);
  document.getElementById('cartDelivery').textContent = deliveryFee === 0
    ? '🎉 Grátis'
    : formatCurrency(deliveryFee);
  document.getElementById('cartTotal').textContent = formatCurrency(total);
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// =========================================
// CHECKOUT
// =========================================
function openCheckout() {
  if (cart.length === 0) {
    showToast('⚠️ Adicione itens ao carrinho primeiro!', 'error');
    return;
  }

  closeCart();
  renderOrderSummary();
  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function renderOrderSummary() {
  const deliveryFee = getDeliveryFee();
  const total = getCartTotal() + deliveryFee;

  const html = `
    <h4>📋 Resumo do Pedido</h4>
    ${cart.map(item => `
      <div class="order-summary-item">
        <span>${item.emoji} ${item.name} (${item.qty}x)</span>
        <span>${formatCurrency(item.price * item.qty)}</span>
      </div>
    `).join('')}
    <div class="order-summary-item">
      <span>Taxa de entrega</span>
      <span>${deliveryFee === 0 ? '🎉 Grátis' : formatCurrency(deliveryFee)}</span>
    </div>
    <div class="order-summary-total">
      <span>Total</span>
      <span>${formatCurrency(total)}</span>
    </div>
  `;
  document.getElementById('orderSummary').innerHTML = html;
}

function sendWhatsApp() {
  const name    = document.getElementById('clientName').value.trim();
  const phone   = document.getElementById('clientPhone').value.trim();
  const address = document.getElementById('clientAddress').value.trim();
  const obs     = document.getElementById('clientObs').value.trim();

  if (!name || !phone || !address) {
    showToast('⚠️ Preencha todos os campos obrigatórios!', 'error');
    return;
  }

  if (cart.length === 0) {
    showToast('⚠️ Seu carrinho está vazio!', 'error');
    return;
  }

  const deliveryFee = getDeliveryFee();
  const total = getCartTotal() + deliveryFee;

  const itemsText = cart.map(item =>
    `• ${item.name} (${item.qty}x) - ${formatCurrency(item.price * item.qty)}`
  ).join('\n');

  const message = [
    `🍔 *Pedido - ${CONFIG.storeName}*`,
    ``,
    `👤 *Nome:* ${name}`,
    `📞 *Telefone:* ${phone}`,
    `📍 *Endereço:* ${address}`,
    ``,
    `🛒 *Itens do Pedido:*`,
    itemsText,
    ``,
    `🚚 Taxa de entrega: ${deliveryFee === 0 ? 'Grátis 🎉' : formatCurrency(deliveryFee)}`,
    `💰 *Total: ${formatCurrency(total)}*`,
    obs ? `\n📝 *Obs:* ${obs}` : '',
    ``,
    `_Pedido feito pelo site_`,
  ].filter(line => line !== undefined).join('\n');

  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encoded}`;

  // Salvar pedido na API (se disponível)
  saveOrder({ name, phone, address, obs, items: cart, total });

  window.open(url, '_blank');

  // Limpar após envio
  cart = [];
  updateCartUI();
  closeCheckout();
  document.getElementById('clientName').value = '';
  document.getElementById('clientPhone').value = '';
  document.getElementById('clientAddress').value = '';
  document.getElementById('clientObs').value = '';

  showToast('✅ Pedido enviado! Verifique o WhatsApp.', 'success');
}

async function saveOrder(orderData) {
  if (!CONFIG.useApi) return;
  try {
    await fetch(`${CONFIG.apiUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
  } catch (err) {
    console.warn('Não foi possível salvar o pedido na API:', err.message);
  }
}

// =========================================
// HEADER SCROLL EFFECT
// =========================================
function initHeaderScroll() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      header.style.boxShadow = '0 4px 20px rgba(255,193,7,0.15)';
    } else {
      header.style.boxShadow = 'none';
    }
  });
}

// =========================================
// PHONE MASK
// =========================================
function initPhoneMask() {
  const phoneInput = document.getElementById('clientPhone');
  if (!phoneInput) return;
  phoneInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) {
      v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    } else if (v.length > 0) {
      v = `(${v}`;
    }
    e.target.value = v;
  });
}

// =========================================
// EVENT LISTENERS
// =========================================
function initEventListeners() {
  // Header cart button
  document.getElementById('btnCart').addEventListener('click', openCart);

  // Cart close
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);

  // "Ver Cardápio" no carrinho vazio
  document.getElementById('btnGoToMenu')?.addEventListener('click', closeCart);

  // Checkout button
  document.getElementById('btnCheckout').addEventListener('click', openCheckout);

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeCheckout);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCheckout();
  });

  // Send WhatsApp
  document.getElementById('btnSendWhatsApp').addEventListener('click', sendWhatsApp);

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeCheckout();
    }
  });
}

// =========================================
// INIT
// =========================================
async function init() {
  initEventListeners();
  initHeaderScroll();
  initPhoneMask();
  updateCartUI();
  await initProducts();
}

document.addEventListener('DOMContentLoaded', init);
