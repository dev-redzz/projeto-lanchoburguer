/* admin.js - LanchoBurguer Admin Panel */
'use strict';

const API = 'http://localhost:3001/api';
let token = localStorage.getItem('lb_admin_token');
let adminUser = null;

// ───────────────────────────────────────────
// AUTH
// ───────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

async function login() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl  = document.getElementById('loginError');

  if (!email || !password) {
    errorEl.textContent = 'Preencha email e senha.';
    errorEl.style.display = 'block';
    return;
  }

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    token = data.token;
    adminUser = data.user;
    localStorage.setItem('lb_admin_token', token);
    showAdmin();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
}

function logout() {
  token = null;
  adminUser = null;
  localStorage.removeItem('lb_admin_token');
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
}

async function checkAuth() {
  if (!token) return showLogin();
  try {
    const data = await apiFetch('/auth/me');
    adminUser = data.user;
    showAdmin();
  } catch {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
}

function showAdmin() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'flex';
  if (adminUser) {
    document.getElementById('adminName').textContent = adminUser.name || 'Admin';
    document.querySelector('.avatar').textContent = (adminUser.name || 'A')[0].toUpperCase();
  }
  navigateTo('dashboard');
}

// ───────────────────────────────────────────
// NAVIGATION
// ───────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  const titles = { dashboard: 'Dashboard', products: 'Produtos', categories: 'Categorias', orders: 'Pedidos', settings: 'Configurações' };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  // Carregar dados da página
  const loaders = { dashboard: loadDashboard, products: loadProducts, categories: loadCategories, orders: loadOrders, settings: loadSettings };
  if (loaders[page]) loaders[page]();
}

// ───────────────────────────────────────────
// DASHBOARD
// ───────────────────────────────────────────
async function loadDashboard() {
  try {
    const [stats, productsData] = await Promise.all([
      apiFetch('/orders/stats'),
      apiFetch('/products'),
    ]);
    document.getElementById('statOrders').textContent  = stats.totalOrders;
    document.getElementById('statRevenue').textContent = `R$ ${(stats.revenue || 0).toFixed(2).replace('.', ',')}`;
    document.getElementById('statProducts').textContent = productsData.length;

    const list = document.getElementById('recentOrdersList');
    if (!stats.recentOrders || stats.recentOrders.length === 0) {
      list.innerHTML = '<p class="loading-text">Nenhum pedido ainda.</p>';
      return;
    }
    list.innerHTML = stats.recentOrders.map(o => `
      <div class="order-row">
        <div>
          <strong>${o.clientName}</strong>
          <div style="font-size:0.8rem;color:var(--gray)">${new Date(o.createdAt).toLocaleString('pt-BR')}</div>
        </div>
        <div>${o.clientPhone}</div>
        <div><strong>R$ ${o.total.toFixed(2).replace('.', ',')}</strong></div>
        <div><span class="status-badge status-${o.status}">${o.status}</span></div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

// ───────────────────────────────────────────
// PRODUCTS
// ───────────────────────────────────────────
let editingProductId = null;

async function loadProducts() {
  try {
    const products = await apiFetch('/products');
    const tbody = document.getElementById('productsTableBody');
    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Nenhum produto cadastrado.</td></tr>';
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td style="font-size:1.5rem">${p.emoji || '🍔'}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.category}</td>
        <td>R$ ${p.price.toFixed(2).replace('.', ',')}</td>
        <td><span class="status-badge ${p.available ? 'status-entregue' : 'status-cancelado'}">${p.available ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn--sm btn--primary" onclick="editProduct('${p._id}')">✏️ Editar</button>
            <button class="btn btn--sm btn--danger" onclick="deleteProduct('${p._id}', '${p.name}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('productsTableBody').innerHTML = `<tr><td colspan="6" class="loading-text">Erro: ${err.message}</td></tr>`;
  }
}

function openProductModal(product = null) {
  editingProductId = product?._id || null;
  document.getElementById('productModalTitle').textContent = product ? 'Editar Produto' : 'Novo Produto';
  document.getElementById('productId').value       = product?._id || '';
  document.getElementById('productName').value     = product?.name || '';
  document.getElementById('productEmoji').value    = product?.emoji || '🍔';
  document.getElementById('productDesc').value     = product?.description || '';
  document.getElementById('productPrice').value    = product?.price || '';
  document.getElementById('productCategory').value = product?.category || '';
  document.getElementById('productAvailable').checked = product?.available !== false;
  document.getElementById('productFeatured').checked  = product?.featured || false;
  document.getElementById('productModalOverlay').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('productModalOverlay').style.display = 'none';
  editingProductId = null;
}

async function editProduct(id) {
  try {
    const product = await apiFetch(`/products/${id}`);
    openProductModal(product);
  } catch (err) {
    alert('Erro ao carregar produto: ' + err.message);
  }
}

async function saveProduct() {
  const name     = document.getElementById('productName').value.trim();
  const emoji    = document.getElementById('productEmoji').value.trim();
  const desc     = document.getElementById('productDesc').value.trim();
  const price    = document.getElementById('productPrice').value;
  const category = document.getElementById('productCategory').value.trim().toLowerCase();
  const available = document.getElementById('productAvailable').checked;
  const featured  = document.getElementById('productFeatured').checked;

  if (!name || !desc || !price || !category) {
    alert('Preencha todos os campos obrigatórios!');
    return;
  }

  const body = { name, emoji, description: desc, price: parseFloat(price), category, available, featured };

  try {
    if (editingProductId) {
      await apiFetch(`/products/${editingProductId}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(body) });
    }
    closeProductModal();
    loadProducts();
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Excluir produto "${name}"?`)) return;
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    loadProducts();
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}

// ───────────────────────────────────────────
// CATEGORIES
// ───────────────────────────────────────────
async function loadCategories() {
  try {
    const cats = await apiFetch('/categories');
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = cats.map(c => `
      <tr>
        <td style="font-size:1.5rem">${c.emoji || '🍽️'}</td>
        <td><strong>${c.name}</strong></td>
        <td><code>${c.slug}</code></td>
        <td>
          <button class="btn btn--sm btn--danger" onclick="deleteCategory('${c._id}')">🗑️ Excluir</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function addCategory() {
  const name  = prompt('Nome da categoria:');
  if (!name) return;
  const emoji = prompt('Emoji (ex: 🍔):', '🍽️') || '🍽️';
  try {
    await apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name, emoji }) });
    loadCategories();
  } catch (err) {
    alert('Erro: ' + err.message);
  }
}

