// .Cho — Menu & Review Data
// Seeded from Opaper screenshots + interview with owner (Biru)

const MENU = [
  // Choco Series
  { id: 'chocoriginal', name: 'Chocoriginal', category: 'Choco Series', price: 18000, rating: 4.7, reviewCount: 142, loved: true, available: true, notes: 'The classic. Rich, balanced, the soul of .Cho.', image: 'choco-original' },
  { id: 'hot-choco', name: 'Hot Choco', category: 'Choco Series', price: 20000, rating: 4.8, reviewCount: 89, loved: true, available: true, notes: 'Warm hug in a cup. Best on rainy afternoons.', image: 'hot-choco', isHot: true },
  { id: 'choco-banana', name: 'Choco Banana', category: 'Choco Series', price: 23000, rating: 4.6, reviewCount: 76, available: true, notes: 'Real banana meets cocoa. Creamy, fruity, comforting.', image: 'choco-banana' },
  { id: 'choco-strawberry', name: 'Choco Strawberry', category: 'Choco Series', price: 23000, rating: 4.5, reviewCount: 63, available: true, notes: 'Strawberry crunch on velvet chocolate. Playful.', image: 'choco-strawberry' },
  { id: 'seasalt-choco', name: 'Seasalt Choco', category: 'Choco Series', price: 23000, rating: 4.9, reviewCount: 198, loved: true, mostLoved: true, available: true, notes: 'Sweet meets salty. A bestseller for a reason.', image: 'seasalt' },
  { id: 'choco-berry', name: 'Choco Berry', category: 'Choco Series', price: 23000, rating: 4.4, reviewCount: 51, available: true, notes: 'Mixed berries fold into deep chocolate.', image: 'choco-berry' },
  { id: 'mocca', name: 'Mocca', category: 'Choco Series', price: 23000, rating: 4.7, reviewCount: 112, loved: true, available: true, notes: 'Espresso shadow, chocolate body. For thinkers.', image: 'mocca' },
  { id: 'choco-yuzu', name: 'Choco Yuzu', category: 'Choco Series', price: 23000, rating: 4.5, reviewCount: 47, available: false, notes: 'Japanese citrus brightens dark cocoa. Unexpected.', image: 'choco-yuzu' },
  { id: 'choco-pistachio', name: 'Choco Pistachio', category: 'Choco Series', price: 23000, rating: 4.6, reviewCount: 84, available: true, notes: 'Nutty, indulgent, slightly green. Pure dessert.', image: 'choco-pistachio' },
  { id: 'choco-butterscotch', name: 'Choco Butterscotch', category: 'Choco Series', price: 23000, rating: 4.5, reviewCount: 58, available: true, notes: 'Caramelized sugar threads through chocolate.', image: 'choco-butterscotch' },
  { id: 'choco-salted-caramel', name: 'Choco Salted Caramel', category: 'Choco Series', price: 23000, rating: 4.7, reviewCount: 95, loved: true, available: true, notes: 'Burnt caramel, fleur de sel, deep cocoa.', image: 'salted-caramel' },
  { id: 'sweet-corn', name: 'Sweet Corn', category: 'Choco Series', price: 23000, rating: 4.3, reviewCount: 42, available: true, notes: 'Local twist. Sweet corn cream over chocolate.', image: 'sweet-corn' },
  { id: 'sugar-cloud', name: 'Sugar Cloud', category: 'Choco Series', price: 25000, rating: 4.8, reviewCount: 156, loved: true, available: false, notes: 'Signature foam, cinnamon dust. Light as cloud.', image: 'sugar-cloud' },
  { id: 'hot-sugar-cloud', name: 'Hot Sugar Cloud', category: 'Choco Series', price: 25000, rating: 4.7, reviewCount: 71, loved: true, available: true, notes: 'Sugar Cloud, but warm. Comfort elevated.', image: 'hot-sugar-cloud', isHot: true },

  // Snacks
  { id: 'churros', name: 'Churros', category: 'Snacks', price: 15000, rating: 4.5, reviewCount: 67, available: true, notes: 'Cinnamon sugar, crispy edges, soft inside.', image: 'churros' },
  { id: 'chocolate-fondue', name: 'Chocolate Fondue', category: 'Snacks', price: 20000, rating: 4.6, reviewCount: 54, available: false, notes: 'Warm chocolate, fresh fruit, marshmallow.', image: 'fondue' },
];

// Variants / Add-ons
const ADDONS = {
  sugarLevel: {
    label: 'Sugar Level',
    required: true,
    options: [
      { id: 'no-sugar', label: 'No Sugar', price: 0 },
      { id: 'normal', label: 'Normal', price: 0 },
      { id: 'sweet', label: 'Sweet', price: 0 },
    ]
  },
  extraFoam: {
    label: 'Extra Foam',
    required: false,
    options: [
      { id: 'no-foam', label: 'No Extra', price: 0 },
      { id: 'extra-foam', label: 'Yes, please', price: 2000 },
    ]
  },
  takeaway: {
    label: 'Takeaway',
    required: true,
    options: [
      { id: 'dine-in', label: 'Dine in', price: 0 },
      { id: 'takeaway', label: 'Takeaway (+Rp500)', price: 500 },
    ]
  }
};

