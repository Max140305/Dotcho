// js/i18n.js — EN/ID Language Toggle
// Translates static [data-i18n] elements AND, via i18n.t(), dynamic JS content.
// Default: ID (Indonesian). Toggling fires a 'langchange' event so renderers
// (menu cards, cart drawer, etc.) re-draw themselves in the chosen language.

const LANG_KEY = 'dotcho_lang';

const T = {
  id: {
    // Nav
    'nav.home': 'Beranda', 'nav.menu': 'Menu', 'nav.reviews': 'Ulasan',
    'nav.story': 'Cerita Kami', 'nav.order': 'Pesan',
    // Live bar
    'live.hours': 'Buka · 08.00 – 16.00 WIB',
    'live.cups': 'gelas tersaji hari ini',
    'live.fav': 'Favorit hari ini:',
    'live.preorder': 'Buka · Pre-order tersedia',
    'live.wait': 'Rata-rata tunggu:',
    'live.pickup': 'Rata-rata ambil:',
    // Hero
    'hero.tag': 'Kantin FEB UGM · Sejak 2026',
    'hero.h1': 'Kebahagiaan, <em>dituang</em><br>di setiap tegukan.',
    'hero.sub': 'Enam belas cara menikmati cokelat. Dibuat segar, disajikan hangat atau dingin, disukai 85+ mahasiswa setiap hari. Pre-order, lewati antrean, ambil di counter.',
    'hero.btn1': 'Lihat Menu →', 'hero.btn2': 'Baca Ulasan',
    'hero.stat.rating': 'Rata-rata Rating', 'hero.stat.items': 'Item Menu',
    // Sections
    'sec.favorites.eye': 'Favorit Hari Ini',
    'sec.favorites.h2': 'Disukai <em>semua orang</em>,<br>dibuat untuk <em>kamu</em>.',
    'sec.favorites.desc': 'Minuman paling banyak dipesan minggu ini. Ulasan nyata, rating nyata — dari mahasiswa sungguhan seperti kamu.',
    'sec.reviews.eye': 'Kata Mereka',
    'sec.reviews.h2': 'Kata <em>jujur</em>,<br>dari lidah yang <em>jujur</em>.',
    'sec.reviews.desc': 'Kami tidak menyaring ulasan. Setiap suara — setiap bintang — datang langsung dari orang yang benar-benar membeli secangkir.',
    'sec.story.eye': 'Cerita Kami',
    'sec.story.h2': 'Sebuah <em>kantin kecil.</em><br>Mimpi cokelat yang <em>besar.</em>',
    'sec.story.p1': '.Cho lahir di Kantin FEB UGM pada Februari 2026 — proyek penuh gairah dari Biru dan timnya. Visinya: membuktikan bahwa minuman cokelat terbaik tidak butuh kafe Jakarta. Cukup kakao asli, kepedulian nyata, dan counter yang mengenal namamu.',
    'sec.story.p2': 'Kini, .Cho menyajikan rata-rata 85 cangkir sehari untuk mahasiswa, dosen, dan sesekali dosen yang dikejar deadline. Setiap menu — dari Chocoriginal hingga Sugar Cloud — dibangun di atas satu janji: <strong>kebahagiaan, dituang.</strong>',
    'sec.story.stat.cups': 'Cangkir per Hari',
    'sec.story.stat.variants': 'Varian Menu',
    'sec.story.stat.rating': 'Rating Pelanggan',
    // Buttons
    'btn.browse': 'Jelajahi Menu →',
    'btn.see_reviews': 'Lihat Semua Ulasan →',
    'btn.explore': 'Eksplorasi Menu Lengkap →',
    // Footer
    'footer.tagline': 'Minuman cokelat premium, diseduh setiap hari di Kantin FEB UGM. Kebahagiaan, dituang.',
    'footer.order': 'Pesan', 'footer.community': 'Komunitas', 'footer.visit': 'Kunjungi Kami',
    'footer.fullmenu': 'Menu Lengkap', 'footer.preorder': 'Pre-order',
    'footer.pickup': 'Ambil di Counter', 'footer.allreviews': 'Semua Ulasan',
    'footer.loyalty': 'Program Loyalitas', 'footer.ownerlogin': 'Login Pemilik →',
    // Menu page
    'menu.eye': 'Menu Kami',
    'menu.h1': 'Enam belas cara menikmati <em>cokelat.</em>',
    'menu.desc': 'Setiap cangkir dibuat segar. Sesuaikan level gula, foam, dan preferensi takeaway di layar berikutnya.',
    'filter.all': 'Semua Menu', 'filter.choco': 'Choco Series', 'filter.snacks': 'Camilan',
    'sort.featured': 'Urutkan: Unggulan', 'sort.loved': 'Paling Disukai',
    'sort.rating': 'Rating Tertinggi', 'sort.pricelow': 'Harga: Rendah → Tinggi',
    'sort.pricehigh': 'Harga: Tinggi → Rendah',
    // Checkout
    'co.eye': 'Checkout aman', 'co.h1': 'Hampir selesai.',
    'co.name': 'Nama untuk pickup *', 'co.wa': 'WhatsApp (opsional)',
    'co.note': 'Catatan pesanan (opsional)',
    // Menu card / dynamic
    'card.order': 'Pesan', 'card.sold': 'Habis', 'card.only': 'Sisa', 'card.left': 'lagi',
    'card.reviews': 'ulasan', 'card.loved': '♥ Disukai Pelanggan', 'card.mostloved': '♥ Paling Disukai',
    // Cart drawer / dynamic
    'cart.title': 'Keranjangmu', 'cart.empty': 'Kosong untuk saat ini',
    'cart.empty.msg': 'Keranjang masih kosong.<br>Yuk pilih cokelat favoritmu.',
    'cart.browse': 'Lihat Menu', 'cart.nocustom': 'Tanpa kustomisasi',
    'cart.remove': 'Hapus', 'cart.subtotal': 'Subtotal',
    'cart.taxnote': 'Pajak & biaya dihitung di checkout.', 'cart.checkout': 'Checkout',
    'cart.added': 'ditambahkan ke keranjang',
    // Loyalty (track + checkout)
    'loy.title': 'Poin Loyalitas', 'loy.earned': 'Poin dari pesanan ini',
    'loy.balance': 'Saldo poin', 'loy.tier': 'Tier', 'loy.worth': 'senilai',
    'loy.next': 'lagi menuju', 'loy.guest': 'Isi nomor WhatsApp saat checkout untuk mulai kumpulkan poin.',
    'co.earn': "Kamu akan dapat", 'co.points': 'poin',
    'co.have': 'Kamu punya', 'co.usepoints': 'Pakai poin', 'co.remove': 'Batal',
    'co.discount': 'Diskon poin',
    // Store closed
    'store.closed': 'Toko Sedang Tutup',
    'store.closed.sub': 'Order tidak dapat dilakukan saat ini.',
    // Track
    'trk.placed': 'Pesanan Diterima', 'trk.paid': 'Pembayaran', 'trk.prep': 'Sedang Dibuat',
    'trk.ready': 'Siap Diambil', 'trk.cancel': 'Batalkan Pesanan',
  },
  en: {
    'nav.home': 'Home', 'nav.menu': 'Menu', 'nav.reviews': 'Reviews',
    'nav.story': 'Our Story', 'nav.order': 'Order',
    'live.hours': 'Open · 08.00 – 16.00 WIB',
    'live.cups': 'cups served today',
    'live.fav': "Today's favorite:",
    'live.preorder': 'Open · Pre-order available',
    'live.wait': 'Avg wait:',
    'live.pickup': 'Avg pickup time:',
    'hero.tag': 'Kantin FEB UGM · Since 2026',
    'hero.h1': 'Happiness, <em>poured</em><br>in every sip.',
    'hero.sub': 'Sixteen ways to taste chocolate. Made fresh, served warm or cold, loved by 85+ students every day. Pre-order, skip the queue, and pick up at the counter.',
    'hero.btn1': 'Browse Menu →', 'hero.btn2': 'Read Reviews',
    'hero.stat.rating': 'Avg Rating', 'hero.stat.items': 'Menu Items',
    'sec.favorites.eye': "Today's Favorites",
    'sec.favorites.h2': 'Loved by <em>everyone</em>,<br>brewed for <em>you</em>.',
    'sec.favorites.desc': 'The most ordered drinks this week. Real reviews, real ratings — from real students like you.',
    'sec.reviews.eye': 'What People Are Saying',
    'sec.reviews.h2': 'Honest <em>words</em>,<br>from honest <em>tongues</em>.',
    'sec.reviews.desc': "We don't curate reviews. Every voice — every star — comes straight from someone who actually bought a cup.",
    'sec.story.eye': 'Our Story',
    'sec.story.h2': 'A small <em>kantin counter.</em><br>A big chocolate <em>dream.</em>',
    'sec.story.p1': '.Cho was born inside Kantin FEB UGM in February 2026 — a passion project by Biru and her team. The vision: prove that the best chocolate drinks don\'t need a Jakarta café. They just need real cocoa, real care, and a counter that knows your name.',
    'sec.story.p2': 'Today, .Cho serves an average of 85 cups a day to FEB students, lecturers, and the occasional dosen on deadline. Every menu — from Chocoriginal to Sugar Cloud — is built around one promise: <strong>happiness, poured.</strong>',
    'sec.story.stat.cups': 'Cups Daily',
    'sec.story.stat.variants': 'Menu Variants',
    'sec.story.stat.rating': 'Customer Rating',
    'btn.browse': 'Browse Menu →',
    'btn.see_reviews': 'See All Reviews →',
    'btn.explore': 'Explore Full Menu →',
    'footer.tagline': 'Premium chocolate beverages brewed daily at Kantin FEB UGM. Happiness, poured.',
    'footer.order': 'Order', 'footer.community': 'Community', 'footer.visit': 'Visit Us',
    'footer.fullmenu': 'Full Menu', 'footer.preorder': 'Pre-order',
    'footer.pickup': 'Pickup at Counter', 'footer.allreviews': 'All Reviews',
    'footer.loyalty': 'Loyalty Program', 'footer.ownerlogin': 'Owner Login →',
    'menu.eye': 'Our Menu',
    'menu.h1': 'Sixteen ways to taste <em>chocolate.</em>',
    'menu.desc': 'Every cup is crafted fresh. Customize sugar level, foam, and takeaway preference on the next screen.',
    'filter.all': 'All Menu', 'filter.choco': 'Choco Series', 'filter.snacks': 'Snacks',
    'sort.featured': 'Sort: Featured', 'sort.loved': 'Most Loved',
    'sort.rating': 'Highest Rated', 'sort.pricelow': 'Price: Low → High',
    'sort.pricehigh': 'Price: High → Low',
    'co.eye': 'Secure checkout', 'co.h1': 'Almost there.',
    'co.name': 'Name for pickup *', 'co.wa': 'WhatsApp (optional)',
    'co.note': 'Order note (optional)',
    'card.order': 'Order', 'card.sold': 'Sold out', 'card.only': 'Only', 'card.left': 'left',
    'card.reviews': 'reviews', 'card.loved': '♥ Customer Loved', 'card.mostloved': '♥ Most Loved',
    'cart.title': 'Your Cart', 'cart.empty': 'Empty for now',
    'cart.empty.msg': 'Your cart is empty.<br>Pick your favorite chocolate.',
    'cart.browse': 'Browse Menu', 'cart.nocustom': 'No customization',
    'cart.remove': 'Remove', 'cart.subtotal': 'Subtotal',
    'cart.taxnote': 'Taxes & fees calculated at checkout.', 'cart.checkout': 'Checkout',
    'cart.added': 'added to cart',
    'loy.title': 'Loyalty Points', 'loy.earned': 'Points from this order',
    'loy.balance': 'Points balance', 'loy.tier': 'Tier', 'loy.worth': 'worth',
    'loy.next': 'more to', 'loy.guest': 'Add your WhatsApp number at checkout to start earning points.',
    'co.earn': "You'll earn", 'co.points': 'points',
    'co.have': 'You have', 'co.usepoints': 'Use points', 'co.remove': 'Remove',
    'co.discount': 'Points discount',
    'store.closed': 'Store is Currently Closed',
    'store.closed.sub': 'Orders cannot be placed at this time.',
    'trk.placed': 'Order Placed', 'trk.paid': 'Payment', 'trk.prep': 'Preparing',
    'trk.ready': 'Ready for Pickup', 'trk.cancel': 'Cancel Order',
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
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = this.t(el.dataset.i18n);
      if (val.includes('<')) el.innerHTML = val; else el.textContent = val;
    });
    document.documentElement.lang = this.lang;
    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.textContent = this.lang === 'id' ? 'EN' : 'ID';
      btn.title = this.lang === 'id' ? 'Switch to English' : 'Ganti ke Indonesia';
    });
    // Let dynamic renderers (menu cards, cart, etc.) redraw in the new language.
    window.dispatchEvent(new Event('langchange'));
  },
  init() {
    document.querySelectorAll('.lang-toggle').forEach(btn => btn.addEventListener('click', () => this.toggle()));
    this.apply();
  }
};

// Init ASAP; also re-run on DOMContentLoaded in case the toggle button renders late.
if (document.readyState !== 'loading') i18n.init();
else document.addEventListener('DOMContentLoaded', () => i18n.init());
