# MATA HATI: narasi proposal (Kategori: Efisiensi Risiko pada Fasilitas Kesehatan)

**Satu kalimat.** Analitik klaim melihat apa yang ditagihkan; hanya pasien yang tahu apa yang benar-benar diterimanya. MATA HATI mempertemukan keduanya.

**Masalah.** Modus seperti pengurangan jumlah obat (#18), menagihkan tindakan yang tidak dilakukan (#14), phantom billing (#6), dan perpanjangan hari rawat (#12) tampak rapi di data klaim. Tanpa suara pasien, modus ini sulit terlihat.

**Cara kerja.**
1. Peserta melihat layanan yang tercatat atas namanya dan menjawab satu pertanyaan (jumlah obat, tindakan, hari rawat).
2. Selisih dihitung oleh kode dari data klaim, bukan oleh AI. AI hanya membantu memahami cerita bebas dan menyusun penjelasan alternatif.
3. Satu laporan tidak pernah dianggap bukti. Faskes baru ditandai bila beberapa pelapor berbeda menyebut hal serupa dalam 30 hari.
4. Petugas mendapat antrean prioritas dan draf klarifikasi. Keputusan tetap pada petugas.

**Pengaman.** Sistem tidak pernah menyimpulkan kecurangan. Identitas pelapor tidak dibagikan ke faskes. Nama dan nomor kartu tidak dikirim ke AI. Prototipe hanya memakai data simulasi sesuai ketentuan Healthkathon.

**Usulan uji coba (butuh persetujuan BPJS Kesehatan).** Satu wilayah, satu modus (jumlah obat), 3 bulan. Pengingat dikirim lewat kanal yang sudah dipakai peserta. Ukur: tingkat respons, kecocokan hasil dengan verifikasi petugas, dan waktu verifikasi.

**Jawaban untuk pertanyaan juri.**
- *Laporan salah atau balas dendam?* Ambang pelapor berbeda; lihat simulasi pada tab Evaluasi.
- *Peserta mau menjawab?* Satu pertanyaan, tanpa antre; tingkat respons adalah hal pertama yang diukur pada uji coba.
- *Mengapa AI?* Cerita bebas, foto, dan penjelasan alternatif; hitungan selisih tetap deterministik.
- *Dampak?* Belum terukur pada data nyata. Simulasi menunjukkan pengaruh ambang pelapor; angka asli dari uji coba.
