// js/i18n.js — EN/ID Language Toggle
// Translates key UI elements. Default: ID (Indonesian)

const LANG_KEY = 'dotcho_lang';

const T = {
  id: {
    // Nav
    'nav.home':    'Beranda',
    'nav.menu':    'Menu',
    'nav.reviews': 'Ulasan',
    'nav.story':   'Cerita Kami',
    'nav.order':   'Pesan',
    // Hero
    'hero.tag':    'Kantin FEB UGM · Sejak 2026',
    'hero.h1':     'Kebahagiaan, <em>dituang</em><br>di setiap tegukan.',
    'hero.sub':    'Enam belas cara menikmati cokelat. Dibuat segar, disajikan hangat atau dingin, disukai 85+ mahasiswa setiap hari.',
    'hero.btn1':   'Lihat Menu →',
    'hero.btn2':   'Baca Ulasan',
    // Sections
    'sec.favorites.eye':  'Favorit Hari Ini',
    'sec.favorites.h2':   'Disukai <em>semua orang</em>,<br>dibuat untuk <em>kamu</em>.',
    'sec.reviews.eye':    'Kata Mereka',
    'sec.reviews.h2':     'Kata <em>jujur</em>,<br>dari lidah yang <em>jujur</em>.',
    'sec.story.eye':      'Cerita Kami',
    'sec.story.h2':       'Sebuah <em>kantin kecil.</em><br>Mimpi cokelat yang <em>besar.</em>',
    // Footer
    'footer.order':       'Pesan',
    'footer.community':   'Komunitas',
    'footer.visit':       'Kunjungi Kami',
    // Buttons
    'btn.browse':         'Jelajahi Menu →',
    'btn.see_reviews':    'Lihat Semua Ulasan →',
    'btn.explore':        'Eksplorasi Menu Lengkap →',
    // Menu page
    'menu.title':         'Semua Menu',
    'menu.sub':           'Setiap minuman adalah janji — dibuat segar, disajikan dengan cinta.',
    // Checkout
    'co.name':            'Nama untuk pickup *',
    'co.wa':              'WhatsApp (opsional)',
    'co.note':            'Catatan pesanan (opsional)',
    // Store closed
    'store.closed':       'Toko Sedang Tutup',
    'store.closed.sub':   'Kami buka kembali segera. Order tidak dapat dilakukan saat ini.',
    // Track
    'trk.placed':   'Pesanan Diterima',
    'trk.paid':     'Pembayaran',
    'trk.prep':     'Sedang Dibuat',
    'trk.ready':    'Siap Diambil',
    'trk.cancel':   'Batalkan Pesanan',
  },
  en: {
    // Nav
    'nav.home':    'Home',
    'nav.menu':    'Menu',
    'nav.reviews': 'Reviews',
    'nav.story':   'Our Story',
    'nav.order':   'Order',
    // Hero
    'hero.tag':    'Kantin FEB UGM · Since 2026',
    'hero.h1':     'Happiness, <em>poured</em><br>in every sip.',
    'hero.sub':    'Sixteen ways to taste chocolate. Made fresh, served warm or cold, loved by 85+ students every day.',
    'hero.btn1':   'Browse Menu →',
    'hero.btn2':   'Read Reviews',
    // Sections
    'sec.favorites.eye':  "Today's Favorites",
    'sec.favorites.h2':   'Loved by <em>everyone</em>,<br>brewed for <em>you</em>.',
    'sec.reviews.eye':    'What People Are Saying',
    'sec.reviews.h2':     'Honest <em>words</em>,<br>from honest <em>tongues</em>.',
    'sec.story.eye':      'Our Story',
    'sec.story.h2':       'A small <em>kantin counter.</em><br>A big chocolate <em>dream.</em>',
    // Footer
    'footer.order':       'Order',
    'footer.community':   'Community',
    'footer.visit':       'Visit Us',
    // Buttons
    'btn.browse':         'Browse Menu →',
    'btn.see_reviews':    'See All Reviews →',
    'btn.explore':        'Explore Full Menu →',
    // Menu page
    'menu.title':         'All Menu',
    'menu.sub':           'Every drink is a promise — made fresh, served with love.',
    // Checkout
    'co.name':            'Name for pickup *',
    'co.wa':              'WhatsApp (optional)',
    'co.note':            'Order note (optional)',
    // Store closed
    'store.closed':       'Store is Currently Closed',
    'store.closed.sub':   'We\'ll be back soon. Orders cannot be placed at this time.',
    // Track
    'trk.placed':   'Order Placed',
    'trk.paid':     'Payment',
    'trk.prep':     'Preparing',
    'trk.ready':    'Ready for Pickup',
    'trk.cancel':   'Cancel Order',
  }
};

const i18n = {
  lang: localStorage.getItem(LANG_KEY) || 'id',

  t(key) { return (T[this.lang] && T[this.lang][key]) || (T['en'][key]) || key; },

  toggle() {
    this.lang = this.lang === 'id' ? 'en' : 'id';
    localStorage.setItem(LANG_KEY, this.lang);
    this.apply();
  },

  apply() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = this.t(key);
      if (val.includes('<')) el.innerHTML = val;
      else el.textContent = val;
    });
    // Update toggle button label
    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.textContent = this.lang === 'id' ? 'EN' : 'ID';
      btn.title = this.lang === 'id' ? 'Switch to English' : 'Ganti ke Indonesia';
    });
    // Dispatch event so other scripts can react
    window.dispatchEvent(new Event('langchange'));
  },

  init() {
    // Hook up toggle buttons
    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.addEventListener('click', () => this.toggle());
    });
    this.apply();
  }
};

document.addEventListener('DOMContentLoaded', () => i18n.init());
