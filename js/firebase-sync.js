// js/firebase-sync.js — Cross-device sync via Firebase Realtime Database
// Extends localStorage so orders/inventory/notifs sync across all devices.
// Customer orders on HP → admin sees it on laptop in real-time. ✓
//
// SETUP: Ganti FIREBASE_CONFIG di bawah dengan config dari Firebase Console.
// Project Settings → Your apps → Web app → firebaseConfig

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyD-lZRuJ4euFQZkmUr40g_IfyHjTudOdcI",
  authDomain:        "dotcho-571f0.firebaseapp.com",
  databaseURL:       "https://dotcho-571f0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "dotcho-571f0",
  storageBucket:     "dotcho-571f0.firebasestorage.app",
  messagingSenderId: "160805312045",
  appId:             "1:160805312045:web:c7c6ec53ec45eb5599caa4",
  measurementId:     "G-JNSS09XK4K",
};

// Keys yang perlu sync antar device (shared state)
// Cart & auth tetap localStorage only (per-user)
const SYNC_KEYS = [
  'dotcho_orders',
  'dotcho_inventory',
  'dotcho_menu_availability',
  'dotcho_notifs',
  'dotcho_ledger',
  'dotcho_reviews_user',
  'dotcho_members',
  'dotcho_store_status', // so admin open/close syncs to customer devices
];

const FB = {
  db:    null,
  ready: false,

  async init() {
    if (typeof firebase === 'undefined') {
      console.warn('[.Cho] Firebase SDK not loaded — running localStorage-only mode');
      return;
    }
    // Skip if config not filled in yet

    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      this.db    = firebase.database();
      this.ready = true;

      // Pull latest data from Firebase into localStorage first
      await this._pullAll();

      // Then listen for real-time changes (cross-device sync)
      this._listenAll();

      console.log('[.Cho] Firebase sync aktif ✓');
    } catch (e) {
      console.warn('[.Cho] Firebase gagal — fallback ke localStorage', e.message);
    }
  },

  // Write to Firebase (called by Storage._set)
  push(key, value) {
    if (!this.ready || !SYNC_KEYS.includes(key)) return;
    try { this.db.ref('store/' + key).set(value); } catch (e) {}
  },

  // Pull all shared keys from Firebase → localStorage (on page load)
  async _pullAll() {
    for (const key of SYNC_KEYS) {
      try {
        const snap = await this.db.ref('store/' + key).once('value');
        const val  = snap.val();
        if (val !== null) localStorage.setItem(key, JSON.stringify(val));
      } catch (e) {}
    }
  },

  // Real-time listener: Firebase change → update localStorage → refresh UI
  _listenAll() {
    SYNC_KEYS.forEach(key => {
      this.db.ref('store/' + key).on('value', snap => {
        const val = snap.val();
        if (val === null) return;
        const incoming = JSON.stringify(val);
        if (localStorage.getItem(key) !== incoming) {
          localStorage.setItem(key, incoming);
          // Re-use existing cross-tab sync handler di main.js & admin.js
          window.dispatchEvent(new StorageEvent('storage', { key, newValue: incoming }));
        }
      });
    });
  },
};
