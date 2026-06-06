// js/storage.js — Shared state + business logic layer (customer ↔ admin)
// Phase 2: real ordering engine — cart, payment, recipe-driven inventory
// deduction, availability engine, stock ledger, notifications.
// Persisted in localStorage so all tabs sync. (Backend swap = replace this
// object's bodies with API calls; the public method surface stays identical.)

const STORAGE_KEYS = {
  ORDERS:      'dotcho_orders',
  MENU_AVAIL:  'dotcho_menu_availability', // tri-state overrides {id:'on'|'off'}
  INVENTORY:   'dotcho_inventory',
  REVIEWS_NEW: 'dotcho_reviews_user',
  AUTH:        'dotcho_admin_auth',
  CART:        'dotcho_cart',
  NOTIFS:      'dotcho_notifs',
  LEDGER:      'dotcho_ledger',
  OVERRIDE_SEED: 'dotcho_override_seeded',
};

const LOW_STOCK_CUPS = 8; // show "low — N left" on customer site at/under this

// Inventory seed — quantities tuned to demo the engine end-to-end.
// strawberry = 0 → Choco Strawberry/Berry go SYSTEM-OUT (force-sell demo)
// banana low → Choco Banana shows "low" warning
// straws critical → matches interview complaint, triggers WA alert
const INVENTORY_SEED = [
  { id: 'cocoa',      name: 'Cocoa Powder',     unit: 'kg',  current: 5.2,  threshold: 3.0, dailyUsage: 0.8, primaryVendor: 'v1', backupVendors: ['v3'] },
  { id: 'milk',       name: 'Fresh Milk',       unit: 'L',   current: 12,   threshold: 8,   dailyUsage: 4,   primaryVendor: 'v2', backupVendors: ['v1'] },
  { id: 'sugar',      name: 'Sugar',            unit: 'kg',  current: 8,    threshold: 5,   dailyUsage: 1.2, primaryVendor: 'v1', backupVendors: ['v2'] },
  { id: 'salt',       name: 'Sea Salt',         unit: 'kg',  current: 0.5,  threshold: 0.3, dailyUsage: 0.1, primaryVendor: 'v3', backupVendors: ['v1'] },
  { id: 'cups',       name: 'Paper Cups (12oz)',unit: 'pcs', current: 180,  threshold: 100, dailyUsage: 90,  primaryVendor: 'v4', backupVendors: ['v1'] },
  { id: 'straws',     name: 'Straws',           unit: 'pcs', current: 50,   threshold: 200, dailyUsage: 90,  primaryVendor: 'v4', backupVendors: ['v3'] },
  { id: 'cream',      name: 'Whipped Cream',    unit: 'kg',  current: 2.5,  threshold: 1.5, dailyUsage: 0.5, primaryVendor: 'v2', backupVendors: ['v1'] },
  { id: 'banana',     name: 'Banana',           unit: 'kg',  current: 0.3,  threshold: 1.0, dailyUsage: 0.8, primaryVendor: 'v5', backupVendors: ['v3'] },
  { id: 'strawberry', name: 'Strawberry',       unit: 'kg',  current: 0.0,  threshold: 1.0, dailyUsage: 0.4, primaryVendor: 'v5', backupVendors: ['v3'] },
  { id: 'pistachio',  name: 'Pistachio',        unit: 'kg',  current: 0.8,  threshold: 0.5, dailyUsage: 0.15,primaryVendor: 'v3', backupVendors: ['v1'] },
  { id: 'coffee',     name: 'Espresso Beans',   unit: 'kg',  current: 0.6,  threshold: 0.3, dailyUsage: 0.1, primaryVendor: 'v3', backupVendors: ['v1'] },
  { id: 'caramel',    name: 'Caramel Sauce',    unit: 'kg',  current: 0.9,  threshold: 0.4, dailyUsage: 0.15,primaryVendor: 'v1', backupVendors: ['v3'] },
  { id: 'marshmallow',name: 'Marshmallow',      unit: 'kg',  current: 0.4,  threshold: 0.2, dailyUsage: 0.1, primaryVendor: 'v4', backupVendors: ['v3'] },
];

