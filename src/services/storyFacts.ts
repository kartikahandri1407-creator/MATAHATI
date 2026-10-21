/**
 * MATA HATI - Mengambil fakta dari cerita peserta (untuk mesin lokal dan pemeriksaan kode).
 * Prinsip: bila peserta tidak menyebut suatu angka, hasilnya null. Tidak ada angka bawaan yang dikarang.
 * Mendukung angka dalam huruf (lima, dua puluh) dan kata bilangan bahasa Jawa dan Minang yang umum.
 */

const UNITS: Record<string, number> = {
  nol: 0, satu: 1, siji: 1, dua: 2, duo: 2, loro: 2, tiga: 3, tigo: 3, telu: 3, empat: 4, ampek: 4, papat: 4,
  lima: 5, limo: 5, enam: 6, anam: 6, enem: 6, tujuh: 7, tujuah: 7, pitu: 7, delapan: 8, salapan: 8, wolu: 8,
  sembilan: 9, sambilan: 9, sanga: 9, sepuluh: 10, sapuluah: 10, sebelas: 11, seratus: 100
};

/** Mengubah bilangan dalam huruf menjadi angka: "lima macam" -> "5 macam", "dua puluh lima" -> "25". */
export function normalizeNumbers(text: string): string {
  const toks = text.match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*|\s+|[^\s]/gu) || [];
  const isWord = (t: string) => /^[\p{L}]/u.test(t);
  const out: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i];
    const lw = w.toLowerCase();
    const prevWord = (() => { for (let j = out.length - 1; j >= 0; j--) if (out[j].trim()) return out[j].toLowerCase(); return ''; })();
    if (isWord(w) && lw in UNITS && !(lw === 'satu' && prevWord === 'salah')) {
      let n = UNITS[lw];
      let j = i;
      const peek = (k: number) => { let m = k + 1; while (toks[m] && !toks[m].trim()) m++; return m; };
      let nx = peek(j);
      const nxw = (toks[nx] || '').toLowerCase();
      if (n >= 1 && n <= 9 && nxw === 'puluh') {
        n *= 10; j = nx; nx = peek(j);
        const u = (toks[nx] || '').toLowerCase();
        if (u in UNITS && UNITS[u] >= 1 && UNITS[u] <= 9) { n += UNITS[u]; j = nx; }
      } else if (n >= 1 && n <= 9 && nxw === 'belas') { n = 10 + n; j = nx; }
      out.push(String(n));
      i = j;
    } else out.push(w);
  }
  return out.join('');
}

const SPLIT = /[.;,!?\n]+|\b(?:tapi|tetapi|namun|padahal|sedangkan|sementara|lalu|kemudian|tp)\b/i;
export const clausesOf = (text: string): string[] => text.split(SPLIT).map(c => c.trim()).filter(Boolean);

/** Klausa yang berisi angka dari TAGIHAN atau KLAIM (bukan pengalaman peserta). */
const ABOUT_CLAIM = /\b(klaim|klaimnya|tagih|tagihan|ditagih|ditagihkan|tertulis|tercatat|tercantum|menulis|dituliskan|kuitansi|kwitansi)\b/i;

const RECEIVE = /\b(?:dapat|dapet|dikasih|dikasi|kasih|kasi|ngasih|diberi|diberikan|memberi|beri|berikan|dikei|kei|diserahkan|serahkan|terima|diterima|menerima|trima|tarimo|ambil|diambil|dibawa pulang|bawa pulang)\b(?!\s+(?:resep|surat|rujukan|tagihan))/gi;
const COMPLETE = /\b(lengkap|sesuai|semua|semuanya|seluruh|seluruhnya|utuh|keduanya|ketiganya|\d-duanya|\d-tiganya)\b/i;
const NEGATED_COMPLETE = /\b(tidak|belum|kurang|ga|gak|nggak|enggak|bukan)\s+(?:\w+\s+)?(lengkap|sesuai|semua|utuh)/i;

export interface MedicineFacts { received: number | null; complete: boolean }

/** Jumlah obat yang DITERIMA peserta, bila disebut. Tidak ada tebakan. */
export function extractMedicine(story: string): MedicineFacts {
  const clauses = clausesOf(normalizeNumbers(story)).filter(c => !ABOUT_CLAIM.test(c) || RECEIVE.test(c));
  RECEIVE.lastIndex = 0;
  let received: number | null = null;
  for (const c of clauses) {
    RECEIVE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RECEIVE.exec(c))) {
      const after = c.slice(m.index + m[0].length, m.index + m[0].length + 40);
      const n = /(\d+)/.exec(after);
      if (n) { received = parseInt(n[1], 10); break; }
    }
    if (received !== null) break;
  }
  const whole = normalizeNumbers(story);
  const complete = COMPLETE.test(whole) && !NEGATED_COMPLETE.test(whole);
  if (received === null && complete) {
    // "lima macam semuanya saya terima lengkap": angka sebelum kata kerja terima
    RECEIVE.lastIndex = 0;
    const c = clausesOf(whole).find(x => { RECEIVE.lastIndex = 0; return RECEIVE.test(x); });
    const n = c ? /(\d+)/.exec(c) : null;
    if (n) received = parseInt(n[1], 10);
  }
  return { received, complete };
}

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', "jum'at", 'sabtu', 'minggu'];
const dayIndex = (d: string) => { const i = DAYS.indexOf(d.toLowerCase()); return i === 5 ? 4 : i > 5 ? i - 1 : i; };

