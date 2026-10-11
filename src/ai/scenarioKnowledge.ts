/**
 * MATA HATI - Scenario Knowledge Base
 * BPJS Kesehatan Healthkathon 2026
 * Jenis ketidaksesuaian pelayanan JKN Berbasis Pengamatan Faktual Pasien
 */

export const SCENARIO_KNOWLEDGE = {
  SCENARIO_1_PENGURANGAN_OBAT: {
    code: 'PENGURANGAN_JUMLAH_OBAT',
    modus_official_no: 18,
    name: 'Pengurangan Jumlah Obat di Farmasi',
    description: 'Ketidaksesuaian antara jumlah kuantitas obat yang diresepkan/ditagihkan dalam klaim dengan jumlah fisik obat yang diserahkan kepada peserta di loket farmasi faskes.',
    context_boundary: 'Fokus pada resep rawat jalan atau penyerahan obat di apotek faskes yang memiliki rincian jumlah obat terukur.',
    common_alternative_explanations: [
      'Stok obat tertentu di instalasi farmasi faskes kosong sementara dan dijadwalkan untuk penyerahan obat susulan (obat bertahap).',
      'Sebagian obat diarahkan untuk diambil di Apotek Jejaring Program Rujuk Balik (PRB) luar faskes.',
      'Kemasan obat atau sediaan memiliki dosis ganda sehingga jumlah fisik tampak lebih sedikit padahal durasi terapi sama.',
      'Pasien salah mengingat jumlah obat atau salah membedakan antara jumlah jenis obat dengan jumlah tablet/botol.'
    ],
    verification_documents: [
      'Buku ekspedisi penyerahan obat / Dispensing Record Farmasi bertanda tangan pasien',
      'Kartu stok obat formularium per tanggal pelayanan',
      'Formulir resep obat susulan / retur obat farmasi'
    ]
  },
  SCENARIO_2_TINDAKAN_TIDAK_DILAKUKAN: {
    code: 'TINDAKAN_TIDAK_DILAKUKAN',
    modus_official_no: 14,
    name: 'Menagihkan Tindakan yang Tidak Dilakukan (Tindakan Fiktif)',
    description: 'Penagihan tindakan medis atau prosedur diagnostik bertarif yang tidak dialami secara fisik oleh pasien.',
    context_boundary: 'Hanya valid sebagai sinyal risiko jika pasien dalam kondisi sadar penuh dan secara eksplisit menyangkal pelaksanaan tindakan tersebut.',
    clinical_synonyms: [
      { layman: 'dibersihkan lukanya / ganti perban', clinical: 'debridement luka / wound dressing' },
      { layman: 'disinar dadanya / difoto dada', clinical: 'foto rontgen thorax' },
      { layman: 'ditempel kabel di dada / rekam jantung', clinical: 'elektrokardiografi (EKG)' },
      { layman: 'ditusuk jarum infus di tangan', clinical: 'pemasangan kanula intravena perifer' },
      { layman: 'diuap / dihirup asap obat', clinical: 'inhalasi terapi nebulizer' }
    ],
    common_alternative_explanations: [
      'Tindakan dilakukan saat pasien dalam keadaan sedasi/bius atau dalam observasi ruang tindakan intensif.',
      'Tindakan merupakan bagian dari paket layanan klinis terintegrasi yang tidak disadari pasien sebagai tindakan terpisah.',
      'Kesalahan koding administrasi (salah entri kode prosedur pada SIMRS faskes).'
    ],
    verification_documents: [
      'Lembar catatan implementasi tindakan keperawatan & verifikasi DPJP',
      'Log pemakaian alat medis / buku pemeliharaan instrumen',
      'Informed consent tindakan medis bertanda tangan pasien/keluarga'
    ]
  },
  SCENARIO_3_PROLONGED_LOS: {
    code: 'PROLONGED_LOS',
    modus_official_no: 12,
    name: 'Prolonged Length of Stay (Penggelembungan Hari Rawat Inap)',
    description: 'Perbedaan durasi hari rawat inap antara penuturan waktu kepulangan pasien dengan data klaim pemulangan administratif.',
    context_boundary: 'AI tidak menentukan kebutuhan medis pasien secara sepihak; output adalah potensi perbedaan yang memerlukan konfirmasi billing dan rekam medis.',
    common_alternative_explanations: [
      'Perbedaan jam checkout: pasien pulang fisik di luar jam kerja namun billing ditutup pada hari administratif berikutnya.',
      'Ada indikasi klinis observasi tambahan atau masa tunggu hasil laboratorium sebelum izin pemulangan resmi.',
      'Pasien salah mengingat tanggal masuk atau tanggal pemulangan.'
    ],
    verification_documents: [
      'Buku register rawat inap & jam checkout perawat ruangan',
      'Resume medis pemulangan bertanda tangan DPJP dan pasien/keluarga',
      'Rincian billing administrasi rumah sakit'
    ]
  },
  SCENARIO_4_IUR_BIAYA_ILEGAL: {
    code: 'IUR_BIAYA_ILEGAL',
    modus_official_no: 19,
    name: 'Iur Biaya Liar / Urun Biaya Ilegal (Cost-Sharing Tidak Sah)',
    description: 'Penarikan biaya tunai atau tambahan uang di loket kasir/farmasi kepada peserta BPJS aktif untuk obat, alat kesehatan, atau tindakan yang seharusnya dijamin penuh dalam paket INA-CBGs atau kapitasi.',
    context_boundary: 'Hanya dibenarkan jika peserta secara sukarela naik kelas rawat inap atas permintaan sendiri. Penarikan pada kelas hak adalah pelanggaran.',
    common_alternative_explanations: [
      'Peserta meminta kenaikan kelas rawat inap atas kehendak sendiri sehingga berlaku selisih tarif resmi.',
      'Peserta secara sukarela meminta obat atau tindakan di luar Formularium Nasional yang tidak dijamin JKN.',
      'Kuitansi yang dibayar adalah biaya pemulasaraan jenazah atau ambulans non-gawat darurat di luar cakupan JKN.'
    ],
    verification_documents: [
      'Bukti kwitansi resmi pembayaran kasir yang diserahkan ke peserta',
      'Surat pernyataan persetujuan kenaikan kelas rawat atas kehendak sendiri',
      'Formulir resep dokter luar rumah sakit'
    ]
  },
  SCENARIO_5_KUNJUNGAN_FIKTIF: {
    code: 'KUNJUNGAN_FIKTIF',
    modus_official_no: 16,
    name: 'Kunjungan / Kontrol Fiktif (Phantom Billing)',
    description: 'Pengajuan klaim pelayanan rawat jalan berkali-kali pada tanggal tertentu di mana peserta secara fisik tidak pernah hadir berobat di fasilitas kesehatan.',
    context_boundary: 'Dapat dideteksi saat peserta mengecek riwayat pelayanan di Mobile JKN dan menemukan klaim berobat pada hari ia bekerja atau di luar kota.',
    common_alternative_explanations: [
      'Obat rutin diambil oleh keluarga/kader kesehatan untuk program PRB tanpa kehadiran pasien fisik.',
      'Konsultasi telemedicine atau telekonsultasi resmi yang dicatatkan pada sistem faskes.',
      'Salah input nomor kepesertaan BPJS (human error kasir registrasi).'
    ],
    verification_documents: [
      'Buku tanda tangan kehadiran fisik pasien di loket registrasi & poli',
      'Surat kuasa pengambilan obat jika diwakilkan keluarga/kader',
      'Log rekam medis elektronik (RME) saat pemeriksaan berlangsung'
    ]
  },
  SCENARIO_6_READMISI_MANIPULATIF: {
    code: 'READMISI_MANIPULATIF',
    modus_official_no: 17,
    name: 'Pemulangan Prematur & Readmisi Sengaja (Churning <30 Hari)',
    description: 'Pasien sengaja dipulangkan sebelum kondisi klinis stabil tuntas, lalu disuruh mendaftar masuk rawat inap kembali dalam hitungan hari (<30 hari) dengan diagnosis sama/terkait agar faskes mencairkan 2 kali klaim INA-CBGs.',
    context_boundary: 'Perlu membedakan antara komplikasi tak terduga dengan kesengajaan penjadwalan pemulangan dini.',
    common_alternative_explanations: [
      'Pasien pulang atas permintaan sendiri (PAPS) lalu kondisinya memburuk di rumah.',
      'Terjadi infeksi sekunder atau komplikasi baru yang tidak terkait penyakit awal.',
      'Jadwal kemoterapi atau transfusi darah berkala yang memang direncanakan bertahap sesuai protokol klinis.'
    ],
    verification_documents: [
      'Surat pernyataan pulang atas permintaan sendiri jika ada',
      'Catatan Discharge Planning dan kriteria kelaikan pemulangan DPJP',
      'Resume medis rawat inap pertama dan kedua untuk korelasi diagnosis'
    ]
  },
  SCENARIO_7_UPCODING_DIAGNOSIS: {
    code: 'UPCODING_DIAGNOSIS',
    modus_official_no: 13,
    name: 'Penggelembungan Diagnosis (Upcoding Tingkat Keparahan)',
    description: 'Pengkodean diagnosis penyakit utama atau sekunder pada klaim INA-CBGs dinaikkan ke tingkat keparahan yang lebih tinggi (severity level III/berat) padahal kondisi faktual pasien adalah ringan/sedang tanpa terapi invasif.',
    context_boundary: 'Pasien dapat bersaksi mengenai ada tidaknya pemasangan alat bantu napas, infus intensif, atau ruang ICU.',
    common_alternative_explanations: [
      'Kondisi komorbiditas bawaan pasien (misal diabetes/hipertensi menahun) yang sah dihitung sebagai sekunder sesuai aturan koding ICD-10.',
      'Hasil pemeriksaan penunjang (laboratorium/analisa gas darah) menunjukkan keparahan yang tidak disadari pasien secara kasat mata.',
      'Perbedaan kaidah koding grouper INA-CBGs kementerian kesehatan.'
    ],
    verification_documents: [
      'Hasil pemeriksaan laboratorium dan penunjang diagnostik penegak kode',
      'Instruksi dokter DPJP terkait terapi intensif atau pemantauan khusus',
      'Lembar rekam medis lengkap per hari perawatan'
    ]
  }
};
