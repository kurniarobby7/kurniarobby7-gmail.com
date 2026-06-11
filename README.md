# Sistem Informasi Buku Tamu Online - BPMP Provinsi Lampung

Sistem Informasi Buku Tamu Online interaktif yang dibangun menggunakan React, Node.js (Express), Firebase, dan Google Spreadsheet API. Aplikasi ini memungkinkan pengunjung merekam kunjungannya yang disertai dengan foto (webcam), tanda tangan digital, serta memungkinkan admin untuk mengelola, mengekspor, dan merekapitulasi data tamu secara aman dari dashboard panel.

## Fitur Utama

- **Antarmuka Buku Tamu Kustom:**
  - Desain modern, adaptif (responsive), serta informasi instansi yang komprehensif.
  - Sinkronisasi waktu WIB terintegrasi pada layar pengunjung.
  - Opsi aktivasi manual kamera untuk foto pengunjung secara langsung (selfie).
  - Papan tanda tangan digital.
- **Admin Dashboard (Panel)*:**
  - Login mengamankan akses admin menggunakan konfigurasi Google OAuth (Firebase Auth).
  - Pembatasan Email: Hanya email yang terdaftar yang bisa mengakses panel (pengaturan default `bpmplpg@gmail.com`).
  - Rekapitulasi Data Tamu dan Ekspor Buku Tamu langsung ke PDF maupun Google Spreadsheet (Drive).
  - Pengarsipan otomatis yang tersinkronisasi.
- **Teknologi "Full-Stack":**
  - Vite & React (Frontend)
  - Node.js & Express (Backend/Server API - menangani integrasi lanjutan jika ada)
  - Penyimpanan Otentikasi dan Konfigurasi melalui Firebase.
  - Database terstruktur untuk export ke Google Sheet otomatis dengan Google Drive API v3.

## Struktur Proyek & Teknologi

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite, Lucide React, react-webcam.
- **Backend:** Node.js, Express.
- **Autentikasi:** Firebase Authentication (SSO Google).
- **Format Tanggal/Waktu:** `date-fns`, Sinkronisasi API Native JS.

---

## Cara Menjalankan Versi Pengembangan (Local Development)

Proyek ini menggunakan Vite untuk kompilasi modul frontend, dan `tsx` untuk mengeksekusi server backend lokal.

1. **Prasyarat Sistem:**
   - Node.js versi 18+ terinstall di komputer.
   - Akun Google serta konfigurasi Firebase (`firebase-applet-config.json` di root folder proyek ini).
   - Pastikan Google API seperti Google Sheets API & Google Drive API sudah diaktifkan di Google Cloud Console (jika Anda menjalankan sendiri secara independen).

2. **Instalasi Modul (Dependencies):**
   Gunakan terminal lalu arahkan pada folder proyek ini, dan jalankan perintah:
   ```bash
   npm install
   ```

3. **Memulai Server Backend dan Frontend bersamaan (Development):**
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di `http://localhost:3000`.

---

## Panduan & Cara Deployment (Mendeploy Website)

Kode website ini berformat "Full-Stack" Node.js App dengan perintah `npm run build` yang mem-build aset statis React (`dist`) dan mengompresi Node.js backend. Perintah utama untuk mode produksi (production) adalah `npm start`.

Jika Anda ingin mendeploy (menerbitkan) website ini, Anda harus mengekspor proyek terlebih dahulu menggunakan opsi **Export to ZIP** atau **Export to GitHub** via pengaturan konfigurasi Google AI Studio (di ikon menu/gerigi pada UI).

Berikut adalah beberapa pilihan platform deployment yang disarankan:

### Opsi 1: Google Cloud Run (Sangat Disarankan, Scalable & Modern)
Google Cloud Run sangat cocok karena otomatis membungkus (containerize) aplikasi Node.js.
1. Download proyek anda atau sinkronkan repository ke **GitHub**.
2. Masuk ke console [Google Cloud Run](https://console.cloud.google.com/run).
3. Klik **Create Service** (Buat Layanan).
4. Pilih "Continuously deploy from a repository".
5. Hubungkan ke repository GitHub website ini. Konfigurasi "Build Type" sebagai Docker atau Buildpacks otomatis untuk Node.js.
6. Setel Port menjadi `3000` (atau biarkan default agar sesuai dengan Express app).
7. Konfigurasikan environment variables (Environments) yang diperlukan di dalamnya. (Jangan lupa tambahkan `firebase-applet-config.json` secara aman jika tidak di-push ke git).
8. Klik deploy dan website Anda siap dipublikasikan secara global!

### Opsi 2: Deploy ke Platform PaaS seperti Render / Railway
Layanan ini dapat secara instan mendeploy kode dari repositori tanpa memerlukan manajemen server mandiri.
1. Sinkronkan proyek anda dengan **GitHub**.
2. Masuk ke [Render.com](https://render.com) atau [Railway.app](https://railway.app).
3. Pilih menu "New / Create Web Service" lalu hubungkan dengan repository aplikasi.
4. Isi konfigurasi sebagai berikut:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Atur variabel lingkungan (*Environment Variables*) bila dibutuhkan oleh Firebase atau hal lain di Settings.
6. Aplikasi Anda akan di-deploy dan diberikan link gratis.

### Opsi 3: Deploy ke VPS Mandiri (Cpanel / Ubuntu) via PM2
Jika BPMP memiliki Server / VPS sendiri yang berbasis Linux (Misal: Ubuntu).
1. Clone / Ekspor file proyek Anda ke server menggunakan Git atau FTP.
2. Install `Node.js` terbaru dan `npm` lalu navigasi ke folder project tersebut.
3. Jalankan:
   ```bash
   npm install
   npm run build
   ```
4. Tambahkan module `pm2` untuk menjaga background sistem agar selalu aktif:
   ```bash
   npm install -g pm2
   pm2 start npm --name "buku-tamu" -- start
   ```
5. Gunakan layanan NGINX Reverse Proxy agar domain Anda terhubung langsung ke port lokasi aplikasi Node.js Anda (biasanya `localhost:3000`).

---

## Catatan Tambahan (Pengaturan Keamanan)

1. **Email Admin Terdaftar**: 
   Email utama yang dikonfigurasikan agar dapat mengakses area admin untuk saat ini dibatasi (contoh: `bpmplpg@gmail.com`). Anda dapat mengubah logic *allowedEmails* pada file `/src/components/Admin/AdminLayout.tsx` jika ingin memperbolehkan penambahan email admin baru.
   
2. **Koneksi Akun Developer**:
   Jika Anda menemui error saat login Google dari Panel bahwa aplikasi ini berstatus "terblokir oleh developer" / Oauth Unverified, pastikan email admin / user telah didaftarkan di dalam daftar "Test Users" pada menu pengaturan Google Cloud Console -> **APIs & Services** -> **OAuth Consent Screen** (Apabila status Oauth / project masih bersifat "Testing" dan belum Published).

3. **Perizinan Folder Google Drive**:
   Aplikasi secara otentik memanfaatkan integrasi Google Sheets dari Google Developer Project. Pastikan API OAuth Spreadsheet/File di platform Google Developer milik Anda diberikan hak tulis untuk meminimalisasi kendala permissions yang terjadi saat membuat spreadsheet baru.

---
_Dibuat dan dipersonalisasi untuk pelayanan terpadu BPMP._