/** Lama rawat yang disebut peserta (hari). null bila tidak disebut. */
export function extractStayDays(story: string): number | null {
  const norm = normalizeNumbers(story);
  const own = clausesOf(norm).filter(c => !ABOUT_CLAIM.test(c));
  const joined = own.join(' , ');
  let m = /(\d+)\s*hari(?!\s*(?:senin|selasa|rabu|kamis|jumat|sabtu|minggu|ini|itu|kemudian|lalu))/i.exec(joined);
  if (m) return parseInt(m[1], 10);
  m = /tanggal\s+(\d{1,2})\b.{0,40}?(?:pulang|keluar)\b.{0,15}?tanggal\s+(\d{1,2})\b/i.exec(joined);
  if (m && +m[2] > +m[1]) return +m[2] - +m[1];
  if (/\b(?:masuk|datang)\b.{0,40}\b(?:siang|sore|malam)\b.{0,30}\b(?:sudah\s+)?pulang\b|hari itu juga|sehari saja|cuma sehari|hanya sehari/i.test(joined)) return 1;
  const w = new RegExp(`\\b(?:masuk|datang|igd)\\b.{0,25}?\\b(${DAYS.join('|')})\\b.{0,60}?\\b(?:pulang|keluar)\\b.{0,25}?\\b(${DAYS.join('|')})\\b`, 'i').exec(joined)
    || new RegExp(`\\b(?:masuk|datang|igd)\\b.{0,25}?\\b(${DAYS.join('|')})\\b.{0,40}?\\b(${DAYS.join('|')})\\b.{0,25}?\\b(?:pulang|keluar)\\b`, 'i').exec(joined);
  if (w) { const d = (dayIndex(w[2]) - dayIndex(w[1]) + 7) % 7; if (d > 0) return d; }
  return null;
}

/** Jumlah kunjungan yang disebut peserta. null bila tidak disebut. */
export function extractVisits(story: string): number | null {
  if (/tidak pernah (?:kontrol|hadir|datang|berobat)/i.test(story)) return 0;
  const own = clausesOf(normalizeNumbers(story)).filter(c => !ABOUT_CLAIM.test(c)).join(' , ');
  const m = /(\d+)\s*(?:kali|x)\b/i.exec(own);
  return m ? parseInt(m[1], 10) : null;
}

/** Interval rawat inap ulang (hari). */
export function extractIntervalDays(story: string): number | null {
  const n = normalizeNumbers(story);
  const m = /(\d+)\s*hari\s*(?:kemudian|setelah|lagi|berselang)/i.exec(n) || /selang\s*(\d+)\s*hari/i.exec(n);
  return m ? parseInt(m[1], 10) : null;
}

/** Nominal uang (rupiah) yang disebut peserta. null bila tidak disebut. */
export function extractMoney(story: string): number | null {
  const n = normalizeNumbers(story);
  const m = /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(ribu|rb|juta|jt|k)?\b/i.exec(n.replace(/\brp\.?\s*/gi, 'Rp '));
  if (!m) return null;
  let v = parseInt(m[1].replace(/[.,]/g, ''), 10);
  const u = (m[2] || '').toLowerCase();
  if (u === 'ribu' || u === 'rb' || u === 'k') v *= 1000; else if (u === 'juta' || u === 'jt') v *= 1_000_000;
  return v >= 1000 ? v : null;
}

export const SEDATED = /\b(bius|dibius|tidak sadar|pingsan|sedasi|anestesi|dalam keadaan tidur)\b/i;
export const DENIES = /(?:\b(?:tidak|ga|gak|nggak|enggak|belum)\s+(?:pernah|ada|dilakukan|dikerjakan|dipasang|dikasih|diberi|dikenai)\b|sama sekali tidak|\b(?:hanya|cuma)\s+(?:diperiksa|ditensi|ditanya)\b|disangkal|tidak mengalami)/i;

/** Kata dalam cerita awam yang menandakan tindakan memang dialami, menurut jenis tindakan pada klaim. */
const AFFIRM: [RegExp, RegExp][] = [
  [/nebulizer|fisioterapi/i, /\buap\b|diuap|hirup|inhalasi|nebulizer|pijat|terapis|fisioterapi|latihan napas/i],
  [/debridement|dressing|luka/i, /bersih|cuci|perban|jahit/i],
  [/ekg|elektrokardiogram/i, /kabel|tempel|rekam|ekg/i],
  [/rontgen|thorax/i, /sinar|disinar|rontgen|foto dada|foto/i],
  [/kanula|infus|intravena/i, /infus|jarum/i],
  [/usg|ultrasonografi/i, /usg|gel|scanner|layar/i]
];
export const affirmsProcedure = (story: string, procedureName: string): boolean =>
  AFFIRM.some(([p, s]) => p.test(procedureName) && s.test(story));
