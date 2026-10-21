/** MATA HATI - klien tanya-jawab petugas. Bila server AI tidak tersedia, memakai pencocokan kata kunci lokal. */
import { AskPlan, parsePlanLocal, sanitizePlan } from '../services/askPlanCore';
import { browserStore, cacheGet, cachePut } from './askCache';

export interface AskResult { plan: AskPlan; source: 'AI' | 'LOKAL'; reason?: string; cached?: boolean }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Satu percobaan ke server AI. Mengembalikan rencana, atau alasan singkat bila gagal. */
async function tryOnce(question: string): Promise<{ plan?: AskPlan; reason?: string; retry: boolean }> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 14000);
    const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }), signal: ctl.signal });
    clearTimeout(t);
    if (res.ok) {
      const j = await res.json();
      if (j?.plan) return { plan: sanitizePlan(j.plan), retry: false };
      return { reason: 'jawaban kosong', retry: true };
    }
    let serverReason = '';
    try { const j = await res.clone().json(); if (typeof j?.reason === 'string') serverReason = j.reason.slice(0, 80); } catch { /* abaikan */ }
    const reason = serverReason || (res.status === 429 ? 'batas permintaan tercapai' : res.status === 503 ? 'kunci AI belum diatur di server' : res.status === 404 ? 'layanan AI belum terpasang' : `server AI menjawab kode ${res.status}`);
    return { reason, retry: res.status === 502 || res.status === 504 };   // 429/503/404 tidak diulang
  } catch (e: any) {
    return { reason: e?.name === 'AbortError' ? 'AI terlalu lama menjawab' : 'tidak dapat menghubungi server', retry: true };
  }
}

export async function planQuestion(question: string): Promise<AskResult> {
  let last = await tryOnce(question);
  if (!last.plan && last.retry) { await sleep(700); last = await tryOnce(question); }   // gangguan sesaat: coba sekali lagi
  const store = browserStore();
  if (last.plan) { cachePut(store, question, last.plan); return { plan: last.plan, source: 'AI' }; }
  const remembered = cacheGet(store, question);          // Gemini gagal, tetapi pertanyaan ini pernah dipahami AI
  if (remembered) return { plan: remembered, source: 'AI', cached: true, reason: last.reason };
  return { plan: parsePlanLocal(question), source: 'LOKAL', reason: last.reason };
}
