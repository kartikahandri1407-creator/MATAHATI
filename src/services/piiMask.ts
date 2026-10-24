/**
 * MATA HATI - Penyamaran identitas pada cerita peserta.
 *
 * Cerita ditulis bebas, jadi bisa saja memuat nama, nomor kartu, NIK, nomor telepon, atau surel.
 * Sistem tidak membutuhkan semua itu, jadi bagian tersebut diganti penanda sebelum cerita dianalisis,
 * dikirim ke AI, atau disimpan. Petugas dan faskes pun tidak pernah melihatnya.
 *
 * Fungsi murni, tanpa tampilan, dan aman dijalankan berulang (hasilnya tidak berubah).
 * Ini lapisan pengaman tambahan, bukan jaminan mutlak: tetap ada anjuran agar peserta tidak menulis identitas.
 */
export type PiiKind = 'EMAIL' | 'TELEPON' | 'NIK' | 'KARTU' | 'NOMOR' | 'LAHIR' | 'NAMA';
export interface PiiFound { kind: PiiKind; label: string; count: number }
export interface MaskResult { text: string; found: PiiFound[]; total: number }

const LABEL: Record<PiiKind, string> = {
  EMAIL: 'surel', TELEPON: 'nomor telepon', NIK: 'NIK', KARTU: 'nomor kartu', NOMOR: 'nomor identitas', LAHIR: 'tanggal lahir', NAMA: 'nama'
};
const TOKEN: Record<PiiKind, string> = {
  EMAIL: '[SUREL]', TELEPON: '[NOMOR TELEPON]', NIK: '[NIK]', KARTU: '[NOMOR KARTU]', NOMOR: '[NOMOR]', LAHIR: '[TANGGAL LAHIR]', NAMA: '[NAMA]'
};

const BULAN = '(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|jun|jul|agu|agt|sep|sept|okt|nov|des)';
const NAME = "[A-Z][a-zA-Z'’-]+(?:\\s+[A-Z][a-zA-Z'’-]+){0,3}";
const STOP = 'dan|yang|tapi|tetapi|di|ke|dari|saya|lupa|agak|sudah|belum|tidak|pernah|pada|waktu|ketika|karena|untuk|dengan|adalah|itu|ini|berobat|dirawat|datang|menerima|membayar';
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function maskPII(input: string, opts: { knownNames?: (string | undefined | null)[] } = {}): MaskResult {
  const counts = new Map<PiiKind, number>();
  const bump = (k: PiiKind, n = 1) => counts.set(k, (counts.get(k) || 0) + n);
  let text = String(input ?? '');

  const sub = (kind: PiiKind, re: RegExp, make?: (m: RegExpExecArray) => string) => {
    text = text.replace(re, (...args: any[]) => {
      const m = args.slice(0, -2) as unknown as RegExpExecArray;
      bump(kind);
      return make ? make(m) : TOKEN[kind];
    });
  };

  // 1) Surel
  sub('EMAIL', /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g);
  // 2) Telepon (08xx..., +62 8xx..., 62 8xx...) dengan pemisah spasi, titik, atau strip
  sub('TELEPON', /(?<![\d\w-])(?:\+?62|0)[\s.-]?8(?:[\s.-]?\d){8,11}(?!\d)/g);
  // 3) NIK (16 digit) dan nomor kartu BPJS (13 digit), boleh bergrup
  sub('NIK', /(?<![\w-])(?:\d[\s.-]?){15}\d(?!\d)/g);
  sub('KARTU', /(?<![\w-])(?:\d[\s.-]?){12}\d(?!\d)/g);
  // 4) Nomor panjang lain (10 digit atau lebih), mis. nomor rekam medis
  sub('NOMOR', /(?<![\d\w-])\d{10,}(?![\d\w])/g);
  // 5) Tanggal lahir
  sub('LAHIR', new RegExp(`\\b(?:tanggal lahir|tgl\\.? lahir|lahir(?: pada| tanggal| tgl\\.?)?)\\s*:?\\s*(?:\\d{1,2}[\\/. -]\\d{1,2}[\\/. -]\\d{2,4}|\\d{1,2}\\s+${BULAN}\\s+\\d{4})`, 'gi'));
  // 6) Nama: setelah penanda ("nama saya", "atas nama", "bernama"), dan setelah sapaan/gelar
  sub('NAMA', new RegExp(`\\b([Nn]ama(?:\\s+(?:saya|pasien|lengkap|ibu|bapak|anak|suami|istri))?|[Aa]tas\\s+nama|a\\.n\\.?|[Bb]ernama)(\\s*:?\\s+)(${NAME})`, 'g'), m => `${m[1]}${m[2]}${TOKEN.NAMA}`);
  // 6b) Nama ditulis huruf kecil setelah penanda yang jelas, mis. "nama saya budi hartono"
  sub('NAMA', new RegExp(`\\b((?:[Nn]ama\\s+saya|[Aa]tas\\s+nama|[Bb]ernama)\\s*:?\\s+)(?!(?:${STOP})\\b)([a-z][a-z'’-]{2,}(?:\\s+(?!(?:${STOP})\\b)[a-z][a-z'’-]{2,}){0,1})`, 'g'), m => `${m[1]}${TOKEN.NAMA}`);
  sub('NAMA', new RegExp(`\\b(Bapak|Ibu|Pak|Bu|Bpk|Sdr|Sdri|Tn|Ny|Nn|dr|drg|Prof)(\\.?\\s+)(${NAME})`, 'g'), m => `${m[1]}${m[2]}${TOKEN.NAMA}`);
  // 7) Nama yang sudah diketahui dari data klaim (lengkap, lalu tiap kata agar sebutan singkat ikut tersamarkan)
  const known = (opts.knownNames || []).map(n => String(n || '').trim()).filter(n => n.length >= 3);
  for (const full of known) {
    sub('NAMA', new RegExp(`(?<![\\w])${escapeRe(full)}(?![\\w])`, 'gi'));
    for (const part of full.split(/\s+/).filter(p => p.length >= 4)) sub('NAMA', new RegExp(`(?<![\\w\\[])${escapeRe(part)}(?![\\w\\]])`, 'gi'));
  }

  const found: PiiFound[] = [...counts.entries()].map(([kind, count]) => ({ kind, label: LABEL[kind], count }));
  return { text, found, total: found.reduce((a, f) => a + f.count, 0) };
}

/** Ringkasan untuk ditampilkan ke peserta atau petugas, mis. "1 nomor telepon dan 2 nama". */
export function describeMasked(found: PiiFound[]): string {
  if (!found.length) return '';
  const parts = found.map(f => `${f.count} ${f.label}`);
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} dan ${parts[parts.length - 1]}`;
}
