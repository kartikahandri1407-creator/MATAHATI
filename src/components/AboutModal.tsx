import React from 'react';
import { AlertTriangle, BrainCircuit, Building2, CheckCircle2, ClipboardCheck, Database, Scale, UserRound } from 'lucide-react';
import { ROLES, ROLE_ORDER, TAB_LABEL } from '../data/roles';
import { PageHeader } from './PageHeader';

const Num: React.FC<{ n: number }> = ({ n }) => (
  <span className="w-7 h-7 rounded-full bg-tinta text-white text-sm font-bold flex items-center justify-center shrink-0">{n}</span>
);

const TRY: { title: string; role: string; text: string }[] = [
  { title: 'Jawab sebagai peserta', role: 'Peserta JKN', text: 'Buka Cek Layanan, pilih layanan, isi berapa obat yang Anda terima. Selisih langsung dihitung.' },
  { title: 'Periksa sebagai petugas', role: 'Petugas BPJS Kesehatan', text: 'Buka Antrean Verifikasi. Laporan baru sudah berurutan prioritas. Buka satu kasus, lalu buat surat konfirmasi untuk faskes.' },
  { title: 'Jawab sebagai faskes', role: 'Fasilitas Kesehatan', text: 'Pilih faskesnya, lihat permintaan konfirmasi yang netral, lalu kirim jawaban dengan alasan.' },
  { title: 'Lihat hasilnya', role: 'Peserta dan Petugas', text: 'Peserta melihat perkembangan di Laporan Saya. Petugas melihat posisi setiap laporan di antrean.' }
];

const MODUS: [string, string, 'inti' | 'coba' | 'luar'][] = [
  ['Pengurangan jumlah obat', '#18', 'inti'],
  ['Menagihkan tindakan yang tidak dilakukan', '#14', 'inti'],
  ['Prolonged length of stay', '#12', 'inti'],
  ['Phantom billing, inflated bills, readmisi, upcoding', '#6 #7 #19 #16 #4', 'coba'],
  ['Cloning, repeat billing, unbundling', '#5 #11 #9', 'luar']
];
const MODUS_LABEL = { inti: ['Inti, diuji', 'bg-emerald-50 text-emerald-800 border-emerald-200'], coba: ['Masih eksperimen', 'bg-amber-50 text-amber-900 border-amber-200'], luar: ['Tidak dicakup: sudah terbaca dari data klaim', 'bg-slate-100 text-slate-600 border-slate-200'] } as const;

const ROLE_ICON = { peserta: UserRound, petugas: ClipboardCheck, faskes: Building2, pengelola: Database } as const;

