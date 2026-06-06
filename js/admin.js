// js/admin.js — Owner dashboard logic (Phase 2)
// Adds: payment status, recipe-driven availability engine, manual inventory
// adjustment, stock ledger, owner notifications, tri-state menu override.

if (!Storage.isAuthenticated()) window.location.replace('login.html');

const $ = id => document.getElementById(id);
const rupiah = n => 'Rp' + (n || 0).toLocaleString('id-ID');
const stars = n => '★'.repeat(Math.floor(n)) + '☆'.repeat(5 - Math.floor(n));
// i18n helper — falls back to key when i18n not yet loaded
function t(key) { return (typeof i18n !== 'undefined') ? i18n.t(key) : key; }
const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return Math.floor(diff) + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
};
const isToday = iso => new Date(iso).toDateString() === new Date().toDateString();

// === VIEW SWITCHING ===
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  $('view-' + view).classList.add('active');
  document.querySelector(`.sidebar-link[data-view="${view}"]`)?.classList.add('active');
  renderView(view);
}
document.querySelectorAll('.sidebar-link').forEach(link => link.addEventListener('click', () => switchView(link.dataset.view)));

$('user-name').textContent = Storage.getUser() || 'biru';
$('dashboard-date').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
$('logout-btn').addEventListener('click', () => { Storage.logout(); window.location.href = 'login.html'; });

// === MODAL ===
function showModal(title, bodyHtml, footerHtml) {
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = bodyHtml;
  if (footerHtml) $('modal-footer').innerHTML = footerHtml;
  $('modal').classList.add('show');
}
function closeModal() { $('modal').classList.remove('show'); }
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

function resetDemo() {
  if (!confirm('Reset all demo data? Orders, payments, inventory, ledger & overrides return to defaults.')) return;
  Storage.resetAll();
  location.reload();
}

// ============================================================
// NOTIFICATION CENTER (bell — injected, fixed top-right)
// ============================================================
function injectNotifBell() {
  if ($('notif-bell')) return;
  const el = document.createElement('div');
  el.innerHTML = `
    <button class="notif-bell" id="notif-bell" onclick="toggleNotifs()" aria-label="Notifications">
      🔔<span class="notif-count" id="notif-count"></span>
    </button>
    <div class="notif-panel" id="notif-panel">
      <div class="notif-head"><span>Notifications</span>
        <button onclick="Storage.markAllRead(); renderNotifs();">Mark all read</button></div>
      <div class="notif-list" id="notif-list"></div>
    </div>`;
  document.body.appendChild(el);
  document.addEventListener('click', e => {
    if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-bell')) $('notif-panel')?.classList.remove('open');
  });
  renderNotifs();
}
function toggleNotifs() {
  const p = $('notif-panel');
  p.classList.toggle('open');
  if (p.classList.contains('open')) { renderNotifs(); Storage.markAllRead(); setTimeout(updateNotifCount, 400); }
}
function updateNotifCount() {
  const n = Storage.unreadCount();
  const c = $('notif-count');
  if (c) { c.textContent = n; c.style.display = n > 0 ? 'grid' : 'none'; }
}
function renderNotifs() {
  const list = Storage.getNotifs();
  const el = $('notif-list');
  if (!el) return;
  el.innerHTML = list.length === 0
    ? `<div class="notif-empty">No notifications yet.</div>`
    : list.slice(0, 30).map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <div class="notif-icon">${n.icon || '•'}</div>
        <div><div class="notif-title">${n.title}</div><div class="notif-body">${n.body || ''}</div>
        <div class="notif-time">${timeAgo(n.ts)}</div></div>
      </div>`).join('');
  updateNotifCount();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  renderStoreToggle(); // restore the open/close toggle at top of dashboard
  const orders = Storage.getOrders();
  const todayOrders = orders.filter(o => isToday(o.timestamp) && o.status !== 'cancelled');
  const paidRevenue = todayOrders.filter(o => o.payment?.status === 'paid').reduce((s, o) => s + o.total, 0);
  const unpaid = todayOrders.filter(o => o.payment?.status !== 'paid').length;
  const inv = Storage.getInventory();
  const lowStock = inv.filter(i => Storage.getInventoryStatus(i) !== 'ok');
  const all = [...Storage.getNewReviews(), ...REVIEWS];
  const avg = (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1);

  $('dashboard-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Paid Revenue (today)</div>
      <div class="stat-num">${rupiah(paidRevenue)}</div>
      <div class="stat-delta">${todayOrders.length} order${todayOrders.length !== 1 ? 's' : ''}${unpaid ? ` · ${unpaid} unpaid` : ''}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">New Orders</div>
      <div class="stat-num">${orders.filter(o => o.status === 'new').length}</div>
      <div class="stat-delta">Awaiting prep</div>
    </div>
    <div class="stat-card ${lowStock.length > 0 ? 'alert' : ''}">
      <div class="stat-label">Stock Alerts</div>
      <div class="stat-num">${lowStock.length}</div>
      <div class="stat-delta ${lowStock.length > 0 ? 'warn' : ''}">${lowStock.length > 0 ? 'Needs attention' : 'All good'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Rating</div>
      <div class="stat-num">${avg}★</div>
      <div class="stat-delta">From ${all.length} reviews</div>
    </div>`;

  const recent = orders.slice(0, 5);
  $('dashboard-orders').innerHTML = recent.length === 0
    ? `<div class="empty-state"><div class="icon">📋</div><div>No orders yet. Place one from the customer site to see it appear here live.</div></div>`
    : recent.map(renderOrderRow).join('');

  $('dashboard-alerts').innerHTML = lowStock.length === 0
    ? `<div class="empty-state"><div class="icon">✓</div><div>All stocks are healthy.</div></div>`
    : lowStock.slice(0, 5).map(item => {
        const status = Storage.getInventoryStatus(item);
        const days = Storage.getPredictedDays(item);
        return `<div class="invx" style="grid-template-columns:1fr auto auto;">
          <div><div class="inv-name">${item.name}</div><div class="inv-vendor">~${days} day${days !== 1 ? 's' : ''} left</div></div>
          <div class="inv-level">${item.current}<span class="unit">${item.unit}</span></div>
          <div><span class="inv-status ${status}">${status}</span></div></div>`;
      }).join('');
}

