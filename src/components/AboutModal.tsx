import React from 'react';

const Step: React.FC<{ n: number; title: string; text: string }> = ({ n, title, text }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="w-7 h-7 rounded-full bg-emerald-700 text-white text-sm font-bold flex items-center justify-center mb-2">{n}</div>
    <div className="font-semibold text-slate-900 text-sm">{title}</div>
    <p className="text-sm text-slate-600 mt-1">{text}</p>
  </div>
);

export const AboutModal: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight text-tinta">Tentang MATA HATI</h2>
      <p className="text-sm text-slate-500 mt-1"><b className="text-slate-700">MATA</b> = Monitoring &amp; Audit Tindakan FAskes · <b className="text-slate-700">HATI</b> = Berbasis Hak &amp; Aspirasi PeserTa Integratif</p>
      <p className="text-slate-700 mt-2">Prototipe untuk BPJS Kesehatan Healthkathon 2026. Setelah berobat, peserta melihat apa yang tercatat atas namanya dan menjawab satu pertanyaan singkat. Bila jawabannya berbeda dari catatan, laporan itu dibandingkan dengan klaim dan diteruskan ke petugas. Dari menuduh, menjadi memperbaiki.</p>
    </div>

    <section className="space-y-3">
      <h3 className="font-bold text-slate-900">Modus pada panduan Healthkathon yang disentuh</h3>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-sm">
        {[
          ['#18 Pengurangan jumlah obat', 'Inti, dievaluasi', 'emerald'],
          ['#14 Menagihkan tindakan yang tidak dilakukan', 'Inti, dievaluasi', 'emerald'],
          ['#12 Prolonged length of stay', 'Inti, dievaluasi', 'emerald'],
          ['#6 Phantom billing (jumlah kunjungan)', 'Eksperimen', 'amber'],
          ['#7 / #19 Inflated bills (biaya tambahan di kasir)', 'Eksperimen', 'amber'],
          ['#16 Readmisi · #4 Upcoding', 'Eksperimen, butuh penilaian dokter', 'amber'],
          ['#5 Cloning · #11 Repeat billing · #9 Unbundling', 'Tidak dicakup. Terbaca dari data klaim saja, sudah ranah analitik klaim BPJS', 'slate']
        ].map(([m, st, tone]) => (
          <div key={m} className="flex items-start justify-between gap-4 px-4 py-2.5 border-t first:border-t-0 border-slate-100">
            <span className="text-slate-800">{m}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-right ${tone === 'emerald' ? 'bg-emerald-50 text-emerald-800' : tone === 'amber' ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>{st}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-600">Fokusnya modus yang hanya bisa dilihat dari sisi peserta, yaitu apa yang benar-benar diterima di lapangan. Modus yang bisa dideteksi dari data klaim saja sengaja tidak ditiru.</p>
    </section>

    <section className="space-y-3">
      <h3 className="font-bold text-slate-900">Tiga pihak yang sama-sama terbantu</h3>
      <div className="grid sm:grid-cols-3 gap-3">
        <Step n={1} title="Peserta" text="Tahu apa yang dibayarkan atas namanya, bisa bilang bila ada yang berbeda, dan mendapat balasan yang jelas." />
        <Step n={2} title="Petugas" text="Mendapat antrean prioritas dengan bukti dua sisi, selisih yang dihitung program, dan kemungkinan penjelasan lain." />
        <Step n={3} title="Faskes" text="Diminta konfirmasi dengan bahasa netral, sehingga kesalahan pencatatan atau stok kosong bisa dijelaskan lebih awal." />
      </div>
    </section>

    <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 text-sm text-amber-950">
      <strong>Semua data di aplikasi ini fiktif</strong> (peserta, faskes, klaim, dan cerita). Tidak ada data peserta JKN yang sebenarnya.
    </div>

    <section className="space-y-3">
      <h3 className="font-bold text-slate-900">Cara kerja</h3>
      <div className="grid sm:grid-cols-4 gap-3">
        <Step n={1} title="Cerita" text="Peserta atau pendamping menulis apa yang dialami, boleh dengan suara atau foto." />
        <Step n={2} title="Bandingkan" text="Isi cerita diambil sebagai fakta, lalu dibandingkan dengan klaim di basis data. Selisih dihitung oleh program, bukan ditebak AI." />
        <Step n={3} title="Tandai" text="Hasilnya salah satu dari: sesuai catatan, info belum cukup, mungkin berbeda, atau perlu diverifikasi. Selalu disertai kemungkinan penjelasan lain." />
        <Step n={4} title="Petugas cek" text="Petugas memeriksa dokumen ke faskes. Beberapa laporan serupa pada satu faskes membuatnya naik di antrean." />
      </div>
    </section>

    <section className="space-y-2 text-sm text-slate-700">
      <h3 className="font-bold text-slate-900">Batasan yang dijaga</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>MATA HATI tidak pernah menyatakan ada kecurangan. Hasilnya hanya urutan prioritas untuk diperiksa manusia.</li>
        <li>Bila cerita kurang jelas atau terlihat seperti perintah ke AI, hasilnya "info belum cukup", bukan tanda.</li>
        <li>Jenis yang butuh penilaian dokter (diagnosis, rawat ulang) paling tinggi hanya "mungkin berbeda".</li>
        <li>Tiga jenis utama yang dievaluasi: jumlah obat, tindakan medis, dan lama rawat inap. Jenis lain masih eksperimen.</li>
        <li>Kunci Gemini dan database hanya ada di server. Browser tidak pernah menerimanya.</li>
        <li>Nama dan nomor kartu peserta tidak dikirim ke AI.</li>
      </ul>
    </section>

    <section className="space-y-2 text-sm text-slate-700">
      <h3 className="font-bold text-slate-900">Yang belum ada</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>Belum terhubung ke sistem BPJS yang sebenarnya, dan belum diuji pada data nyata.</li>
        <li>Evaluasi baru memakai cerita fiktif buatan tim, sehingga angkanya hanya gambaran awal.</li>
        <li>Belum ada login dan pembagian peran petugas.</li>
      </ul>
    </section>
  </div>
);
