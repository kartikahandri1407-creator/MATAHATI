/**
 * MATA HATI - Peran dan menu.
 * Prototipe ini belum memakai login. Peran dipilih manual agar alurnya bisa diikuti dari tiga sisi,
 * dan setiap peran HANYA melihat menu miliknya. Pada produksi, peran ditentukan oleh akun (JKN Mobile
 * untuk peserta, akun pegawai untuk petugas, akun faskes untuk faskes).
 */
export type TabId = 'home' | 'report' | 'mine' | 'queue' | 'faskes' | 'master' | 'eval' | 'tools' | 'about';
export type Role = 'peserta' | 'petugas' | 'faskes' | 'pengelola';

export interface RoleDef {
  id: Role;
  label: string;          // "Peserta JKN"
  short: string;
  oneLiner: string;       // satu kalimat apa yang dilakukan peran ini
  tabs: TabId[];
  home: TabId;
  sees: string[];         // yang bisa dibuka
  notSees: string;        // yang tidak bisa dibuka
  /** Kelas warna (statis agar terbaca Tailwind). */
  bar: string; chip: string; dot: string; ring: string;
}

export const TAB_LABEL: Record<TabId, { label: string; short: string; what: string }> = {
  home: { label: 'Beranda', short: 'Beranda', what: '' },
  report: { label: 'Cek Layanan', short: 'Cek', what: 'Lihat layanan yang tercatat atas nama Anda, lalu jawab satu pertanyaan.' },
  mine: { label: 'Laporan Saya', short: 'Laporan', what: 'Pantau perkembangan setiap laporan yang sudah Anda kirim.' },
  queue: { label: 'Antrean Verifikasi', short: 'Antrean', what: 'Laporan yang sudah dibandingkan dengan klaim, diurutkan dari yang paling perlu diperiksa.' },
  faskes: { label: 'Permintaan Konfirmasi', short: 'Konfirmasi', what: 'Pertanyaan netral dari petugas tentang pencatatan layanan di faskes Anda.' },
  master: { label: 'Data Klaim', short: 'Data', what: 'Catatan klaim faskes yang menjadi pembanding jawaban peserta.' },
  eval: { label: 'Uji Kualitas AI', short: 'Uji AI', what: 'Bukti terukur bahwa pembacaan cerita oleh AI akurat, konsisten, dan adil.' },
  tools: { label: 'Alat Demo', short: 'Alat', what: 'Perlengkapan untuk menyiapkan atau mengulang peragaan.' },
  about: { label: 'Tentang', short: 'Tentang', what: 'Latar, batasan, dan cara kerja MATA HATI.' }
};

export const ROLES: Record<Role, RoleDef> = {
  peserta: {
    id: 'peserta', label: 'Peserta JKN', short: 'Peserta', home: 'report', tabs: ['report', 'mine', 'about'],
    oneLiner: 'Mengecek layanan atas nama Anda dan memantau laporan.',
    sees: ['Layanan yang tercatat atas nama Anda', 'Status laporan Anda'], notSees: 'Antrean petugas, data klaim, dan identitas peserta lain.',
    bar: 'bg-emerald-700', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', ring: 'ring-emerald-200'
  },
  petugas: {
    id: 'petugas', label: 'Petugas BPJS Kesehatan', short: 'Petugas', home: 'queue', tabs: ['queue', 'about'],
    oneLiner: 'Memeriksa laporan yang sudah dicocokkan dengan klaim dan meminta konfirmasi faskes.',
    sees: ['Antrean verifikasi berurutan prioritas', 'Pola per faskes', 'Jejak setiap kasus'], notSees: 'Nama dan nomor kartu peserta.',
    bar: 'bg-tinta', chip: 'bg-sky-50 text-sky-900 border-sky-200', dot: 'bg-sky-500', ring: 'ring-sky-200'
  },
  faskes: {
    id: 'faskes', label: 'Fasilitas Kesehatan', short: 'Faskes', home: 'faskes', tabs: ['faskes', 'about'],
    oneLiner: 'Menjawab pertanyaan konfirmasi tentang pencatatan di faskes sendiri.',
    sees: ['Permintaan konfirmasi untuk faskes ini saja'], notSees: 'Identitas peserta, cerita peserta, dan faskes lain.',
    bar: 'bg-teal-700', chip: 'bg-teal-50 text-teal-900 border-teal-200', dot: 'bg-teal-500', ring: 'ring-teal-200'
  },
  pengelola: {
    id: 'pengelola', label: 'Pengelola Sistem', short: 'Pengelola', home: 'master', tabs: ['master', 'eval', 'tools', 'about'],
    oneLiner: 'Mengelola data klaim, memantau kualitas AI, dan menyiapkan peragaan.',
    sees: ['Data klaim', 'Uji kualitas AI', 'Alat demo'], notSees: 'Laporan individual peserta.',
    bar: 'bg-violet-700', chip: 'bg-violet-50 text-violet-900 border-violet-200', dot: 'bg-violet-500', ring: 'ring-violet-200'
  }
};

export const ROLE_ORDER: Role[] = ['peserta', 'petugas', 'faskes', 'pengelola'];

/** Peran pemilik sebuah halaman. Halaman "Tentang" dan "Beranda" terbuka untuk semua. */
export function roleOfTab(tab: TabId, current: Role): Role {
  if (tab === 'home' || tab === 'about') return current;
  return ROLE_ORDER.find(r => ROLES[r].tabs.includes(tab)) || current;
}