// ============================================================
// ORDERS
// ============================================================
let activeOrderTab = 'all';

function renderOrders() {
  const orders = Storage.getOrders();
  const counts = {
    all: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    progress: orders.filter(o => o.status === 'progress').length,
    done: orders.filter(o => o.status === 'done').length,
  };
  Object.keys(counts).forEach(k => { const el = $('cnt-' + k); if (el) el.textContent = counts[k]; });
  $('badge-orders').textContent = counts.new;

  const filtered = activeOrderTab === 'all' ? orders : orders.filter(o => o.status === activeOrderTab);
  $('orders-list').innerHTML = filtered.length === 0
    ? `<div class="empty-state"><div class="icon">🛎️</div><div>No ${activeOrderTab === 'all' ? '' : activeOrderTab} orders.<br>
        <small style="opacity:.7;">Tip: open the customer site, place a test order & pay.</small></div></div>`
    : filtered.map(renderOrderRow).join('');
}

function renderOrderRow(o) {
  const statusLabel = { new:t('adm.status.new'), progress:t('adm.status.progress'), done:t('adm.status.done'), cancelled:t('adm.status.cancelled') }[o.status]||o.status;
  const items = o.items || [{ name: o.item, qty: o.qty, config: o.config }]; // legacy-safe
  const itemsHtml = items.map(l => {
    const meta = [];
    if (l.config?.sugarLevel) meta.push(l.config.sugarLevel);
    if (l.config?.extraFoam === 'extra-foam') meta.push('extra foam');
    if (l.config?.takeaway === 'takeaway') meta.push('takeaway');
    if (l.config?.note) meta.push('“' + l.config.note + '”');
    return `<div><strong>${l.name}</strong> × ${l.qty}${meta.length ? `<span class="meta"> — ${meta.join(' · ')}</span>` : ''}</div>`;
  }).join('');

  const paid = o.payment?.status === 'paid';
  const payPill = `<span class="pay-pill ${paid ? 'paid' : 'unpaid'}">${paid ? t('adm.paid_pill') : t('adm.unpaid_pill')}${o.payment?.method ? ' · ' + o.payment.method.toUpperCase() : ''}</span>`;

  let actions = '';
  if (!paid) actions += `<button class="btn-sm" onclick="markPaid('${o.id}')">${t('adm.mark_paid')}</button>`;
  if (o.status === 'new') actions += `<button class="btn-sm primary" onclick="updateOrder('${o.id}','progress')">${t('adm.start_prep')}</button>`;
  else if (o.status === 'progress') actions += `<button class="btn-sm success" onclick="updateOrder('${o.id}','done')">${t('adm.complete')}</button>`;
  else actions += `<button class="btn-sm" disabled>—</button>`;

  return `
    <div class="order-row">
      <div>
        <div class="order-id">${o.id}</div>
        <div class="order-time">${timeAgo(o.timestamp)}${o.customer?.name ? ' · ' + o.customer.name : ''}</div>
      </div>
      <div class="order-items">${itemsHtml}</div>
      <div class="order-total">${rupiah(o.total)}<div style="margin-top:.35rem">${payPill}</div></div>
      <div><span class="order-status status-${o.status}">${statusLabel}</span></div>
      <div class="order-actions">${actions}</div>
    </div>`;
}

