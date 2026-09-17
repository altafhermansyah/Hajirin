# Hajirin - Integrated Event Management & E-Ticketing System

Hajirin adalah platform manajemen event dan e-ticketing berbasis web yang dirancang untuk mengintegrasikan seluruh alur pengelolaan acara dalam satu sistem terstruktur. Platform ini memfasilitasi kebutuhan Event Organizer (EO) dalam publikasi dan pengelolaan event, sekaligus memberikan pengalaman pemesanan serta validasi tiket digital secara real-time bagi peserta.

---

## Fitur Utama

- **Manajemen Event Organizer (EO) & Multi-Role (RBAC):** Pemisahan hak akses ketat antara Super Admin (Platform Owner), Event Organizer, dan Peserta. Mendukung sistem pendaftaran dan verifikasi berkas akun EO.
- **Pengelolaan Event & Status:** Pembuatan dan penyuntingan event dengan tingkatan status terstruktur (Draft, Published, Completed, Cancelled).
- **Manajemen Tiket & Kuota:** Pengaturan jenis tiket (Free/Paid, VIP/Regular), tanggal batas penjualan, dan alokasi kuota.
- **Pemesanan & Payment Gateway:** Transaksi tiket otomatis terintegrasi dengan Payment Gateway (Midtrans/Xendit Sandbox) yang dilengkapi sistem batas waktu pembayaran (expiry time).
- **Tiket Digital & Validasi QR Code:** Penerbitan e-ticket dengan kode unik dan QR Code dinamis. Dilengkapi fitur scan check-in langsung berbasis web (kamera HP/webcam) untuk panitia di lokasi.
- **Dashboard Pengelolaan Real-Time:** 
  - **Super Admin:** Moderasi event dan verifikasi akun EO.
  - **Event Organizer:** Grafik penjualan tiket, total pendapatan, statistik kehadiran, dan fitur ekspor data peserta (CSV/Excel).

---

## Stack Teknologi

- **Framework:** Laravel 13
- **Bahasa Pemrograman:** PHP 8.3+
- **Database:** PostgreSQL
- **Frontend:** HTML, CSS, JavaScript (Blade / Tailwind CSS)
- **Version Control:** Git & GitHub
- **Integrasi System:** Payment Gateway (Midtrans/Xendit), QR Code Generator & Scanner

---

## Tim Pengembang (Kelompok 3)

| NIM | Nama Anggota |
| :--- | :--- |
| 434251001 | Altaf Muhammad Hermansyah |
| 434251003 | Shobiburrahmat Al Fahruz Zabad |
| 434251014 | Ahmad Maulana Nugroho |

---

## Panduan Instalasi Lokal

### Requirements
- PHP >= 8.3
- Composer >= 2.x
- Node.js & NPM
- PostgreSQL