const VENDORS = {
  v1: { name: 'CV Bahan Berkah',        wa: '+6281234567001', avgResp: '2h',  reliability: 95 },
  v2: { name: 'Sumber Susu Segar',      wa: '+6281234567002', avgResp: '1h',  reliability: 98 },
  v3: { name: 'Toko Bumbu Anekarasa',   wa: '+6281234567003', avgResp: '6h',  reliability: 75 },
  v4: { name: 'Packaging Pro Jogja',    wa: '+6281234567004', avgResp: '3h',  reliability: 88 },
  v5: { name: 'Pasar Pagi Beringharjo', wa: '+6281234567005', avgResp: '24h', reliability: 70 },
};

const Storage = {
  init() {
    const set = (k, v) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(v)); };
    set(STORAGE_KEYS.INVENTORY, INVENTORY_SEED);
    set(STORAGE_KEYS.ORDERS, []);
    set(STORAGE_KEYS.CART, []);
    set(STORAGE_KEYS.NOTIFS, []);
    set(STORAGE_KEYS.LEDGER, []);
    // Seed a couple of demo overrides once (Choco Yuzu manually disabled)
    if (!localStorage.getItem(STORAGE_KEYS.OVERRIDE_SEED)) {
      this.setOverride('choco-yuzu', 'off');
      localStorage.setItem(STORAGE_KEYS.OVERRIDE_SEED, '1');
    }
  },
  _get(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
  _set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },

  // ============================================================
  // RECIPE / AVAILABILITY ENGINE
  // ============================================================
  getRecipe(menuId) { return (typeof RECIPES !== 'undefined' && RECIPES[menuId]) || null; },

  // How many units can we still make from current stock? Infinity if untracked.
  maxMakeable(menuId, inv) {
    const recipe = this.getRecipe(menuId);
    if (!recipe) return 9999;
    inv = inv || this.getInventory();
    const byId = Object.fromEntries(inv.map(i => [i.id, i]));
    let min = Infinity;
    for (const [ingId, qty] of Object.entries(recipe)) {
      const ing = byId[ingId];
      if (!ing || qty <= 0) continue;
      min = Math.min(min, Math.floor(ing.current / qty + 1e-9));
    }
    return min === Infinity ? 9999 : Math.max(0, min);
  },

  // Resolve final availability: admin override beats the engine.
  // source: 'disabled' (admin off) | 'forced' (admin sell-anyway) | 'system'
  resolveAvailability(menuId, inv) {
    const ov = this.getOverrides()[menuId];
    const makeable = this.maxMakeable(menuId, inv);
    if (ov === 'off') return { available: false, source: 'disabled', forced: false, makeable };
    if (ov === 'on')  return { available: true,  source: 'forced',   forced: true,  makeable };
    return { available: makeable > 0, source: 'system', forced: false, makeable };
  },

  // ============================================================
  // MENU OVERRIDES (tri-state: 'auto'(default) | 'on' | 'off')
  // ============================================================
  getOverrides() { return this._get(STORAGE_KEYS.MENU_AVAIL, {}); },
  setOverride(itemId, mode) {
    const o = this.getOverrides();
    if (mode === 'auto') delete o[itemId]; else o[itemId] = mode;
    this._set(STORAGE_KEYS.MENU_AVAIL, o);
  },
  getOverrideMode(itemId) { return this.getOverrides()[itemId] || 'auto'; },

  // Returns menu array enriched with resolved availability + engine data.
  // Name kept for backward compatibility with existing callers.
  applyMenuOverrides(menuArr) {
    const inv = this.getInventory();
    return menuArr.map(m => {
      const r = this.resolveAvailability(m.id, inv);
      return { ...m, available: r.available, availSource: r.source, forced: r.forced, makeable: r.makeable };
    });
  },
  // legacy shim — admin "force off/on" via a boolean toggle still works
  setMenuItemAvailability(itemId, available) { this.setOverride(itemId, available ? 'on' : 'off'); },

  // ============================================================
  // CART
  // ============================================================
  getCart() { return this._get(STORAGE_KEYS.CART, []); },
  _saveCart(c) { this._set(STORAGE_KEYS.CART, c); },
  cartCount() { return this.getCart().reduce((n, l) => n + l.qty, 0); },
  cartSubtotal() { return this.getCart().reduce((s, l) => s + l.lineTotal, 0); },
  addToCart(line) {
    // line: {itemId,name,unitPrice,qty,config:{sugarLevel,extraFoam,takeaway,note}}
    const cart = this.getCart();
    const key = JSON.stringify([line.itemId, line.config?.sugarLevel, line.config?.extraFoam, line.config?.takeaway, line.config?.note || '']);
    const existing = cart.find(l => l._key === key);
    if (existing) { existing.qty += line.qty; existing.lineTotal = existing.qty * existing.unitPrice; }
    else { line._key = key; line.lineTotal = line.qty * line.unitPrice; cart.unshift(line); }
    this._saveCart(cart);
    return cart;
  },
  setCartQty(key, qty) {
    const cart = this.getCart();
    const l = cart.find(x => x._key === key);
    if (!l) return;
    if (qty <= 0) { this._saveCart(cart.filter(x => x._key !== key)); return; }
    l.qty = qty; l.lineTotal = l.qty * l.unitPrice;
    this._saveCart(cart);
  },
  removeCartLine(key) { this._saveCart(this.getCart().filter(x => x._key !== key)); },
  clearCart() { this._saveCart([]); },

  // ============================================================
  // ORDERS  (multi-item) + auto inventory deduction + notifications
  // ============================================================
  getOrders() { return this._get(STORAGE_KEYS.ORDERS, []); },
  getOrder(id) { return this.getOrders().find(o => o.id === id); },

  placeOrder({ customer, items, payment }) {
    const orders = this.getOrders();
    const subtotal = items.reduce((s, l) => s + l.lineTotal, 0);
    const order = {
      id: 'ORD-' + String(Date.now()).slice(-6),
      timestamp: new Date().toISOString(),
      status: 'new',                  // new → progress → done | cancelled
      customer: customer || { name: 'Guest' },
      items, subtotal, fees: 0, total: subtotal,
      payment: { method: payment.method, status: payment.status }, // paid|unpaid
    };
    orders.unshift(order);
    this._set(STORAGE_KEYS.ORDERS, orders);

    // Estimated stock deduction (reservation) — accountable via ledger
    this._deductForOrder(order);

    // Notifications to owner
    this.addNotif({
      type: 'order', icon: '🛎️',
      title: `New order ${order.id}`,
      body: `${items.reduce((n, l) => n + l.qty, 0)} item · ${this._rupiah(order.total)} · ${order.payment.status === 'paid' ? 'PAID ✓' : 'unpaid (counter)'}`,
    });
    if (order.payment.status === 'paid') {
      this.addNotif({ type: 'payment', icon: '💳', title: `Payment received`, body: `${this._rupiah(order.total)} via ${order.payment.method.toUpperCase()} · ${order.id}` });
    }
    return order;
  },

  updateOrderStatus(id, status) {
    const orders = this.getOrders();
    const o = orders.find(x => x.id === id);
    if (!o) return;
    o.status = status;
    o.statusAt = new Date().toISOString();
    this._set(STORAGE_KEYS.ORDERS, orders);
  },
  markPaid(id) {
    const orders = this.getOrders();
    const o = orders.find(x => x.id === id);
    if (o && o.payment.status !== 'paid') {
      o.payment.status = 'paid';
      this._set(STORAGE_KEYS.ORDERS, orders);
      this.addNotif({ type: 'payment', icon: '💳', title: 'Payment received', body: `${this._rupiah(o.total)} · ${o.id} (counter)` });
    }
  },

  // ============================================================
  // INVENTORY
  // ============================================================
  getInventory() { return this._get(STORAGE_KEYS.INVENTORY, INVENTORY_SEED); },
  saveInventory(inv) { this._set(STORAGE_KEYS.INVENTORY, inv); },
  getInventoryItem(id) { return this.getInventory().find(i => i.id === id); },

  getInventoryStatus(item) {
    const daysLeft = item.current / item.dailyUsage;
    if (item.current <= 0) return 'critical';
    if (item.current <= item.threshold) return item.current < item.threshold * 0.5 ? 'critical' : 'warning';
    if (daysLeft < 4) return 'warning';
    return 'ok';
  },
  getPredictedDays(item) { return Math.floor(item.current / item.dailyUsage); },

  // Auto-deduct ingredients for an order (ESTIMATED). Floors at 0 and records
  // any shortage when admin force-sold beyond available stock.
  _deductForOrder(order) {
    const inv = this.getInventory();
    const byId = Object.fromEntries(inv.map(i => [i.id, i]));
    const before = Object.fromEntries(inv.map(i => [i.id, i.current]));
    for (const line of order.items) {
      const recipe = this.getRecipe(line.itemId);
      if (!recipe) continue;
      for (const [ingId, qty] of Object.entries(recipe)) {
        const ing = byId[ingId];
        if (!ing) continue;
        ing.current = Math.max(0, +(ing.current - qty * line.qty).toFixed(3));
      }
    }
    this.saveInventory(inv);
    // Ledger + low-stock notifications
    inv.forEach(ing => {
      const delta = +(ing.current - before[ing.id]).toFixed(3);
      if (delta !== 0) this.addLedger({ ingredientId: ing.id, name: ing.name, delta, balance: ing.current, reason: 'order', ref: order.id });
      const wasOk = before[ing.id] > ing.threshold;
      if (wasOk && ing.current <= ing.threshold) {
        this.addNotif({ type: 'stock', icon: '⚠️', title: `Low stock: ${ing.name}`, body: `Now ${ing.current}${ing.unit} (threshold ${ing.threshold}). Consider reordering.` });
      }
    });
  },

  // Manual adjustments by admin — both are logged for accountability
  setInventoryLevel(id, newValue, reason = 'manual-set') {
    const inv = this.getInventory();
    const ing = inv.find(i => i.id === id);
    if (!ing) return;
    const delta = +((newValue) - ing.current).toFixed(3);
    ing.current = Math.max(0, +newValue);
    this.saveInventory(inv);
    this.addLedger({ ingredientId: id, name: ing.name, delta, balance: ing.current, reason, ref: '—' });
  },
  addStock(id, delta, reason = 'restock') {
    const inv = this.getInventory();
    const ing = inv.find(i => i.id === id);
    if (!ing) return;
    ing.current = Math.max(0, +(ing.current + delta).toFixed(3));
    this.saveInventory(inv);
    this.addLedger({ ingredientId: id, name: ing.name, delta, balance: ing.current, reason, ref: '—' });
  },

  // ============================================================
  // LEDGER (stock movement audit trail)
  // ============================================================
  getLedger() { return this._get(STORAGE_KEYS.LEDGER, []); },
  addLedger(entry) {
    const l = this.getLedger();
    entry.ts = new Date().toISOString();
    l.unshift(entry);
    this._set(STORAGE_KEYS.LEDGER, l.slice(0, 200));
  },

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  getNotifs() { return this._get(STORAGE_KEYS.NOTIFS, []); },
  addNotif(n) {
    const list = this.getNotifs();
    n.id = 'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    n.ts = new Date().toISOString();
    n.read = false;
    list.unshift(n);
    this._set(STORAGE_KEYS.NOTIFS, list.slice(0, 60));
  },
  unreadCount() { return this.getNotifs().filter(n => !n.read).length; },
  markAllRead() { const l = this.getNotifs(); l.forEach(n => n.read = true); this._set(STORAGE_KEYS.NOTIFS, l); },
  clearNotifs() { this._set(STORAGE_KEYS.NOTIFS, []); },

  // ============================================================
  // REVIEWS
  // ============================================================
  getNewReviews() { return this._get(STORAGE_KEYS.REVIEWS_NEW, []); },
  addReview(review) {
    const r = this.getNewReviews();
    review.id = 'rv-' + Date.now();
    review.date = 'Just now';
    review.verified = true;
    r.unshift(review);
    this._set(STORAGE_KEYS.REVIEWS_NEW, r);
    this.addNotif({ type: 'review', icon: '⭐', title: `New ${review.rating}★ review`, body: `${review.author}: "${(review.text || '').slice(0, 50)}…"` });
  },

  // ============================================================
  // AUTH
  // ============================================================
  login(user, pass) {
    if (user === 'biru' && pass === 'dotcho2026') {
      this._set(STORAGE_KEYS.AUTH, { user, loginAt: Date.now() });
      return true;
    }
    return false;
  },
  logout() { localStorage.removeItem(STORAGE_KEYS.AUTH); },
  isAuthenticated() { return !!localStorage.getItem(STORAGE_KEYS.AUTH); },
  getUser() { const a = this._get(STORAGE_KEYS.AUTH, null); return a ? a.user : null; },

  // ============================================================
  // DEMO RESET
  // ============================================================
  resetAll() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    this.init();
  },

  _rupiah(n) { return 'Rp' + (n || 0).toLocaleString('id-ID'); },
};

Storage.init();