function updateOrder(id, status) { Storage.updateOrderStatus(id, status); renderOrders(); renderDashboard(); }
function markPaid(id) { Storage.markPaid(id); renderOrders(); renderDashboard(); renderNotifs(); }

document.querySelectorAll('#order-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#order-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeOrderTab = tab.dataset.status;
    renderOrders();
  });
});

// ============================================================
// INVENTORY  (engine + manual adjustment + ledger)
// ============================================================
let _invPanelsMounted = false;
function mountInventoryExtras() {
  if (_invPanelsMounted) return;
  const view = $('view-inventory');
  if (!view) return;
  const extra = document.createElement('div');
  extra.innerHTML = `
    <div class="panel">
      <div class="panel-header"><div>
        <div class="panel-title">Menu Buildability</div>
        <div class="panel-sub">How many cups each drink can still make from current stock — the engine that decides availability</div>
      </div></div>
      <div class="panel-body tight" id="buildability-list"></div>
    </div>
    <div class="panel">
      <div class="panel-header"><div>
        <div class="panel-title">Stock Movement Ledger</div>
        <div class="panel-sub">Every deduction & adjustment is logged — accountable, auditable</div>
      </div></div>
      <div class="panel-body tight" id="ledger-list"></div>
    </div>`;
  view.appendChild(extra);
  _invPanelsMounted = true;
}

