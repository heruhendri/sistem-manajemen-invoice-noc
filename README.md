# Sistem Manajemen Invoice NOC & Monitoring

Sistem Manajemen Invoice NOC adalah platform penagihan (billing) dan pemantauan SLA (Service Level Agreement) yang dirancang khusus untuk penyedia layanan Network Operation Center (NOC) dan Internet Service Provider (ISP). Platform ini menggabungkan manajemen keuangan dengan metrik teknis jaringan secara real-time.

**Repositori GitHub:** [https://github.com/heruhendri/sistem-manajemen-invoice-noc](https://github.com/heruhendri/sistem-manajemen-invoice-noc)

## 🚀 Fitur Utama

*   **Dashboard & Analytics**: Monitoring real-time pendapatan, pengeluaran, laba bersih, serta statistik klien aktif dan status tagihan.
*   **Manajemen Pelanggan & Layanan**: Pengelolaan data klien lengkap dengan detail kontrak SLA dan integrasi IP MikroTik.
*   **Katalog Layanan Fleksibel**: Mendukung tarif tetap (Fixed Rate) maupun tarif dinamis berbasis jumlah user aktif (MikroTik Dynamic Billing).
*   **Bulk Invoice Generator**: Pembuatan invoice massal untuk seluruh pelanggan aktif hanya dengan satu klik, dilengkapi dengan verifikasi audit layanan sebelum penerbitan.
*   **Integrasi WhatsApp Gateway**: Simulasi pengiriman notifikasi tagihan otomatis dengan lampiran invoice PDF langsung ke nomor pelanggan.
*   **Telegram Bot & Database Backup**: Fitur otomasi untuk melakukan backup database harian dalam format JSON ke grup Telegram tim, serta pengiriman alert rekomendasi sistem.
*   **Buku Kas & Rekonsiliasi Otomatis**: Pencatatan arus kas operasional dan fitur inovatif simulasi pencocokan mutasi bank (Virtual Account/QRIS) secara otomatis.
*   **Network Monitoring View**: Visualisasi statistik routerboard pelanggan, pengujian latensi ICMP (Ping), dan akses shell terminal sandbox.
*   **Portal Pelanggan Mandiri**: Halaman khusus bagi pelanggan untuk mengecek riwayat tagihan, melakukan pembayaran via QRIS dinamis, dan melihat performa link SLA mereka.
*   **Kustomisasi Profil Bisnis**: Atur logo, tema warna invoice PDF, data rekening bank, dan payload QRIS statis perusahaan Anda.

## 🛠 Teknologi

*   **React 18** (Vite)
*   **Tailwind CSS**: Desain UI modern dan responsif dengan dukungan Dark Mode.
*   **Framer Motion**: Animasi transisi antar halaman yang halus.
*   **Lucide React**: Library ikon profesional.
*   **LocalStorage Persistence**: Penyimpanan data secara lokal di browser untuk keperluan sandbox/demo tanpa backend.
*   **jsPDF**: Pembuatan dokumen invoice PDF secara dinamis.

## 📂 Struktur Proyek

*   `src/components/`: Komponen UI dan View utama aplikasi (Dashboard, Clients, Invoices, dll).
*   `src/types/`: Definisi interface TypeScript untuk entitas data.
*   `src/utils/`: Utility untuk ekspor PDF, format mata uang, dan manajemen data.
*   `src/mockData.ts`: Inisialisasi data awal untuk simulasi sistem.

## ⚙️ Cara Instalasi & Menjalankan

Pastikan Anda telah menginstal **Node.js** (versi 16 ke atas) dan **npm** di komputer Anda.

1.  **Clone Repositori**:
    ```bash
    git clone https://github.com/heruhendri/sistem-manajemen-invoice-noc.git
    cd sistem-manajemen-invoice-noc
    ```

2.  **Install Dependensi**:
    ```bash
    npm install
    ```

3.  **Jalankan Server Development**:
    ```bash
    npm run dev
    ```

4.  **Akses Aplikasi**: Buka browser dan akses alamat `http://localhost:5173`.

## 🏗️ Build untuk Produksi

Untuk melakukan build aplikasi agar siap dideploy ke hosting statis (seperti Vercel, Netlify, atau GitHub Pages):

```bash
npm run build
```

Hasil build akan tersedia di folder `dist/`.

## 📝 Catatan Penting

*   Sistem ini saat ini menggunakan **simulasi API** untuk koneksi MikroTik, WhatsApp, Telegram, dan Rekonsiliasi Bank guna keperluan demo dan sandbox.
*   Untuk implementasi produksi, Anda perlu mengganti logika simulasi dengan API asli (misalnya menggunakan `RouterOS API node-lib` untuk MikroTik).
*   Data disimpan di `LocalStorage` browser. Membersihkan cache browser akan menghapus data yang telah diinput secara manual.

---
© 2026 PT NOC Net Nusantara - SLA Monitoring & Network Guarantee.