export const AboutModal: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
    <PageHeader eyebrow="Tentang" title="MATA HATI" text="Setelah berobat, peserta melihat apa yang tercatat atas namanya dan menjawab satu pertanyaan singkat. Bila jawabannya berbeda dari catatan, laporan itu dibandingkan dengan klaim dan diteruskan ke petugas. Dari menuduh, menjadi memperbaiki." />
    <p className="-mt-6 text-sm text-slate-500"><b className="text-slate-700">MATA</b> = Monitoring &amp; Audit Tindakan FAskes · <b className="text-slate-700">HATI</b> = Berbasis Hak &amp; Aspirasi PeserTa Integratif</p>

    <section className="space-y-4">
      <h3 className="text-xl font-extrabold text-tinta">Cara mencoba demo ini dalam empat langkah</h3>
      <ol className="grid sm:grid-cols-2 gap-4">
        {TRY.map((t, i) => (
          <li key={t.title} className="card p-5 flex gap-4">
            <Num n={i + 1} />
            <div>
              <div className="font-bold text-slate-900">{t.title}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mt-0.5">{t.role}</div>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{t.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-sm text-slate-600">Ganti peran kapan saja lewat tombol <b>Ganti peran</b> di bagian atas. Penanda "Masuk sebagai ..." selalu menunjukkan Anda sedang berperan sebagai siapa.</p>
    </section>

    <section className="space-y-4">
      <h3 className="text-xl font-extrabold text-tinta">Siapa membuka apa</h3>
      <div className="card overflow-hidden">
        {ROLE_ORDER.map(r => {
          const d = ROLES[r]; const Ic = ROLE_ICON[r];
          return (
            <div key={r} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 p-4 sm:p-5 border-t first:border-t-0 border-slate-100">
              <div className="sm:w-56 shrink-0 flex items-center gap-2.5"><span className={`w-8 h-8 rounded-lg grid place-items-center border ${d.chip}`}><Ic className="w-4 h-4" /></span><span className="font-bold text-slate-900 text-sm">{d.label}</span></div>
              <div className="min-w-0 text-sm space-y-1">
                <div className="text-slate-800">{d.tabs.filter(t => t !== 'about').map(t => TAB_LABEL[t].label).join(' · ')}</div>
                <div className="text-slate-500">Tidak melihat: {d.notSees}</div>
              </div>
            </div>);
        })}
      </div>
      <p className="text-sm text-slate-600">Prototipe ini belum memakai login, jadi peran dipilih manual. Pada produksi, peran ditentukan oleh akun: JKN Mobile untuk peserta, akun pegawai untuk petugas, akun faskes untuk faskes, dan akun khusus untuk pengelola.</p>
    </section>

    <section className="space-y-4">
      <h3 className="text-xl font-extrabold text-tinta">Cara kerja</h3>
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          ['Cerita', 'Peserta mengisi jumlah yang diterima, boleh disertai cerita atau foto.'],
          ['Bandingkan', 'AI membaca cerita menjadi fakta. Selisih dihitung program dari klaim, bukan ditebak AI.'],
          ['Prioritaskan', 'Hasil: sesuai catatan, info belum cukup, mungkin berbeda, atau perlu diverifikasi. Laporan berurutan prioritas.'],
          ['Konfirmasi', 'Petugas meminta penjelasan faskes dengan bahasa netral. Tiga pelapor berbeda pada satu faskes menaikkan perhatian.']
        ].map(([t, x], i) => (
          <div key={t} className="card p-4"><Num n={i + 1} /><div className="font-bold text-slate-900 mt-3">{t}</div><p className="text-sm text-slate-600 mt-1 leading-relaxed">{x}</p></div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-2">
          <div className="flex items-center gap-2 font-extrabold text-emerald-900"><BrainCircuit className="w-5 h-5" />AI dipakai untuk</div>
          <ul className="text-sm text-slate-700 space-y-1.5 leading-relaxed list-disc pl-5"><li>Memahami cerita peserta dalam bahasa sehari-hari.</li><li>Menerjemahkan pertanyaan petugas ke pencarian terstruktur ("Tanya antrean").</li><li>Membantu menyusun draf surat yang netral.</li></ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
          <div className="flex items-center gap-2 font-extrabold text-tinta"><Scale className="w-5 h-5" />AI tidak dipakai untuk</div>
          <ul className="text-sm text-slate-700 space-y-1.5 leading-relaxed list-disc pl-5"><li>Menghitung selisih dan angka di layar. Itu dikerjakan program.</li><li>Menyatakan ada kecurangan.</li><li>Memutuskan tindak lanjut. Itu hak petugas.</li></ul>
        </div>
      </div>
    </section>

    <section className="space-y-4">
      <h3 className="text-xl font-extrabold text-tinta">Modus Healthkathon yang disentuh</h3>
      <div className="card overflow-hidden">
        {MODUS.map(([m, code, k]) => (
          <div key={m} className="flex items-start justify-between gap-4 px-4 sm:px-5 py-3 border-t first:border-t-0 border-slate-100">
            <div className="min-w-0"><div className="text-sm text-slate-900">{m}</div><div className="text-[11px] text-slate-400 mt-0.5">Panduan {code}</div></div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border text-right ${MODUS_LABEL[k][1]}`}>{MODUS_LABEL[k][0]}</span>
          </div>))}
      </div>
      <p className="text-sm text-slate-600">Fokusnya modus yang hanya terlihat dari sisi peserta, yaitu apa yang benar-benar diterima di lapangan. Modus yang bisa dideteksi dari data klaim saja sengaja tidak ditiru.</p>
    </section>

    <section className="grid md:grid-cols-2 gap-6">
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 font-extrabold text-slate-900"><CheckCircle2 className="w-5 h-5 text-emerald-700" />Batasan yang dijaga</div>
        <ul className="text-sm text-slate-700 space-y-2 leading-relaxed list-disc pl-5">
          <li>Tidak pernah menyatakan ada kecurangan. Hasil hanya urutan prioritas untuk diperiksa manusia.</li>
          <li>Cerita yang kurang jelas atau terlihat seperti perintah ke AI menghasilkan "info belum cukup", bukan tanda.</li>
          <li>Jenis yang butuh penilaian dokter paling tinggi hanya "mungkin berbeda".</li>
          <li>Nama dan nomor kartu peserta tidak dikirim ke AI maupun ke faskes.</li>
          <li>Kunci AI dan database hanya ada di server.</li>
        </ul>
      </div>
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 font-extrabold text-slate-900"><AlertTriangle className="w-5 h-5 text-amber-600" />Yang belum ada</div>
        <ul className="text-sm text-slate-700 space-y-2 leading-relaxed list-disc pl-5">
          <li>Belum terhubung ke sistem BPJS Kesehatan dan belum diuji pada data nyata.</li>
          <li>Belum ada login. Pembatasan menu per peran masih simulasi.</li>
          <li>Satu orang masih bisa mengirim beberapa laporan di demo. Pada produksi, identitas peserta mencegahnya dihitung ganda.</li>
          <li>Uji kualitas memakai cerita fiktif buatan tim, jadi angkanya hanya gambaran awal.</li>
          <li>Lapisan AI dapat diganti, termasuk dengan layanan AI internal BPJS Kesehatan.</li>
        </ul>
      </div>
    </section>

    <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 text-sm text-amber-950 leading-relaxed">
      <strong>Prototipe dengan data fiktif.</strong> Klaim dan cerita dibuat mengikuti sebaran Data Sampel BPJS Kesehatan 2024 (ringkasan agregat). Nama faskes dan semua laporan adalah rekaan. Tidak ada data peserta JKN yang nyata, dan ini bukan produk resmi BPJS Kesehatan. Tim PUAN KARSA, Healthkathon BPJS Kesehatan 2026.
    </div>
  </div>
);