function renderInventory() {
  mountInventoryExtras();
  const inv = Storage.getInventory();
  const critical = inv.filter(i => Storage.getInventoryStatus(i) === 'critical').length;
  const warning = inv.filter(i => Storage.getInventoryStatus(i) === 'warning').length;
  const ok = inv.filter(i => Storage.getInventoryStatus(i) === 'ok').length;

  $('inventory-stats').innerHTML = `
    <div class="stat-card ${critical > 0 ? 'alert' : ''}"><div class="stat-label">Critical</div>
      <div class="stat-num" style="color:${critical > 0 ? 'var(--red)' : ''}">${critical}</div>
      <div class="stat-delta ${critical > 0 ? 'down' : ''}">Restock now</div></div>
    <div class="stat-card"><div class="stat-label">Warning</div>
      <div class="stat-num" style="color:var(--amber)">${warning}</div><div class="stat-delta warn">Order soon</div></div>
    <div class="stat-card"><div class="stat-label">Healthy</div>
      <div class="stat-num" style="color:var(--green)">${ok}</div><div class="stat-delta">No action</div></div>
    <div class="stat-card"><div class="stat-label">Vendors Active</div>
      <div class="stat-num">${Object.keys(VENDORS).length}</div><div class="stat-delta">With backup routing</div></div>`;
  $('badge-inventory').textContent = critical + warning;

  $('inventory-list').innerHTML = inv.map(item => {
    const status = Storage.getInventoryStatus(item);
    const days = Storage.getPredictedDays(item);
    const vendor = VENDORS[item.primaryVendor];
    const fillPct = Math.min(100, (item.current / (item.threshold * 2)) * 100);
    return `
      <div class="invx">
        <div>
          <div class="inv-name">${item.name}</div>
          <div class="inv-vendor">Vendor: ${vendor.name} · ${vendor.reliability}%</div>
        </div>
        <div>
          <div class="inv-level">${item.current}<span class="unit">${item.unit}</span></div>
          <div class="inv-bar"><div class="inv-bar-fill ${status}" style="width:${fillPct}%"></div></div>
        </div>
        <div><span class="inv-status ${status}">${status}</span>
          <div class="inv-days ${status === 'critical' ? 'crit' : status === 'warning' ? 'warn' : ''}">~${days}d left · ${item.dailyUsage}${item.unit}/day</div>
        </div>
        <div class="inv-adjust">
          <button onclick="quickStock('${item.id}', -1)" title="Use 1 ${item.unit}">−</button>
          <input type="number" step="any" id="adj-${item.id}" value="${item.current}" />
          <button onclick="setStock('${item.id}')">Set</button>
          <button onclick="quickStock('${item.id}', 1)" title="Add 1 ${item.unit}">+</button>
          <button class="primary" onclick="sendWAOrder('${item.id}')">📱 WA</button>
        </div>
      </div>`;
  }).join('');

  // Buildability
  const menu = MENU.map(m => ({ m, n: Storage.maxMakeable(m.id, inv), r: Storage.resolveAvailability(m.id, inv) }))
    .sort((a, b) => a.n - b.n);
  $('buildability-list').innerHTML = menu.map(({ m, n, r }) => {
    const cls = n === 0 ? 'crit' : n <= 8 ? 'warn' : 'ok';
    const label = r.source === 'disabled' ? 'OFF (manual)' : r.source === 'forced' ? `FORCED (sys: ${n})` : (n === 0 ? 'OUT' : `${n} cups`);
    const limiter = limitingIngredient(m.id, inv);
    return `<div class="build-row">
      <div class="build-name">${m.name}</div>
      <div class="build-limit">${n === 0 && r.source !== 'disabled' ? 'blocked by ' + limiter : (n <= 8 && n > 0 ? 'low — ' + limiter : '')}</div>
      <div class="build-badge ${cls} ${r.source}">${label}</div>
    </div>`;
  }).join('');

  // Ledger
  const led = Storage.getLedger();
  $('ledger-list').innerHTML = led.length === 0
    ? `<div class="empty-state"><div class="icon">📒</div><div>No movements yet. Place an order or adjust stock to populate the ledger.</div></div>`
    : led.slice(0, 25).map(e => `
      <div class="ledger-row">
        <div><div class="led-name">${e.name}</div><div class="led-meta">${e.reason}${e.ref && e.ref !== '—' ? ' · ' + e.ref : ''} · ${timeAgo(e.ts)}</div></div>
        <div class="led-delta ${e.delta < 0 ? 'neg' : 'pos'}">${e.delta > 0 ? '+' : ''}${e.delta}</div>
        <div class="led-bal">→ ${e.balance}</div>
      </div>`).join('');
}

function limitingIngredient(menuId, inv) {
  const recipe = Storage.getRecipe(menuId);
  if (!recipe) return '—';
  const byId = Object.fromEntries(inv.map(i => [i.id, i]));
  let min = Infinity, name = '—';
  for (const [id, qty] of Object.entries(recipe)) {
    const ing = byId[id]; if (!ing || qty <= 0) continue;
    const can = Math.floor(ing.current / qty + 1e-9);
    if (can < min) { min = can; name = ing.name; }
  }
  return name;
}

function setStock(id) {
  const v = parseFloat($('adj-' + id).value);
  if (isNaN(v)) return;
  Storage.setInventoryLevel(id, v, 'manual-set');
  renderInventory(); renderDashboard();
}
function quickStock(id, delta) { Storage.addStock(id, delta, delta > 0 ? 'restock' : 'manual-use'); renderInventory(); renderDashboard(); }

