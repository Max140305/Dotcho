# .Cho — Pre-Order & Operations System (Prototype)

Sistem pre-order + operasi untuk **.Cho**, kedai cokelat di Kantin FEB UGM.
Dibuat untuk final project **AKU3404 — Analisis & Perancangan Sistem**.

Live: **[dotcho.vercel.app](https://dotcho.vercel.app)** · Admin: [dotcho.vercel.app/admin](https://dotcho.vercel.app/admin)

---

## 🏗 Stack & Arsitektur

**Pure static HTML / CSS / JS** — tidak ada framework, tidak ada build step, bisa di-host gratis di Vercel.

| Layer | Teknologi |
|---|---|
| Hosting | Vercel (static, zero-config) |
| Real-time sync | Firebase Realtime Database (`dotcho-571f0`) |
| State | `localStorage` + Firebase cross-device sync |
| Auth | localStorage flag (demo-grade) |
| i18n | Built-in EN/ID toggle (`js/i18n.js`) |

Data flow: `localStorage` ↔ `Firebase RTDB` — setiap perubahan di satu device langsung sync ke semua device lain via `firebase-sync.js`.

---

## 🗂 Struktur file

```
/ (customer)
  index.html       Landing page
  menu.html        Katalog menu + filter + sort
  order.html       Detail item + kustomisasi (gula, foam, takeaway)
  checkout.html    Checkout + pembayaran tersimulasi + loyalty redeem
  track.html       Live order tracking + leave review + loyalty card
  reviews.html     Semua ulasan pelanggan

/admin
  login.html       Login owner
  index.html       Dashboard owner (7 views)

/js
  data.js          Menu, add-ons, reviews seed, resep (BOM), payment methods
  storage.js       Semua state & business logic (cart, order, inventory, loyalty, analytics, CSV)
  main.js          Interaksi customer (cart drawer, render menu, i18n hooks)
  admin.js         Logika seluruh 7 views admin
  firebase-sync.js Cross-device sync via Firebase RTDB
  i18n.js          EN/ID bilingual (169 key, full parity)

/css
  style.css        Tema customer
  admin.css        Tema admin
```

---

## ✨ Fitur lengkap

### Sisi customer
- **Browse → Cart → Checkout → Tracking** — alur pre-order end-to-end.
- **Cart drawer** multi-item, persist lintas halaman.
- **Checkout tersimulasi**: QRIS, E-Wallet, Virtual Account.
- **Order tracking live** (`/track?id=...`) — status update otomatis: Placed → Paid → Preparing → Ready.
- **Leave a review** langsung dari tracking page (setelah order selesai), dengan live sync ke admin & reviews.html.
- Badge ketersediaan akurat: "Habis", "Sisa N lagi", "Made to order".
- **EN/ID toggle** — 169 key bilingual, termasuk konten dinamis (menu card, cart, opsi order).

### Sisi owner (admin dashboard — 7 views)
| View | Isi |
|---|---|
| **Dashboard** | KPI hari ini, recent orders, stock alerts, toko buka/tutup toggle |
| **Orders** | Live feed pesanan, tab filter status, PAID/UNPAID pill, Start prep → Complete |
| **Inventory** | Semua bahan + level stok, buildability engine, manual adjust (+/-/Set), ledger, WA vendor |
| **Menu Management** | Override 3-state per item: Auto / Force-sell / Off |
| **Reviews & Customers** | Semua review, distribusi rating, segmentasi tier member real |
| **Members & Loyalty** | Registry member, poin, tier VIP/Regular/New, export CSV |
| **Analytics & Reports** | Revenue 7 hari, top seller, status order, metode bayar, export CSV |

### Loyalty system (Phase 4)
- **Earn**: 1 poin / Rp1.000 pada setiap order berbayar.
- **Redeem**: 100 poin = Rp1.000 diskon, bisa digunakan di checkout.
- **Tier** otomatis berdasar lifetime points: New → Regular (≥500) → VIP (≥2.000).
- Identitas member = **nomor WhatsApp** (normalisasi format `+62`/`0` otomatis).
- Tersimpan di Firebase → lintas device & session.
- Loyalty card tampil di tracking page setelah order selesai.

### Inventory engine
- **Resep (BOM)** per menu — order otomatis mengurangi stok bahan.
- **Availability engine**: hitung "bisa buat berapa cup" dari stok saat ini → auto-hide menu kalau bahan habis.
- **Predicted days remaining** per bahan.
- **WA auto-order** ke vendor dengan template siap kirim + backup routing.

---

## 🔐 Login admin (demo)
```
Username : biru
Password : dotcho2026
```

---

## 🚀 Deploy ke Vercel

### Opsi A — Via GitHub (Recommended)
1. Push folder ini ke repo GitHub.
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → Import repo.
3. **Framework Preset**: `Other`.
4. Klik **Deploy** — selesai. `vercel.json` sudah ada.

### Opsi B — Via Vercel CLI
```bash
npm i -g vercel && cd /path/ke/folder-ini && vercel
# Framework: Other | Root: ./
```

### URL
| | URL |
|---|---|
| 🏠 Landing | `dotcho.vercel.app/` |
| ☕ Menu | `dotcho.vercel.app/menu` |
| 🛒 Checkout | `dotcho.vercel.app/checkout` |
| 📍 Tracking | `dotcho.vercel.app/track?id=...` |
| ⭐ Reviews | `dotcho.vercel.app/reviews` |
| 🔒 Admin Login | `dotcho.vercel.app/admin/login` |
| 📊 Dashboard | `dotcho.vercel.app/admin` |

---

## 🎬 Skenario demo

Buka **dua tab** di browser yang sama, atau **dua device** yang berbeda (sama-sama connect internet — Firebase sync real-time):

1. **Tab A** = customer (`/`), **Tab B** = admin (`/admin`).
2. Di A: pilih menu → Order Now → checkout (isi nama + nomor WA untuk loyalty) → Simulate payment.
3. Di B: lonceng notifikasi muncul, order masuk PAID, stok bahan berkurang, ledger nambah baris.
4. Di B: **Start prep → Complete**. Di A, tracking page maju otomatis + toast notif.
5. Coba **Choco Strawberry** (stok 0 → OUT). Di B → Menu → **Force-sell** → item bisa dipesan lagi.
6. Di B → Inventory → **Straws** kritis → **📱 WA** → kirim template order ke vendor.
7. Setelah order selesai (done), di A klik **Leave a Review** — review langsung muncul di reviews.html & admin tanpa reload.
8. Di B → Members & Loyalty: lihat poin yang terakumulasi dari order berbayar tadi.
9. Di B → Analytics: revenue, top seller, chart status order.
10. Export CSV: orders / members / sales report langsung ke file.

---

## 🛣 Catatan arsitektur

- **State layer** (`js/storage.js`) dirancang sebagai *stable method surface*: migrasi ke backend nyata (Supabase/Postgres + REST) cukup mengganti isi method, UI tidak perlu diubah.
- **Firebase** digunakan untuk sync cross-device bukan sebagai primary storage — localStorage tetap berfungsi kalau Firebase offline (graceful fallback).
- **Firebase Object Coercion**: Firebase RTDB menserialisasi array sebagai object bila key tidak kontinu. Storage._get() otomatis mengkoreksi ini untuk mencegah crash `.filter()/.map()` dll.
- Data customer dan admin tersinkron via `dotcho_orders`, `dotcho_inventory`, `dotcho_reviews_user`, `dotcho_members`, `dotcho_store_status`, dan key lainnya.
- Admin dilindungi via `X-Robots-Tag: noindex` + `Cache-Control: no-store` di `vercel.json`, plus auth gate di `<head>` admin/index.html (no flash of UI).

---

© 2026 .Cho · Prototype AKU3404 · "Happiness in Every Sip"
