// .Cho — Customer-side interactions (Phase 2)
// Adds: persistent cart drawer, toast notifications, availability-aware
// menu cards driven by the inventory engine, add-to-cart flow.

function rupiah(n) { return 'Rp' + (n || 0).toLocaleString('id-ID'); }

// i18n helper — safe even if i18n.js hasn't initialized yet.
function t(key) { return (typeof i18n !== 'undefined') ? i18n.t(key) : key; }

function starString(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

// ---------- MENU CARD (availability-aware) ----------
function availabilityBadge(item) {
  if (item.availSource === 'disabled' || (!item.available && !item.forced)) return `<div class="badge-habis">${t('card.sold')}</div>`;
  if (item.makeable !== undefined && item.makeable <= 8 && item.makeable > 0 && !item.forced)
    return `<div class="badge-low">${t('card.only')} ${item.makeable} ${t('card.left')}</div>`;
  return '';
}

function renderMenuCard(item) {
  const lovedBadge = item.mostLoved
    ? `<div class="badge-loved most">${t('card.mostloved')}</div>`
    : item.loved ? `<div class="badge-loved">${t('card.loved')}</div>` : '';
  const availBadge = availabilityBadge(item);
  const sold = !item.available;
  return `
    <a href="order.html?item=${item.id}" class="menu-card ${sold ? 'unavailable' : ''}">
      <div class="menu-img" data-img="${item.image}">
        ${lovedBadge}
        ${availBadge}
        <div class="mini-cup"></div>
      </div>
      <div class="menu-body">
        <div class="menu-cat">${item.category}${item.isHot ? ' · Hot' : ''}</div>
        <div class="menu-name">${item.name}</div>
        <div class="menu-notes">"${item.notes}"</div>
        <div class="menu-rating">
          <span class="stars">${starString(item.rating)}</span>
          <span>${item.rating.toFixed(1)}</span>
          <span class="review-count">(${item.reviewCount} ${t('card.reviews')})</span>
        </div>
        <div class="menu-foot">
          <div class="menu-price">${rupiah(item.price)}</div>
          <button class="menu-add" ${sold ? 'disabled' : ''} onclick="event.preventDefault(); event.stopPropagation(); window.location.href='order.html?item=${item.id}'">
            ${sold ? t('card.sold') : t('card.order')}
          </button>
        </div>
      </div>
    </a>
  `;
}

function renderReviewCard(review, dark = true) {
  const menu = MENU.find(m => m.id === review.menuId);
  return `
    <div class="${dark ? 'review-card' : 'full-review-card'}">
      <div class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
      <div class="review-text">"${review.text}"</div>
      <div class="review-meta">
        <div class="review-avatar">${review.avatar}</div>
        <div>
          <div class="review-author">${review.author} ${review.verified ? '· verified' : ''}</div>
          <div class="review-info">${review.date} · <span class="review-menu-tag">${menu?.name || ''}</span></div>
        </div>
      </div>
    </div>
  `;
}

// ---------- MOUNTERS ----------
function _menu() { return (typeof Storage !== 'undefined') ? Storage.applyMenuOverrides(MENU) : MENU; }

function mountFeaturedMenu() {
  const target = document.getElementById('featured-menu');
  if (!target) return;
  const featured = _menu().filter(m => m.available).sort((a, b) => b.rating - a.rating).slice(0, 6);
  target.innerHTML = featured.map(renderMenuCard).join('');
}
function mountAllMenu() { if (document.getElementById('all-menu')) renderFilteredMenu(); }

function renderFilteredMenu() {
  const target = document.getElementById('all-menu');
  if (!target) return;
  const activeFilter = document.querySelector('.filter-chip.active')?.dataset.filter || 'all';
  const sort = document.getElementById('sort-select')?.value || 'default';
  let list = _menu();
  if (activeFilter !== 'all') list = list.filter(m => m.category === activeFilter);
  if (sort === 'loved') list.sort((a, b) => (b.mostLoved ? 1 : 0) - (a.mostLoved ? 1 : 0) || b.rating - a.rating);
  else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  else if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
  target.innerHTML = list.map(renderMenuCard).join('');
}

function mountReviewsPreview() {
  const target = document.getElementById('reviews-preview');
  if (!target) return;
  target.innerHTML = REVIEWS.filter(r => r.rating === 5).slice(0, 3).map(r => renderReviewCard(r, true)).join('');
}
function mountAllReviews() {
  const target = document.getElementById('all-reviews');
  if (!target) return;
  const all = (typeof Storage !== 'undefined') ? [...Storage.getNewReviews(), ...REVIEWS] : REVIEWS;
  target.innerHTML = all.map(r => renderReviewCard(r, false)).join('');
}

function getQueryParam(key) { return new URLSearchParams(window.location.search).get(key); }

// ============================================================
// CART DRAWER + TOAST  (injected into every customer page)
// ============================================================
function injectCartUI() {
  if (typeof Storage === 'undefined' || document.getElementById('cart-drawer')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="cart-scrim" id="cart-scrim" onclick="closeCart()"></div>
    <aside class="cart-drawer" id="cart-drawer" aria-label="Your cart">
      <div class="cart-head">
        <div><div class="cart-title">${t('cart.title')}</div><div class="cart-sub" id="cart-line-count"></div></div>
        <button class="cart-x" onclick="closeCart()" aria-label="Close">×</button>
      </div>
      <div class="cart-lines" id="cart-lines"></div>
      <div class="cart-foot" id="cart-foot"></div>
    </aside>
    <div class="toast-wrap" id="toast-wrap"></div>`;
  document.body.appendChild(wrap);
  document.querySelectorAll('.cart-btn').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openCart(); }));
  updateCartBadges();
}

function updateCartBadges() {
  if (typeof Storage === 'undefined') return;
  const n = Storage.cartCount();
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = n === 1 ? '1 item' : `${n} items`);
  document.querySelectorAll('.cart-btn').forEach(b => b.classList.toggle('has-items', n > 0));
}

function renderCartDrawer() {
  const cart = Storage.getCart();
  const lines = document.getElementById('cart-lines');
  const foot = document.getElementById('cart-foot');
  const lc = document.getElementById('cart-line-count');
  if (lc) lc.textContent = cart.length === 0 ? t('cart.empty') : `${Storage.cartCount()} item · ${cart.length} line${cart.length > 1 ? 's' : ''}`;
  if (cart.length === 0) {
    lines.innerHTML = `<div class="cart-empty"><div class="cart-empty-cup">☕</div><p>${t('cart.empty.msg')}</p><a href="menu.html" class="btn-cream" onclick="closeCart()">${t('cart.browse')}</a></div>`;
    foot.innerHTML = '';
    return;
  }
  lines.innerHTML = cart.map(l => {
    const cfg = [];
    if (l.config?.sugarLevel) cfg.push(l.config.sugarLevel);
    if (l.config?.extraFoam === 'extra-foam') cfg.push('extra foam');
    if (l.config?.takeaway === 'takeaway') cfg.push('takeaway');
    if (l.config?.note) cfg.push('“' + l.config.note + '”');
    const key = l._key.replace(/"/g, '&quot;');
    return `
      <div class="cart-line">
        <div class="cart-line-cup" data-img="${l.image || ''}"></div>
        <div class="cart-line-main">
          <div class="cart-line-name">${l.name}</div>
          <div class="cart-line-cfg">${cfg.join(' · ') || t('cart.nocustom')}</div>
          <div class="cart-qty">
            <button onclick="cartQty('${key}', ${l.qty - 1})">−</button>
            <span>${l.qty}</span>
            <button onclick="cartQty('${key}', ${l.qty + 1})">+</button>
            <button class="cart-rm" onclick="cartQty('${key}', 0)">${t('cart.remove')}</button>
          </div>
        </div>
        <div class="cart-line-price">${rupiah(l.lineTotal)}</div>
      </div>`;
  }).join('');
  foot.innerHTML = `
    <div class="cart-subtotal"><span>${t('cart.subtotal')}</span><strong>${rupiah(Storage.cartSubtotal())}</strong></div>
    <p class="cart-note">${t('cart.taxnote')}</p>
    <a href="checkout.html" class="btn-maroon-full">${t('cart.checkout')} · ${rupiah(Storage.cartSubtotal())}</a>`;
}

function openCart() { renderCartDrawer(); document.getElementById('cart-drawer')?.classList.add('open'); document.getElementById('cart-scrim')?.classList.add('show'); }
function closeCart() { document.getElementById('cart-drawer')?.classList.remove('open'); document.getElementById('cart-scrim')?.classList.remove('show'); }
function cartQty(key, qty) { Storage.setCartQty(key, qty); renderCartDrawer(); updateCartBadges(); }

function addToCart(line, { open = true } = {}) {
  Storage.addToCart(line);
  updateCartBadges();
  toast(`${line.name} ${t('cart.added')}`, 'success');
  if (open) openCart();
}

let _toastTimer;
function toast(msg, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) { alert(msg); return; }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${type === 'success' ? '✓' : type === 'warn' ? '!' : 'ℹ'}</span> ${msg}`;
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
}

// ---------- filter chip + live status ----------
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('filter-chip')) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    renderFilteredMenu();
  }
});
function tickLiveStatus() {
  const el = document.querySelector('[data-cups-today]');
  if (el && typeof SOCIAL_PROOF !== 'undefined') el.textContent = SOCIAL_PROOF.cupsToday;
}