// Seeded Reviews (in production: from database)
const REVIEWS = [
  { id: 1, menuId: 'seasalt-choco', author: 'Rania A.', avatar: 'R', rating: 5, date: '3 days ago', text: 'Beneran addictive. Manis-asin balance-nya gokil. Udah 4x order minggu ini 😅', verified: true, helpful: 24 },
  { id: 2, menuId: 'chocoriginal', author: 'Daffa P.', avatar: 'D', rating: 5, date: '1 week ago', text: 'Buat anak ekonomi yang lagi tirakat skripsi — ini fuel utama. Harga student-friendly, rasa premium.', verified: true, helpful: 31 },
  { id: 3, menuId: 'sugar-cloud', author: 'Inez M.', avatar: 'I', rating: 5, date: '2 days ago', text: 'Foam-nya tuh… literally cloud. Pertama kali nyobain langsung jadi favorit. Sayang sering habis 🥺', verified: true, helpful: 18 },
  { id: 4, menuId: 'mocca', author: 'Bagas R.', avatar: 'B', rating: 5, date: '5 days ago', text: 'Mocca-nya pas. Espresso-nya kerasa tapi gak nutupin chocolate. Recommended buat coffee person.', verified: true, helpful: 15 },
  { id: 5, menuId: 'choco-strawberry', author: 'Salsa K.', avatar: 'S', rating: 4, date: '1 day ago', text: 'Strawberry crunchnya juara. Tapi kemarin agak terlalu manis buat aku, mungkin next time minta no sugar.', verified: true, helpful: 9 },
  { id: 6, menuId: 'choco-salted-caramel', author: 'Arif N.', avatar: 'A', rating: 5, date: '4 days ago', text: 'Salted caramel-nya proper. Gak lebay kayak brand sebelah. Worth it banget.', verified: true, helpful: 22 },
  { id: 7, menuId: 'hot-choco', author: 'Mei L.', avatar: 'M', rating: 5, date: '6 days ago', text: 'Hujan-hujan di kantin, pesen Hot Choco — perfect. Cinnamon-nya subtle, gak ngalahin coklat.', verified: true, helpful: 12 },
  { id: 8, menuId: 'choco-pistachio', author: 'Reza H.', avatar: 'R', rating: 5, date: '1 week ago', text: 'Pistachio crunch on top. Sweet spot antara chocolate dan nutty. Premium feel.', verified: true, helpful: 14 },
  { id: 9, menuId: 'seasalt-choco', author: 'Tia W.', avatar: 'T', rating: 5, date: '2 weeks ago', text: 'Best seller for a reason. Selalu repeat order kalo lagi nugas di Gd. Pertamina.', verified: true, helpful: 19 },
  { id: 10, menuId: 'churros', author: 'Faris B.', avatar: 'F', rating: 4, date: '3 days ago', text: 'Crispy outside, soft inside. Dipped in choco fondue = chef\'s kiss. Sayang fondue lagi habis.', verified: true, helpful: 11 },
];

// Today's social proof
const SOCIAL_PROOF = {
  cupsToday: 67,
  servingNow: 4,
  topMenuToday: 'Seasalt Choco',
  happyToday: 23, // people who left 5-star today
};

// =====================================================================
// PHASE 2 — RECIPE / BILL-OF-MATERIALS (BOM)
// Maps each menu item to the raw ingredients it consumes per unit.
// Drives: auto inventory deduction on order + system availability engine
// ("can we still make this based on stock?"). Quantities are ESTIMATES,
// fully adjustable by admin. In production these come from a recipe table.
// =====================================================================
const _coldBase = { cups: 1, straws: 1, cocoa: 0.025, milk: 0.18, sugar: 0.015, cream: 0.02 };
const _hotBase  = { cups: 1, cocoa: 0.030, milk: 0.20, sugar: 0.015, cream: 0.02 };

const RECIPES = {
  'chocoriginal':         { ..._coldBase },
  'hot-choco':            { ..._hotBase },
  'choco-banana':         { ..._coldBase, banana: 0.05 },
  'choco-strawberry':     { ..._coldBase, strawberry: 0.04 },
  'seasalt-choco':        { ..._coldBase, salt: 0.005 },
  'choco-berry':          { ..._coldBase, strawberry: 0.03 },
  'mocca':                { ..._coldBase, coffee: 0.012 },
  'choco-yuzu':           { ..._coldBase },
  'choco-pistachio':      { ..._coldBase, pistachio: 0.02 },
  'choco-butterscotch':   { ..._coldBase, caramel: 0.02 },
  'choco-salted-caramel': { ..._coldBase, caramel: 0.02, salt: 0.003 },
  'sweet-corn':           { ..._coldBase },
  'sugar-cloud':          { ..._coldBase, cream: 0.06, marshmallow: 0.01 },
  'hot-sugar-cloud':      { ..._hotBase, cream: 0.06, marshmallow: 0.01 },
  'churros':              { sugar: 0.03, cocoa: 0.005 },
  'chocolate-fondue':     { cocoa: 0.05, cream: 0.03, marshmallow: 0.03 },
};

// Payment methods — online only (cash removed to prevent ghost orders)
const PAYMENT_METHODS = [
  { id: 'qris',     label: 'QRIS',                 sub: 'Scan & pay · all e-wallets + m-banking', instant: true },
  { id: 'ewallet',  label: 'E-Wallet',             sub: 'GoPay · OVO · DANA · ShopeePay',         instant: true },
  { id: 'transfer', label: 'Bank Transfer (VA)',   sub: 'BCA · Mandiri · BNI virtual account',    instant: true },
];