function sendWAOrder(itemId) {
  const item = Storage.getInventoryItem(itemId);
  const primary = VENDORS[item.primaryVendor];
  const backups = item.backupVendors.map(v => VENDORS[v]);
  const orderQty = Math.max(1, Math.ceil(item.threshold * 2 - item.current));
  const template = `Halo ${primary.name},

Saya dari .Cho (Kantin FEB UGM). Mau order:
• ${item.name}: ${orderQty} ${item.unit}

Stok kami saat ini ${item.current} ${item.unit}, butuh restock secepatnya. Mohon konfirmasi ketersediaan dan ETA pengiriman.

Terima kasih,
Biru — .Cho`;
  const backupHtml = backups.map(b => `
    <div style="padding:.7rem 0;border-bottom:1px solid var(--border);">
      <div style="font-weight:600;color:var(--maroon-deep);">${b.name}</div>
      <div style="font-size:.78rem;color:var(--ink-mute);">${b.wa} · Avg ${b.avgResp} · ${b.reliability}% reliable</div></div>`).join('');
  showModal(`Auto WA Order — ${item.name}`,
    `<div style="font-size:.88rem;color:var(--ink-soft);margin-bottom:1rem;">Sistem akan kirim template ini ke <strong>${primary.name}</strong> (${primary.wa}). Jika respons > 4 jam → auto-route ke backup.</div>
     <div class="wa-template">${template}</div>
     <div style="margin-top:1.2rem;"><div style="font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-mute);margin-bottom:.5rem;">Backup vendors (auto-route)</div>${backupHtml}</div>`,
    `<button class="btn-sm" onclick="closeModal()">Cancel</button>
     <button class="btn-sm primary" onclick="confirmWAOrder('${itemId}', ${orderQty})">Send to ${primary.name}</button>`);
}
function confirmWAOrder(itemId, qty) {
  const item = Storage.getInventoryItem(itemId);
  Storage.addNotif({ type: 'vendor', icon: '📦', title: `Restock requested: ${item.name}`, body: `${qty} ${item.unit} ordered from ${VENDORS[item.primaryVendor].name}` });
  closeModal();
  renderNotifs();
  alert(`✓ WA order sent to ${VENDORS[item.primaryVendor].name}.\n\n(In production: WhatsApp Business API.)`);
}

// ============================================================
// MENU MANAGEMENT (tri-state override + system status)
// ============================================================
function renderMenuMgmt() {
  const inv = Storage.getInventory();
  $('menu-list').innerHTML = MENU.map(m => {
    const r = Storage.resolveAvailability(m.id, inv);
    const mode = Storage.getOverrideMode(m.id);
    const sysTxt = r.makeable === 0 ? 'System: OUT of stock' : `System: can make ${r.makeable}`;
    const stateBadge = r.source === 'disabled'
      ? `<span class="state-badge off">Hidden</span>`
      : r.source === 'forced'
        ? `<span class="state-badge forced">Force-selling</span>`
        : `<span class="state-badge ${r.available ? 'live' : 'auto-out'}">${r.available ? 'Live' : 'Auto-hidden'}</span>`;
    return `
      <div class="mm-row">
        <div class="menu-row-img">.Cho</div>
        <div>
          <div class="menu-row-name">${m.name}</div>
          <div class="menu-row-cat">${m.category}${m.isHot ? ' · Hot' : ''} · ${rupiah(m.price)}</div>
          <div class="mm-sys ${r.makeable === 0 ? 'crit' : ''}">${sysTxt}${r.source === 'forced' && r.makeable === 0 ? ' — selling on override ⚠️' : ''}</div>
        </div>
        <div class="mm-state">${stateBadge}</div>
        <div class="mm-ctl">
          <button class="seg ${mode === 'auto' ? 'on' : ''}" onclick="setMode('${m.id}','auto')" title="Follow inventory engine">Auto</button>
          <button class="seg ${mode === 'on' ? 'on force' : ''}" onclick="setMode('${m.id}','on')" title="Sell even if stock says no">Force&nbsp;sell</button>
          <button class="seg ${mode === 'off' ? 'on off' : ''}" onclick="setMode('${m.id}','off')" title="Hide from customers">Off</button>
        </div>
      </div>`;
  }).join('');
}
function setMode(id, mode) { Storage.setOverride(id, mode); renderMenuMgmt(); }

