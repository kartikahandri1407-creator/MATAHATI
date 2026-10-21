/**
 * MATA HATI - Kutipan bukti pada cerita peserta.
 * Model diminta menunjuk kalimat di cerita yang menjadi dasar penilaiannya. KODE memeriksa bahwa
 * kutipan itu benar-benar ada di cerita (kutipan karangan dibuang), lalu antarmuka menyorotnya.
 */
export interface EvidenceQuote { quote: string; supports: string }
export interface StorySegment { text: string; supports?: string }

const MAX_QUOTES = 5;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const finder = (quote: string) => new RegExp(esc(quote.trim()).replace(/\s+/g, '\\s+'), 'i');

/** Hanya kutipan yang benar-benar ada di cerita (tanpa membedakan huruf besar/kecil atau spasi). */
export function verifyQuotes(story: string, quotes: unknown): { kept: EvidenceQuote[]; rejected: number } {
  const kept: EvidenceQuote[] = [];
  let rejected = 0;
  if (!Array.isArray(quotes)) return { kept, rejected };
  for (const q of quotes) {
    const quote = typeof q?.quote === 'string' ? q.quote.trim() : '';
    if (quote.length < 3 || quote.length > 160) { rejected++; continue; }
    const m = finder(quote).exec(story);
    if (!m) { rejected++; continue; }
    if (kept.some(k => k.quote === m[0])) continue;
    kept.push({ quote: m[0], supports: (typeof q.supports === 'string' ? q.supports : '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 120) });
    if (kept.length >= MAX_QUOTES) break;
  }
  return { kept, rejected };
}

/** Memecah cerita menjadi potongan; potongan yang disorot membawa keterangan dasar penilaiannya. */
export function segmentStory(story: string, quotes: EvidenceQuote[]): StorySegment[] {
  const ranges: { s: number; e: number; supports: string }[] = [];
  for (const q of quotes) {
    const m = finder(q.quote).exec(story);
    if (m) ranges.push({ s: m.index, e: m.index + m[0].length, supports: q.supports });
  }
  ranges.sort((a, b) => a.s - b.s);
  const merged: typeof ranges = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.s < last.e) { last.e = Math.max(last.e, r.e); if (r.supports && !last.supports.includes(r.supports)) last.supports = [last.supports, r.supports].filter(Boolean).join('; '); }
    else merged.push({ ...r });
  }
  const out: StorySegment[] = [];
  let at = 0;
  for (const r of merged) {
    if (r.s > at) out.push({ text: story.slice(at, r.s) });
    out.push({ text: story.slice(r.s, r.e), supports: r.supports || 'dasar penilaian' });
    at = r.e;
  }
  if (at < story.length) out.push({ text: story.slice(at) });
  return out.length ? out : [{ text: story }];
}

/** Cadangan tanpa AI: kalimat yang memuat angka atau istilah yang dipakai dalam penilaian. */
export function deriveQuotes(story: string, ev: { received_quantity?: number | null; length_of_stay_days?: number | null; actual_visits_count?: number | null; medication?: string | null; procedure?: string | null }): EvidenceQuote[] {
  const clauses = story.split(/(?<=[.;!?])\s+|,\s+|\n+/).map(c => c.trim()).filter(c => c.length >= 4);
  const out: EvidenceQuote[] = [];
  const tryNum = (n: number | null | undefined, label: string) => {
    if (n === null || n === undefined) return;
    const re = new RegExp(`(^|\\D)${n}(\\D|$)`);
    const c = clauses.find(x => re.test(x));
    if (c && !out.some(o => o.quote === c)) out.push({ quote: c, supports: label });
  };
  tryNum(ev.received_quantity, 'jumlah obat yang diterima');
  tryNum(ev.length_of_stay_days, 'lama rawat yang disebut');
  tryNum(ev.actual_visits_count, 'jumlah kunjungan yang disebut');
  for (const [term, label] of [[ev.medication, 'obat yang disebut'], [ev.procedure, 'tindakan yang disebut']] as const) {
    const w = (term || '').split(/\s+/).find(t => t.length >= 4)?.toLowerCase();
    const c = w ? clauses.find(x => x.toLowerCase().includes(w)) : undefined;
    if (c && !out.some(o => o.quote === c)) out.push({ quote: c, supports: label });
  }
  return out.slice(0, 4);
}
