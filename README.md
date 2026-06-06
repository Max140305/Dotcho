# .Cho — Order & Operations System (Prototype)

Sistem pre-order + operasi untuk **.Cho** (Dot.Cho), kedai cokelat di Kantin FEB UGM.
Dibangun untuk mata kuliah **AKU3404 — Analisis & Perancangan Sistem**.

> **Phase 2 — "Replace Opaper".** Bukan lagi sekadar pelengkap: ini alur lengkap
> *browse → cart → checkout → bayar → tracking*, plus dashboard owner dengan
> **inventory engine** yang menghitung sendiri ketersediaan menu dari stok bahan.

---

## ✨ Yang baru di Phase 2

**Sisi customer**
- Keranjang (cart drawer) yang nempel di semua halaman, multi-item.
- **Checkout + pembayaran tersimulasi**: QRIS, E-Wallet, Virtual Account, atau bayar di counter.
- **Order tracking live** (`/track`) — status jalan otomatis saat barista maju: Placed → Paid → Preparing → Ready.
- Badge ketersediaan jujur: "Habis", "Only N left", "Made to order".

**Sisi owner (admin)**
- **Recipe / BOM engine**: tiap menu punya resep bahan. Order otomatis mengurangi stok (estimasi, bisa di-adjust).
- **Availability engine**: sistem menghitung "menu ini masih bisa dibuat berapa cup" dari stok. Kalau bahan habis → menu auto-hilang dari customer.
- **Override 3-state per menu**: `Auto` (ikut engine) · `Force-sell` (tetap jual walau sistem bilang habis) · `Off` (sembunyikan manual).
- **Manual inventory adjust** (+/-/Set) + **WA auto-order** ke vendor dengan backup routing.
- **Stock ledger**: setiap pengurangan/penambahan stok tercatat → akuntabel & bisa diaudit.
- **Notifikasi owner** (lonceng): order baru, pembayaran masuk, stok menipis, restock request, review baru.
- Status pembayaran **Paid/Unpaid** per order + tombol "Mark paid".

---

## 🗂 Struktur

```
index.html         Landing          → /
menu.html          Katalog menu     → /menu
order.html         Detail + cart    → /order?item=...
checkout.html      Checkout         → /checkout
track.html         Order tracking   → /track?id=...
reviews.html       Reviews          → /reviews
admin/login.html   Login owner      → /admin/login
admin/index.html   Dashboard owner  → /admin  (redirect ke /admin/login jika belum login)
js/data.js         Menu, add-ons, reviews, RESEP (BOM), metode bayar
js/storage.js      Engine: cart, order, inventory, availability, ledger, notif
js/main.js         Interaksi customer (cart drawer, toast, render menu)
js/admin.js        Logika dashboard owner
css/style.css      Tema customer   ·   css/admin.css  Tema admin
vercel.json        Routing + headers config untuk Vercel
```

## 🔐 Login admin (demo)
- User: `biru` · Password: `dotcho2026`

---

## 🚀 Deploy ke Vercel

### Opsi A — Via GitHub (Recommended)
1. Push folder ini ke repo GitHub (public atau private).
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → Import repo.
3. **Framework Preset**: pilih `Other` (bukan Next.js dll).
4. Klik **Deploy** — selesai. `vercel.json` sudah ada, tidak perlu config tambahan.

### Opsi B — Via Vercel CLI
```bash
npm i -g vercel
cd /path/ke/folder-ini
vercel
# Ikuti prompt: link ke existing project atau buat baru
# Framework: Other | Root: ./
```

### URL setelah deploy
| Akses | URL |
|---|---|
| 🏠 Landing | `dotcho.vercel.app/` |
| ☕ Menu | `dotcho.vercel.app/menu` |
| 🛒 Checkout | `dotcho.vercel.app/checkout` |
| 📍 Tracking | `dotcho.vercel.app/track?id=...` |
| ⭐ Reviews | `dotcho.vercel.app/reviews` |
| 🔒 Admin Login | `dotcho.vercel.app/admin/login` |
| 📊 Dashboard | `dotcho.vercel.app/admin` *(redirect ke login jika belum auth)* |

### Pemisahan customer ↔ admin (otomatis)
- **Customer** → akses semua halaman di `/` (root). Tidak ada cara masuk ke admin kecuali tahu URL-nya.
- **Admin/Owner** → akses `/admin` atau `/admin/login`. Ada **dua lapis perlindungan**:
  1. `<head>` script di `admin/index.html` — redirect ke login *sebelum* DOM muncul (no flash).
  2. Cek di `admin.js` sebagai fallback.
- Google dan crawler tidak mengindex halaman admin (`X-Robots-Tag: noindex` via `vercel.json`).
- Cache admin dinonaktifkan (`Cache-Control: no-store`) agar session stale tidak tersimpan.

> **Note arsitektur**: Data disimpan di `localStorage` (per-browser). Artinya customer dan admin **harus di browser yang sama** agar order sync real-time (sesuai skenario demo: dua tab di satu browser). Untuk deployment produksi multi-device, ganti `js/storage.js` dengan API calls ke backend nyata.

---

## 🎬 Skenario demo (paling "wah")
Buka **dua tab** di browser yang sama (data sinkron via localStorage):
1. Tab A = customer (`/`), Tab B = admin (`/admin`).
2. Di A: pilih menu → **Order Now** → checkout → pilih QRIS → **Simulate payment**.
3. Lihat B *update otomatis*: lonceng notifikasi bunyi, order muncul **PAID**, stok bahan berkurang, ledger nambah baris.
4. Di B: **Start prep → Complete**. Lihat halaman tracking di A ikut maju + toast.
5. Coba **Choco Strawberry** (stok strawberry = 0 → sistem bilang OUT). Di B → Menu → set **Force-sell** → item kembali bisa dipesan.
6. Di B → Inventory → **Straws** kritis → **WA** → kirim order ke vendor.

---

## 🛣 Catatan arsitektur
Data kini disimpan di **localStorage** (per-browser) agar prototipe ringan & gratis di-host.
Lapisan `js/storage.js` sengaja dirancang dengan *method surface* yang stabil — migrasi ke
backend nyata (Postgres/Supabase + REST) cukup mengganti isi method, tanpa mengubah UI.

© 2026 .Cho · Prototype for AKU3404 · "Happiness in Every Sip"
