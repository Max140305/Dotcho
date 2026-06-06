// .Cho — Customer-side interactions (Phase 2)
// Adds: persistent cart drawer, toast notifications, availability-aware
// menu cards driven by the inventory engine, add-to-cart flow.

function rupiah(n) { return 'Rp' + (n || 0).toLocaleString('id-ID'); }

function starString(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

// ---------- MENU CARD (availability-aware) ----------
function availabilityBadge(item) {
  if (item.availSource === 'disabled' || (!item.available && !item.forced)) return `<div class="badge-habis">Habis</div>`;
  if (item.makeable !== undefined && item.makeable <= 8 && item.makeable > 0 && !item.forced)
    return `<div class="badge-low">Only ${item.makeable} left</div>`;
  return '';
}

function renderMenuCard(item) {
  const lovedBadge = item.mostLoved
    ? `<div class="badge-loved most">♥ Most Loved</div>`
    : item.loved ? `<div class="badge-loved">♥ Customer Loved</div>` : '';
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
          <span class="review-count">(${item.reviewCount} reviews)</span>
        </div>
        <div class="menu-foot">
          <div class="menu-price">${rupiah(item.price)}</div>
          <button class="menu-add" ${sold ? 'disabled' : ''} onclick="event.preventDefault(); event.stopPropagation(); window.location.href='order.html?item=${item.id}'">
            ${sold ? 'Habis' : 'Order'}
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
        <div><div class="cart-title">Your Cart</div><div class="cart-sub" id="cart-line-count"></div></div>
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
  if (lc) lc.textContent = cart.length === 0 ? 'Empty for now' : `${Storage.cartCount()} item · ${cart.length} line${cart.length > 1 ? 's' : ''}`;
  if (cart.length === 0) {
    lines.innerHTML = `<div class="cart-empty"><div class="cart-empty-cup">☕</div><p>Keranjang masih kosong.<br>Yuk pilih cokelat favoritmu.</p><a href="menu.html" class="btn-cream" onclick="closeCart()">Browse Menu</a></div>`;
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
          <div class="cart-line-cfg">${cfg.join(' · ') || 'No customization'}</div>
          <div class="cart-qty">
            <button onclick="cartQty('${key}', ${l.qty - 1})">−</button>
            <span>${l.qty}</span>
            <button onclick="cartQty('${key}', ${l.qty + 1})">+</button>
            <button class="cart-rm" onclick="cartQty('${key}', 0)">Remove</button>
          </div>
        </div>
        <div class="cart-line-price">${rupiah(l.lineTotal)}</div>
      </div>`;
  }).join('');
  foot.innerHTML = `
    <div class="cart-subtotal"><span>Subtotal</span><strong>${rupiah(Storage.cartSubtotal())}</strong></div>
    <p class="cart-note">Pajak & biaya dihitung di checkout.</p>
    <a href="checkout.html" class="btn-maroon-full">Checkout · ${rupiah(Storage.cartSubtotal())}</a>`;
}

function openCart() { renderCartDrawer(); document.getElementById('cart-drawer')?.classList.add('open'); document.getElementById('cart-scrim')?.classList.add('show'); }
function closeCart() { document.getElementById('cart-drawer')?.classList.remove('open'); document.getElementById('cart-scrim')?.classList.remove('show'); }
function cartQty(key, qty) { Storage.setCartQty(key, qty); renderCartDrawer(); updateCartBadges(); }

function addToCart(line, { open = true } = {}) {
  Storage.addToCart(line);
  updateCartBadges();
  toast(`Added ${line.name} to cart`, 'success');
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

// ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
  injectCartUI();
  mountFeaturedMenu();
  mountAllMenu();
  mountReviewsPreview();
  mountAllReviews();
  tickLiveStatus();
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.addEventListener('change', renderFilteredMenu);
});

// ---------- cross-tab sync ----------
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.MENU_AVAIL || e.key === STORAGE_KEYS.INVENTORY) { mountFeaturedMenu(); mountAllMenu(); }
  if (e.key === STORAGE_KEYS.CART) { updateCartBadges(); if (document.getElementById('cart-drawer')?.classList.contains('open')) renderCartDrawer(); }
});