// ============================================================
// STORE STATUS — banner + disable ordering when closed
// ============================================================
function checkStoreStatus() {
  if (typeof Storage === 'undefined') return;
  const open = Storage.isStoreOpen();
  const banner = document.getElementById('store-closed-banner');
  if (banner) banner.style.display = open ? 'none' : 'block';
  // Toggle ordering UI both ways so reopening unfreezes the page live.
  document.querySelectorAll('.menu-add, .add-cart-btn, .order-now-btn, .pay-cta, .btn-maroon-full').forEach(btn => {
    btn.disabled = !open;
    btn.style.opacity = open ? '' : '0.4';
    btn.title = open ? '' : (typeof i18n !== 'undefined' ? i18n.t('store.closed') : 'Toko sedang tutup');
  });
  document.querySelectorAll('.menu-card').forEach(card => {
    card.style.pointerEvents = open ? '' : 'none';
    card.style.opacity = open ? '' : '0.6';
  });
}

// ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
  injectCartUI();
  checkStoreStatus();
  mountFeaturedMenu();
  mountAllMenu();
  mountReviewsPreview();
  mountAllReviews();
  tickLiveStatus();
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.addEventListener('change', renderFilteredMenu);
});

// ---------- language toggle: redraw JS-rendered content ----------
window.addEventListener('langchange', () => {
  mountFeaturedMenu();
  mountAllMenu();
  if (document.getElementById('cart-drawer')?.classList.contains('open')) renderCartDrawer();
  checkStoreStatus();
});

// ---------- cross-tab sync ----------
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.STORE_STATUS) { checkStoreStatus(); }
  if (e.key === STORAGE_KEYS.MENU_AVAIL || e.key === STORAGE_KEYS.INVENTORY) { mountFeaturedMenu(); mountAllMenu(); checkStoreStatus(); }
  if (e.key === STORAGE_KEYS.CART) { updateCartBadges(); if (document.getElementById('cart-drawer')?.classList.contains('open')) renderCartDrawer(); }
  // Reviews: re-render preview + full list on any tab when a review is submitted (incl. via Firebase)
  if (e.key === STORAGE_KEYS.REVIEWS_NEW) { mountAllReviews(); mountReviewsPreview(); }
});