async function deleteCategory(id) {
  if (!confirm('Excluir categoria?')) return;
  try {
    await apiFetch(`/categories/${id}`, { method: 'DELETE' });
    loadCategories();
  } catch (err) {
    alert('Erro: ' + err.message);
  }
}

// ───────────────────────────────────────────
// ORDERS
// ───────────────────────────────────────────
async function loadOrders() {
  try {
    const data = await apiFetch('/orders');
    const tbody = document.getElementById('ordersTableBody');
    if (!data.orders || data.orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Nenhum pedido ainda.</td></tr>';
      return;
    }
    tbody.innerHTML = data.orders.map(o => `
      <tr>
        <td>${new Date(o.createdAt).toLocaleString('pt-BR')}</td>
        <td><strong>${o.clientName}</strong><br><small>${o.clientAddress}</small></td>
        <td>${o.clientPhone}</td>
        <td><strong>R$ ${o.total.toFixed(2).replace('.', ',')}</strong></td>
        <td><span class="status-badge status-${o.status}">${o.status}</span></td>
        <td>
          <select class="form-control" onchange="updateOrderStatus('${o._id}', this.value)" style="padding:6px 10px; border-radius:8px; border:2px solid #e0e0e0; font-family:var(--font); font-weight:700; font-size:0.8rem;">
            <option value="novo"       ${o.status==='novo'?'selected':''}>Novo</option>
            <option value="confirmado" ${o.status==='confirmado'?'selected':''}>Confirmado</option>
            <option value="preparando" ${o.status==='preparando'?'selected':''}>Preparando</option>
            <option value="saiu"       ${o.status==='saiu'?'selected':''}>Saiu p/ entrega</option>
            <option value="entregue"   ${o.status==='entregue'?'selected':''}>Entregue</option>
            <option value="cancelado"  ${o.status==='cancelado'?'selected':''}>Cancelado</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('ordersTableBody').innerHTML = `<tr><td colspan="6" class="loading-text">Erro: ${err.message}</td></tr>`;
  }
}

async function updateOrderStatus(id, status) {
  try {
    await apiFetch(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  } catch (err) {
    alert('Erro ao atualizar status: ' + err.message);
  }
}

// ───────────────────────────────────────────
// SETTINGS
// ───────────────────────────────────────────
async function loadSettings() {
  try {
    const s = await apiFetch('/settings');
    document.getElementById('settingStoreName').value   = s.storeName || '';
    document.getElementById('settingWhatsapp').value    = s.whatsappNumber || '';
    document.getElementById('settingDelivery').value    = s.deliveryFee || 5;
    document.getElementById('settingFreeAbove').value   = s.freeDeliveryAbove || 50;
    document.getElementById('settingWeekdays').value    = s.openingHours?.weekdays || '';
    document.getElementById('settingWeekends').value    = s.openingHours?.weekends || '';
  } catch (err) {
    console.error(err);
  }
}

async function saveSettings() {
  const body = {
    storeName:         document.getElementById('settingStoreName').value,
    whatsappNumber:    document.getElementById('settingWhatsapp').value,
    deliveryFee:       parseFloat(document.getElementById('settingDelivery').value),
    freeDeliveryAbove: parseFloat(document.getElementById('settingFreeAbove').value),
    openingHours: {
      weekdays: document.getElementById('settingWeekdays').value,
      weekends:  document.getElementById('settingWeekends').value,
    },
  };
  try {
    await apiFetch('/settings', { method: 'PUT', body: JSON.stringify(body) });
    alert('✅ Configurações salvas!');
  } catch (err) {
    alert('Erro: ' + err.message);
  }
}

// ───────────────────────────────────────────
// EVENT LISTENERS
// ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  document.getElementById('btnLogin').addEventListener('click', login);
  document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  document.getElementById('btnLogout').addEventListener('click', logout);

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  document.getElementById('btnNewProduct').addEventListener('click', () => openProductModal());
  document.getElementById('btnSaveProduct').addEventListener('click', saveProduct);
  document.getElementById('btnNewCategory').addEventListener('click', addCategory);
  document.getElementById('btnSaveSettings').addEventListener('click', saveSettings);
});
