# Sistem Manajemen Invoice NOC & Monitoring

Sistem Manajemen Invoice NOC adalah platform penagihan (billing) dan pemantauan SLA yang dirancang khusus untuk penyedia layanan Network Operation Center (NOC) dan Internet Service Provider (ISP). Platform ini menggabungkan manajemen keuangan dengan metrik teknis jaringan secara real-time.

## 🚀 Fitur Utama

*   **Dashboard Analytics**: Visualisasi performa keuangan, grafik laba rugi, dan statistik operasional.
*   **Dynamic Billing (MikroTik API)**: Fitur inovatif untuk menghitung tagihan secara otomatis berdasarkan jumlah sesi PPPoE Active, Hotspot Active, atau PPP Secrets langsung dari Router MikroTik.
*   **Manajemen Invoice & PDF**: Pembuatan invoice massal (Bulk Generate), pelacakan status (Paid, Unpaid, Overdue), dan ekspor dokumen PDF resmi yang dapat dikustomisasi.
*   **Integrasi Multichannel**:
    *   **WhatsApp Gateway**: Pengiriman pengingat tagihan otomatis dengan lampiran PDF.
    *   **Telegram Bot**: Otomasi backup database harian dan pengiriman alert sistem/rekomendasi SLA ke grup tim.
    *   **Email SMTP**: Pengiriman notifikasi resmi melalui relay email aman.
*   **Rekonsiliasi Bank Otomatis**: Simulasi pencocokan mutasi bank (Virtual Account & QRIS) dengan database invoice untuk pembukuan real-time.
*   **Portal Pelanggan Mandiri**: Portal bagi klien untuk melihat riwayat tagihan, melakukan pembayaran mandiri melalui QRIS Dinamis, dan memantau statistik bandwidth SLA mereka.
*   **Buku Kas Besar**: Pencatatan arus kas masuk dan keluar (beban operasional) untuk memantau kesehatan finansial usaha.

## 🛠 Teknologi

*   **React**: Framework UI utama.
*   **Tailwind CSS**: Styling responsif dengan dukungan Mode Gelap (Dark Mode).
*   **Lucide React**: Set ikon profesional.
*   **Motion (Framer Motion)**: Animasi transisi antarmuka.
*   **LocalStorage Persistence**: Penyimpanan data mock secara lokal untuk keperluan demo/sandbox.

## 📂 Struktur Proyek

*   `src/components/`: Berisi berbagai view utama (Dashboard, Clients, Invoices, Integrations, dll).
*   `src/types/`: Definisi interface TypeScript untuk entitas data.
*   `src/utils/`: Utility untuk ekspor PDF, format mata uang, dan manajemen data.
*   `src/mockData.ts`: Inisialisasi data awal untuk simulasi sistem.

## ⚙️ Cara Menjalankan

1.  **Clone Repositori**
2.  **Install Dependensi**:
    ```bash
    npm install
    ```
3.  **Jalankan Development Server**:
    ```bash
    npm run dev
    ```
4.  **Akses Aplikasi**: Buka browser di `http://localhost:5173` (atau port yang tertera).

## 📝 Catatan Penting

Sistem ini saat ini menggunakan **simulasi API** untuk koneksi MikroTik, WhatsApp, dan Rekonsiliasi Bank. Untuk implementasi produksi, Anda perlu menghubungkan endpoint tersebut dengan gateway API yang sesungguhnya (misalnya menggunakan `RouterOS API node-lib` atau `WhatsApp Business API`).

---
© 2026 PT NOC Net Nusantara - SLA Monitoring Guarantee.