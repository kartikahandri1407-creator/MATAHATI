# MATA HATI

Prototipe untuk BPJS Kesehatan Healthkathon 2026. Cerita peserta tentang pelayanan di faskes dibandingkan dengan catatan klaim, lalu kasus yang perlu dicek diurutkan untuk petugas. **MATA HATI tidak menyimpulkan adanya kecurangan.** Semua data di dalamnya fiktif.

## Fitur
- **Cek Layanan Saya** (tampilan peserta): lihat layanan yang tercatat, jawab satu pertanyaan terarah, dapat balasan yang jelas. Tombol "tampilan petugas" menunjukkan hasil lengkap untuk demo.
- **Antrean Verifikasi**: daftar laporan, pola per faskes (pelapor berbeda dalam 30 hari), draf surat simulasi.
- **Data Master**: tambah / ubah / hapus faskes dan klaim, atau kembalikan data contoh.
- **Evaluasi**: uji pada cerita contoh berlabel (mesin lokal atau Gemini via server).
- Terbuka dengan 8 kasus, 5 faskes, 13 klaim contoh. Semuanya bisa dihapus dan dikembalikan.

## Menjalankan di komputer
```bash
npm install
cp .env.example .env     # isi GEMINI_API_KEY (dan Supabase bila ada)
npm run dev              # http://localhost:3000
npm test                 # 50 tes aturan inti, tanpa memanggil Gemini asli
```
Tanpa Supabase, data disimpan di browser. Tanpa kunci Gemini, analisis memakai mesin aturan lokal (header menampilkan statusnya).

## Mengaktifkan database
Pilih salah satu. Bila dua-duanya diisi, Firebase dipakai.

### Opsi A: Firebase (Firestore)
1. Di console.firebase.google.com buat proyek, lalu **Build > Firestore Database > Create database** (mode production).
2. Tab **Rules**: tempel isi `firestore.rules`, klik **Publish** (browser dilarang akses; hanya server yang boleh).
3. **Project settings > Service accounts > Generate new private key**. File JSON terunduh (rahasia, jangan di-commit).
4. Isi env `FIREBASE_SERVICE_ACCOUNT` dengan **seluruh isi file JSON itu dalam satu baris**. Cara mudah dan aman dari kutip: ubah ke base64 dengan `base64 -w0 kunci.json` (Mac: `base64 -i kunci.json`) lalu tempel hasilnya; keduanya diterima.
5. Muat ulang aplikasi; header menampilkan "Data: database online". Data tersimpan di koleksi `mh_cases`, `mh_claims`, `mh_facilities`.

### Opsi B: Supabase
1. Buat proyek di supabase.com. Di **SQL Editor** jalankan isi `supabase/schema.sql`.
2. **Project Settings > API**: salin Project URL dan service_role key.
3. Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`.

## Deploy ke Vercel
1. Unggah proyek ke GitHub (`.env` tidak ikut karena sudah di `.gitignore`).
2. Di Vercel: **Add New > Project**, pilih repositori. Framework: Vite.
3. **Settings > Environment Variables**, isi: `GEMINI_API_KEY` dan `FIREBASE_SERVICE_ACCOUNT` (atau dua nilai Supabase). Lalu **Redeploy**.
4. Buka `https://<proyek>.vercel.app/api/health`. Harus tampil `geminiConfigured:true` dan `dbConfigured:true`.
5. Cek keamanan: buka DevTools > Network. Kunci tidak boleh terlihat di request atau file JS mana pun.

Fungsi server ada di `src/server/*` (satu logika untuk AI Studio dan Vercel). File `api/*.js` dihasilkan oleh `npm run build:api` (otomatis saat `npm run build`); jangan diedit manual.

## Di Google AI Studio
Tambahkan `GEMINI_API_KEY` (dan Supabase bila ada) di Secrets. `server.ts` menjalankan `/api/analyze` dan `/api/db`.

## Aturan yang dijaga kode
- `fraud_determination` selalu `NOT_DETERMINED`.
- Reliabilitas rendah tidak pernah jadi "perlu diverifikasi"; kasus butuh penilaian medis maksimal "mungkin berbeda".
- Selisih angka dihitung kode dari klaim di database, bukan oleh AI; bila AI dan kode bertentangan hasilnya "info belum cukup".
- Cerita dibungkus sebagai data, bukan perintah. Nama dan nomor kartu peserta tidak dikirim ke AI.
- Batas input: cerita 10-3000 huruf, foto maks. 3 MB (JPG/PNG/WEBP), 10 analisis/menit/klien.

## Batasan
Belum terhubung ke sistem BPJS, belum diuji pada data nyata, belum ada login. Angka evaluasi memakai cerita fiktif buatan tim.
