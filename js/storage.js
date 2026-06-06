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
  STORE_STATUS: 'dotcho_store_status',
  OVERRIDE_SEED: 'dotcho_override_seeded',
  MEMBERS:      'dotcho_members', // Phase 4: loyalty member registry {phone: {...}}
};

// Phase 4 — loyalty config
const LOYALTY = {
  EARN_PER_RUPIAH: 1000,   // 1 point per Rp1.000 spent (on paid orders)
  REDEEM_VALUE: 10,        // each point redeems for Rp10 (100 pts = Rp1.000)
  TIERS: [                 // evaluated top-down on lifetime points
    { id: 'vip',     name: 'VIP',     min: 2000 },
    { id: 'regular', name: 'Regular', min: 500 },
    { id: 'new',     name: 'New',     min: 0 },
  ],
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
    set(STORAGE_KEYS.MEMBERS, {});
    // Seed a couple of demo overrides once (Choco Yuzu manually disabled)
    if (!localStorage.getItem(STORAGE_KEYS.OVERRIDE_SEED)) {
      this.setOverride('choco-yuzu', 'off');
      localStorage.setItem(STORAGE_KEYS.OVERRIDE_SEED, '1');
    }
  },
  _get(k, fb) {
    try {
      const v = JSON.parse(localStorage.getItem(k)) ?? fb;
      // Firebase Realtime DB serializes arrays as objects ({0:..,1:..}) and
      // returns a plain object whenever keys aren't a contiguous 0..n run.
      // If we expected an array (fallback is an array) but got an object,
      // coerce it back so every .filter/.map/.slice/.find call stays safe.
      if (Array.isArray(fb) && v && typeof v === 'object' && !Array.isArray(v)) {
        return Object.values(v);
      }
      return v;
    } catch { return fb; }
  },
  _set(k, v) { localStorage.setItem(k, JSON.stringify(v)); if (typeof FB !== 'undefined' && FB.ready) FB.push(k, JSON.parse(JSON.stringify(v))); },

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

  placeOrder({ customer, items, payment, pointsToRedeem }) {
    const orders = this.getOrders();
    const subtotal = items.reduce((s, l) => s + l.lineTotal, 0);
    // Loyalty redemption (returning members only): cap by balance & subtotal.
    const phone = this.normalizePhone(customer?.phone);
    const member = phone ? this.getMember(phone) : null;
    let redeem = Math.max(0, Math.floor(pointsToRedeem || 0));
    if (member) redeem = Math.min(redeem, member.points);
    else redeem = 0;
    const maxRedeemByCart = Math.floor(subtotal / LOYALTY.REDEEM_VALUE);
    redeem = Math.min(redeem, maxRedeemByCart);
    const discount = redeem * LOYALTY.REDEEM_VALUE;
    const total = Math.max(0, subtotal - discount);
    const order = {
      id: 'ORD-' + String(Date.now()).slice(-6),
      timestamp: new Date().toISOString(),
      status: 'new',                  // new → progress → done | cancelled
      customer: customer || { name: 'Guest' },
      items, subtotal, fees: 0, discount, pointsRedeemed: redeem, total,
      payment: { method: payment.method, status: payment.status }, // paid|unpaid
      pointsAwarded: false,
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
      this.awardPointsForOrder(order);
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
      this.awardPointsForOrder(o);
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
  // STORE STATUS (open/closed toggle — set by admin)
  // ============================================================
  getStoreStatus() {
    return this._get(STORAGE_KEYS.STORE_STATUS, { open: true, updatedAt: null });
  },
  setStoreStatus(open) {
    const s = { open, updatedAt: new Date().toISOString() };
    this._set(STORAGE_KEYS.STORE_STATUS, s);
    this.addNotif({
      type: 'store', icon: open ? '🟢' : '🔴',
      title: open ? 'Toko dibuka' : 'Toko ditutup',
      body: open ? 'Customer kini bisa melakukan order.' : 'Order dinonaktifkan sementara.',
    });
    return s;
  },
  isStoreOpen() { return this.getStoreStatus().open; },

  // ============================================================
  // CANCEL ORDER
  // ============================================================
  cancelOrder(id) {
    const orders = this.getOrders();
    const o = orders.find(x => x.id === id);
    if (!o || o.status === 'done') return false;
    o.status = 'cancelled';
    o.cancelledAt = new Date().toISOString();
    this._set(STORAGE_KEYS.ORDERS, orders);
    // Restore inventory (reverse the deduction)
    this._restoreForOrder(o);
    // Reverse any loyalty points already granted for this order
    this.reversePointsForOrder(o);
    this.addNotif({ type: 'order', icon: '❌', title: `Order dibatalkan`, body: `${o.id} · ${o.customer?.name || 'Guest'}` });
    return true;
  },
  _restoreForOrder(order) {
    const inv = this.getInventory();
    const byId = Object.fromEntries(inv.map(i => [i.id, i]));
    for (const line of order.items) {
      const recipe = this.getRecipe(line.itemId);
      if (!recipe) continue;
      for (const [ingId, qty] of Object.entries(recipe)) {
        const ing = byId[ingId];
        if (!ing) continue;
        ing.current = +(ing.current + qty * line.qty).toFixed(3);
      }
    }
    this.saveInventory(inv);
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
    // Clear localStorage first
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    // Also clear Firebase so sync doesn't re-populate old data
    if (typeof FB !== 'undefined' && FB.ready && FB.db) {
      FB.db.ref('store').remove()
        .then(() => { this.init(); location.reload(); })
        .catch(() => { this.init(); location.reload(); });
    } else {
      this.init();
    }
  },

  // ============================================================
  // PHASE 4 — LOYALTY / MEMBERS
  // ============================================================
  normalizePhone(p) {
    if (!p) return '';
    let d = String(p).replace(/[^\d]/g, '');
    if (d.startsWith('62')) d = '0' + d.slice(2);     // +62 / 62 → 0
    if (d && !d.startsWith('0')) d = '0' + d;          // 8xx → 08xx
    return d.length >= 8 ? d : '';                     // ignore junk
  },
  getMembers() { return this._get(STORAGE_KEYS.MEMBERS, {}); },
  _saveMembers(m) { this._set(STORAGE_KEYS.MEMBERS, m); },
  getMember(phone) {
    const k = this.normalizePhone(phone);
    return k ? (this.getMembers()[k] || null) : null;
  },
  memberTier(points) {
    return (LOYALTY.TIERS.find(t => points >= t.min) || LOYALTY.TIERS[LOYALTY.TIERS.length - 1]);
  },
  // Create/update a member from a paid order. Idempotent via order.pointsAwarded.
  awardPointsForOrder(order) {
    if (!order || order.pointsAwarded || order.payment?.status !== 'paid') return null;
    const phone = this.normalizePhone(order.customer?.phone);
    if (!phone) return null; // guest checkout — no loyalty identity
    const members = this.getMembers();
    const now = new Date().toISOString();
    const m = members[phone] || {
      phone, name: order.customer?.name || 'Member',
      points: 0, lifetimePoints: 0, totalSpent: 0, orderCount: 0,
      tier: 'new', joinedAt: now, lastOrderAt: now,
    };
    const earned = Math.floor((order.total || 0) / LOYALTY.EARN_PER_RUPIAH);
    const redeemed = Math.max(0, order.pointsRedeemed || 0);
    m.points = Math.max(0, m.points - redeemed + earned);
    m.lifetimePoints = (m.lifetimePoints || 0) + earned;
    m.totalSpent = (m.totalSpent || 0) + (order.total || 0);
    m.orderCount = (m.orderCount || 0) + 1;
    m.lastOrderAt = now;
    if (order.customer?.name) m.name = order.customer.name;
    m.tier = this.memberTier(m.lifetimePoints).id;
    members[phone] = m;
    this._saveMembers(members);
    order.pointsAwarded = true;
    order.pointsEarned = earned;
    // persist the flag on the order
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) { orders[idx].pointsAwarded = true; orders[idx].pointsEarned = earned; this._set(STORAGE_KEYS.ORDERS, orders); }
    this.addNotif({ type: 'loyalty', icon: '⭐', title: `+${earned} poin · ${m.name}`, body: `Saldo ${m.points} poin · tier ${this.memberTier(m.lifetimePoints).name}` });
    return { member: m, earned, tier: this.memberTier(m.lifetimePoints) };
  },
  // Reverse points if a previously-awarded order gets cancelled.
  reversePointsForOrder(order) {
    if (!order || !order.pointsAwarded) return;
    const phone = this.normalizePhone(order.customer?.phone);
    if (!phone) return;
    const members = this.getMembers();
    const m = members[phone];
    if (!m) return;
    const earned = order.pointsEarned || 0;
    const redeemed = order.pointsRedeemed || 0;
    m.points = Math.max(0, m.points - earned + redeemed); // undo earn, refund redeemed
    m.lifetimePoints = Math.max(0, (m.lifetimePoints || 0) - earned);
    m.totalSpent = Math.max(0, (m.totalSpent || 0) - (order.total || 0));
    m.orderCount = Math.max(0, (m.orderCount || 0) - 1);
    m.tier = this.memberTier(m.lifetimePoints).id;
    members[phone] = m;
    this._saveMembers(members);
    order.pointsAwarded = false;
  },
  membersList() {
    return Object.values(this.getMembers()).sort((a, b) => (b.points || 0) - (a.points || 0));
  },
  memberStats() {
    const list = this.membersList();
    const byTier = { vip: 0, regular: 0, new: 0 };
    let pts = 0;
    list.forEach(m => { byTier[m.tier] = (byTier[m.tier] || 0) + 1; pts += m.points || 0; });
    return { total: list.length, byTier, totalPoints: pts, avgPoints: list.length ? Math.round(pts / list.length) : 0 };
  },

  // ============================================================
  // PHASE 4 — ANALYTICS (computed from live orders/reviews/members)
  // ============================================================
  analytics() {
    const orders = this.getOrders();
    const active = orders.filter(o => o.status !== 'cancelled');
    const paid = active.filter(o => o.payment?.status === 'paid');
    const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
    const aov = paid.length ? Math.round(revenue / paid.length) : 0;
    const status = { new: 0, progress: 0, done: 0, cancelled: 0 };
    orders.forEach(o => { status[o.status] = (status[o.status] || 0) + 1; });
    const payment = {};
    paid.forEach(o => { const k = (o.payment?.method || 'other'); payment[k] = (payment[k] || 0) + 1; });
    // revenue last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const rev = paid.filter(o => (o.timestamp || '').slice(0, 10) === key).reduce((s, o) => s + (o.total || 0), 0);
      days.push({ key, label, revenue: rev });
    }
    // top items by qty
    const tally = {};
    active.forEach(o => (o.items || []).forEach(l => {
      const id = l.itemId || l.name;
      if (!tally[id]) tally[id] = { name: l.name, qty: 0, revenue: 0 };
      tally[id].qty += l.qty || 0;
      tally[id].revenue += (l.lineTotal || (l.unitPrice || 0) * (l.qty || 0));
    }));
    const topItems = Object.values(tally).sort((a, b) => b.qty - a.qty).slice(0, 6);
    const ms = this.memberStats();
    return {
      revenue, orders: active.length, paidOrders: paid.length, aov,
      status, payment, days, topItems,
      members: ms.total, pointsIssued: ms.totalPoints,
    };
  },

  // ============================================================
  // PHASE 4 — CSV EXPORT
  // ============================================================
  _csv(rows) {
    return rows.map(r => r.map(c => {
      const s = (c === null || c === undefined) ? '' : String(c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\r\n');
  },
  exportOrdersCSV() {
    const rows = [['Order ID', 'Date', 'Customer', 'Phone', 'Items', 'Status', 'Payment', 'Method', 'Subtotal', 'Discount', 'Total', 'Points Earned']];
    this.getOrders().forEach(o => {
      const items = (o.items || []).map(l => `${l.qty}x ${l.name}`).join('; ');
      rows.push([o.id, o.timestamp, o.customer?.name || '', o.customer?.phone || '', items, o.status,
        o.payment?.status || '', o.payment?.method || '', o.subtotal ?? o.total, o.discount || 0, o.total, o.pointsEarned || 0]);
    });
    return this._csv(rows);
  },
  exportMembersCSV() {
    const rows = [['Phone', 'Name', 'Tier', 'Points', 'Lifetime Points', 'Orders', 'Total Spent', 'Joined', 'Last Order']];
    this.membersList().forEach(m => rows.push([m.phone, m.name, this.memberTier(m.lifetimePoints).name,
      m.points, m.lifetimePoints || 0, m.orderCount || 0, m.totalSpent || 0, m.joinedAt || '', m.lastOrderAt || '']));
    return this._csv(rows);
  },
  exportSalesReportCSV() {
    const a = this.analytics();
    const rows = [['.Cho Sales Report', new Date().toISOString()], [],
      ['Metric', 'Value'],
      ['Total Revenue (paid)', a.revenue], ['Paid Orders', a.paidOrders], ['Active Orders', a.orders],
      ['Avg Order Value', a.aov], ['Members', a.members], ['Points Issued', a.pointsIssued], [],
      ['Revenue — last 7 days', ''], ...a.days.map(d => [d.key, d.revenue]), [],
      ['Top Items (by qty)', ''], ...a.topItems.map(t => [t.name, t.qty]), [],
      ['Order Status', ''], ...Object.entries(a.status).map(([k, v]) => [k, v]), [],
      ['Payment Method', ''], ...Object.entries(a.payment).map(([k, v]) => [k, v])];
    return this._csv(rows);
  },

  _rupiah(n) { return 'Rp' + (n || 0).toLocaleString('id-ID'); },
};

Storage.init();

// Start Firebase sync (non-blocking — falls back to localStorage if unavailable)
if (typeof FB !== 'undefined') FB.init();
