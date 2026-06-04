<div align="center">
<img width="1200" height="400" alt="GHBanner" src="https://socialify.git.ci/heruhendri/sistem-manajemen-invoice-noc/image?font=Inter&language=1&name=1&owner=1&pattern=Circuit%20Board&theme=Dark" />

# Sistem Manajemen Invoice NOC Nusantara
**Infrastruktur Penagihan & Monitoring SLA Berbasis MikroTik API**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16-green.svg)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/Vite-6.0-blue.svg)](https://vitejs.dev)
[![License](https://img.shields.io/badge/license-MIT-important.svg)](LICENSE)
</div>

Sistem Manajemen Invoice NOC adalah platform manajemen biling proaktif untuk ISP, RTRW-Net, dan penyedia layanan jaringan. Terintegrasi dengan MikroTik API untuk monitoring trafik real-time, manajemen voucher hotspot, dan otomatisasi pengingat tagihan via WhatsApp/Telegram.

## 🚀 Instalasi Cepat (Auto-Installer)

Gunakan perintah `curl` di bawah ini pada terminal Linux Anda untuk melakukan instalasi otomatis (Node.js & Git diperlukan):

```bash
curl -sSL https://raw.githubusercontent.com/heruhendri/sistem-manajemen-invoice-noc/main/setup.sh | bash
```

## 🛠 Fitur Utama
- **Dashboard Billing:** Pantau status invoice (Paid, Unpaid, Overdue) secara real-time.
- **MikroTik Integration:** Monitoring trafik, status PPPoE, dan Hotspot langsung dari dashboard.
- **E-Catalog & Voucher:** Pembelian voucher hotspot instan dengan simulasi pembayaran QRIS.
- **Gateway Notifikasi:** Pengiriman tagihan otomatis via WhatsApp Relay dan Telegram Bot.
- **E-Invoice PDF:** Generate invoice profesional dengan QRIS statis otomatis.
- **Vite 6 Security:** Otomasi konfigurasi `allowedHosts` untuk deployment domain publik yang aman.

## 💻 Akses Dashboard
Setelah instalasi selesai, aplikasi dapat diakses melalui:
- **Lokal:** `http://localhost:5173`
- **Publik:** Gunakan domain/IP server Anda (Contoh: `http://noc.hendrii.web.id`)

## 📋 Prasyarat Sistem
- **Node.js:** Versi 16 atau lebih tinggi.
- **Git:** Untuk manajemen source code.
- **PM2 (Opsional):** Untuk menjalankan aplikasi secara permanen di background.

## 📞 Kontak & Dukungan
Jika Anda menemukan kendala atau memerlukan kustomisasi lebih lanjut, silakan hubungi tim pengembang:

- **Developer:** Heru Hendri
- **Repository:** GitHub heruhendri/sistem-manajemen-invoice-noc
- **Support:** Melalui menu *Integration View* di dalam dashboard untuk pengaturan bot.

---
<div align="center">
  <p>Dibuat dengan ❤️ untuk Komunitas Jaringan Indonesia</p>
</div>