// ============================================================
// REVIEWS & CUSTOMERS
// ============================================================
function renderReviewsView() {
  const newReviews = Storage.getNewReviews();
  const all = [...newReviews, ...REVIEWS];
  const avgRating = (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1);
  const fiveStars = all.filter(r => r.rating === 5).length;
  const fivePct = Math.round((fiveStars / all.length) * 100);

  $('review-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Average Rating</div><div class="stat-num">${avgRating}★</div><div class="stat-delta">${all.length} total reviews</div></div>
    <div class="stat-card"><div class="stat-label">5-Star Reviews</div><div class="stat-num">${fivePct}%</div><div class="stat-delta">${fiveStars} of ${all.length}</div></div>
    <div class="stat-card"><div class="stat-label">New (this session)</div><div class="stat-num">${newReviews.length}</div><div class="stat-delta">From customers</div></div>
    <div class="stat-card"><div class="stat-label">Response Rate</div><div class="stat-num">N/A</div><div class="stat-delta warn">Phase 2 feature</div></div>`;

  $('reviews-list').innerHTML = all.slice(0, 8).map(r => {
    const menu = MENU.find(m => m.id === r.menuId);
    return `<div class="rev-card">
      <div class="rev-header"><div class="rev-author-info">
        <div class="rev-avatar">${r.avatar || (r.author || 'A')[0]}</div>
        <div><div class="rev-author">${r.author}${r.verified ? ' · verified' : ''}</div><div class="rev-date">${r.date}</div></div>
      </div><div class="rev-stars">${stars(r.rating)}</div></div>
      <div class="rev-text">"${r.text}"</div><div class="rev-menu">${menu?.name || 'Unknown menu'}</div></div>`;
  }).join('');

  const dist = [5, 4, 3, 2, 1].map(s => ({ s, count: all.filter(r => r.rating === s).length }));
  const maxCount = Math.max(...dist.map(d => d.count));
  $('rating-dist').innerHTML = `<div class="segment-bar">${dist.map(d => `
    <div class="segment-row"><div class="segment-label">${d.s}★</div>
    <div class="segment-track"><div class="segment-fill" style="width:${(d.count / maxCount * 100) || 0}%">${d.count}</div></div></div>`).join('')}</div>`;

  const ms = Storage.memberStats();
  const segMax = Math.max(1, ms.byTier.vip || 0, ms.byTier.regular || 0, ms.byTier.new || 0);
  const segRow = (label, count, color) => `<div class="segment-row"><div class="segment-label">${label}</div><div class="segment-track"><div class="segment-fill" style="width:${Math.max(2, (count / segMax) * 100)}%;background:${color};${color === 'var(--gold)' ? 'color:var(--maroon-deep);' : ''}">${count}</div></div></div>`;
  $('customer-segment').innerHTML = ms.total === 0
    ? `<div class="empty-state"><div class="icon">🪪</div><div>No members yet. Members are created when customers pay with their WhatsApp number — see the Members &amp; Loyalty tab.</div></div>`
    : `<div class="segment-bar">
        ${segRow('VIP', ms.byTier.vip || 0, 'var(--maroon-deep)')}
        ${segRow('Regular', ms.byTier.regular || 0, 'var(--maroon)')}
        ${segRow('New', ms.byTier.new || 0, 'var(--gold)')}
      </div>
      <div style="margin-top:1rem;padding:.8rem 1rem;background:var(--cream-light);border-radius:6px;font-size:.8rem;color:var(--ink-soft);border-left:3px solid var(--gold);">
        ${ms.total} member${ms.total !== 1 ? 's' : ''} · ${ms.totalPoints.toLocaleString('id-ID')} points outstanding. Full registry in the Members &amp; Loyalty tab.</div>`;
}


// === STORE OPEN/CLOSE TOGGLE ===
function renderStoreToggle() {
  const existing = $('store-toggle-wrap');
  if (existing) existing.remove();
  const status = Storage.getStoreStatus();
  const wrap = document.createElement('div');
  wrap.id = 'store-toggle-wrap';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;background:${status.open ? '#D8F3DC' : '#FBE0DE'};border:1.5px solid ${status.open ? '#2D6A4F' : '#B5302E'};border-radius:12px;padding:.9rem 1.2rem;margin-bottom:1.5rem;cursor:pointer;" onclick="toggleStore()">
      <span style="font-size:1.5rem;">${status.open ? '🟢' : '🔴'}</span>
      <div style="flex:1;">
        <div style="font-weight:700;color:${status.open ? '#1b4332' : '#B5302E'};font-size:.95rem;">
          Toko ${status.open ? 'BUKA' : 'TUTUP'}
        </div>
        <div style="font-size:.76rem;color:#666;margin-top:.1rem;">
          ${status.open ? 'Customer bisa order sekarang · Klik untuk tutup' : 'Order dinonaktifkan · Klik untuk buka'}
        </div>
      </div>
      <div style="background:${status.open ? '#2D6A4F' : '#B5302E'};color:#fff;padding:.4rem .9rem;border-radius:999px;font-size:.78rem;font-weight:700;">
        ${status.open ? 'Tutup Toko' : 'Buka Toko'}
      </div>
    </div>`;
  const view = $('view-dashboard');
  if (view) view.insertBefore(wrap, view.querySelector('.stat-grid') || view.firstChild);
}

function toggleStore() {
  const current = Storage.isStoreOpen();
  const msg = current ? 'Tutup toko sekarang? Customer tidak bisa order.' : 'Buka toko sekarang?';
  if (!confirm(msg)) return;
  Storage.setStoreStatus(!current);
  renderStoreToggle();
  renderNotifs();
}

// ============================================================
// PHASE 4 — MEMBERS & LOYALTY
// ============================================================
const TIER_LABEL = { vip: 'VIP', regular: 'Regular', new: 'New' };
function renderMembers() {
  const s = Storage.memberStats();
  const list = Storage.membersList();
  $('badge-members').textContent = s.total;
  $('member-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total Members</div><div class="stat-num">${s.total}</div><div class="stat-delta">Loyalty registry</div></div>
    <div class="stat-card"><div class="stat-label">VIP</div><div class="stat-num" style="color:var(--maroon-deep)">${s.byTier.vip || 0}</div><div class="stat-delta">≥2000 lifetime pts</div></div>
    <div class="stat-card"><div class="stat-label">Regular</div><div class="stat-num">${s.byTier.regular || 0}</div><div class="stat-delta">≥500 lifetime pts</div></div>
    <div class="stat-card"><div class="stat-label">Points Outstanding</div><div class="stat-num">${s.totalPoints.toLocaleString('id-ID')}</div><div class="stat-delta">avg ${s.avgPoints}/member</div></div>`;
  $('members-list').innerHTML = list.length === 0
    ? `<div class="empty-state"><div class="icon">🪪</div><div>No members yet. A member is created automatically when a customer pays with their WhatsApp number.</div></div>`
    : `<div class="mbr-head"><span>Member</span><span>Tier</span><span>Points</span><span>Orders</span><span>Spent</span><span>Last order</span></div>` +
      list.map(m => {
        const tier = (m.tier || 'new');
        return `<div class="mbr-row">
          <div><div class="mbr-name">${m.name}</div><div class="mbr-phone">${m.phone}</div></div>
          <div><span class="mbr-tier ${tier}">${TIER_LABEL[tier] || tier}</span></div>
          <div class="mbr-pts">${(m.points || 0).toLocaleString('id-ID')}</div>
          <div>${m.orderCount || 0}</div>
          <div>${rupiah(m.totalSpent || 0)}</div>
          <div class="mbr-when">${m.lastOrderAt ? timeAgo(m.lastOrderAt) : '—'}</div>
        </div>`;
      }).join('');
}

// ============================================================
// PHASE 4 — ANALYTICS & REPORTS
// ============================================================
function segBars(items, opts = {}) {
  const max = Math.max(1, ...items.map(i => i.value));
  if (items.every(i => i.value === 0) && opts.emptyMsg) {
    return `<div class="empty-state"><div class="icon">📊</div><div>${opts.emptyMsg}</div></div>`;
  }
  return `<div class="segment-bar">${items.map(i => `
    <div class="segment-row">
      <div class="segment-label">${i.label}</div>
      <div class="segment-track"><div class="segment-fill" style="width:${Math.max(2, i.value / max * 100)}%;${i.color ? 'background:' + i.color + ';' : ''}">${i.display ?? i.value}</div></div>
    </div>`).join('')}</div>`;
}
function renderAnalytics() {
  const a = Storage.analytics();
  $('analytics-kpis').innerHTML = `
    <div class="stat-card"><div class="stat-label">Revenue (paid)</div><div class="stat-num">${rupiah(a.revenue)}</div><div class="stat-delta">${a.paidOrders} paid order${a.paidOrders !== 1 ? 's' : ''}</div></div>
    <div class="stat-card"><div class="stat-label">Avg Order Value</div><div class="stat-num">${rupiah(a.aov)}</div><div class="stat-delta">per paid order</div></div>
    <div class="stat-card"><div class="stat-label">Members</div><div class="stat-num">${a.members}</div><div class="stat-delta">loyalty registry</div></div>
    <div class="stat-card"><div class="stat-label">Points Issued</div><div class="stat-num">${a.pointsIssued.toLocaleString('id-ID')}</div><div class="stat-delta">outstanding balance</div></div>`;
  $('chart-revenue').innerHTML = segBars(
    a.days.map(d => ({ label: d.label, value: d.revenue, display: d.revenue ? rupiah(d.revenue) : '' })),
    { emptyMsg: 'No paid revenue in the last 7 days yet.' });
  $('chart-top').innerHTML = segBars(
    a.topItems.map(t => ({ label: t.name, value: t.qty, display: t.qty + ' cup' + (t.qty !== 1 ? 's' : '') })),
    { emptyMsg: 'No items sold yet.' });
  const statusColors = { new: 'var(--gold)', progress: 'var(--maroon)', done: 'var(--green)', cancelled: 'var(--red)' };
  $('chart-status').innerHTML = segBars(
    Object.entries(a.status).map(([k, v]) => ({ label: k, value: v, color: statusColors[k] })));
  $('chart-payment').innerHTML = segBars(
    Object.entries(a.payment).map(([k, v]) => ({ label: k.toUpperCase(), value: v })),
    { emptyMsg: 'No payments recorded yet.' });
}

// CSV download helper
function downloadCSV(kind) {
  let csv, name;
  if (kind === 'orders') { csv = Storage.exportOrdersCSV(); name = 'dotcho-orders'; }
  else if (kind === 'members') { csv = Storage.exportMembersCSV(); name = 'dotcho-members'; }
  else { csv = Storage.exportSalesReportCSV(); name = 'dotcho-sales-report'; }
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${name}-${stamp}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// === ROUTER ===
function renderView(view) {
  if (view === 'dashboard') renderDashboard();
  else if (view === 'orders') renderOrders();
  else if (view === 'inventory') renderInventory();
  else if (view === 'menu') renderMenuMgmt();
  else if (view === 'reviews') renderReviewsView();
  else if (view === 'members') renderMembers();
  else if (view === 'analytics') renderAnalytics();
}

injectNotifBell();
renderView('dashboard');
renderOrders();
renderMembers(); // populate the members badge on load


// Re-render active view when language is toggled
window.addEventListener('langchange', () => {
  const activeView = (document.querySelector('.view.active')?.id || 'view-dashboard').replace('view-', '');
  renderView(activeView);
  renderOrders();
  updateNotifCount();
});

function cancelOrderAdmin(id) {
  if (!confirm('Batalkan order ini? Stok bahan akan dikembalikan.')) return;
  Storage.cancelOrder(id);
  renderOrders();
  renderNotifs();
  renderView('dashboard');
}

// === LIVE SYNC ===
window.addEventListener('storage', (e) => {
  if (Object.values(STORAGE_KEYS).includes(e.key)) {
    const activeView = (document.querySelector('.view.active')?.id || 'view-dashboard').replace('view-', '');
    renderView(activeView);
    renderOrders();
    renderNotifs();
  }
});
setInterval(() => {
  if (document.visibilityState === 'visible') {
    const activeView = (document.querySelector('.view.active')?.id || 'view-dashboard').replace('view-', '');
    renderView(activeView);
    updateNotifCount();
  }
}, 5000);
