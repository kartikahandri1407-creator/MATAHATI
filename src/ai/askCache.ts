/**
 * MATA HATI - Ingatan rencana pertanyaan.
 * Hanya dipakai bila Gemini gagal: pertanyaan yang sama persis (huruf kecil, spasi dirapikan) yang
 * sebelumnya sudah dipahami AI memakai ulang rencananya. Yang disimpan hanya rencana terstruktur
 * (intent, jumlah, jenis), bukan data kasus. Selalu diberi label jujur di layar.
 */
import { AskPlan, sanitizePlan } from '../services/askPlanCore';

export const ASK_CACHE_KEY = 'mh_ask_plans_v1';
const MAX_ENTRIES = 40;

export interface StoreLike { getItem(k: string): string | null; setItem(k: string, v: string): void }

export const normalizeQuestion = (q: string) => q.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

function read(store: StoreLike): Record<string, AskPlan> {
  try { const o = JSON.parse(store.getItem(ASK_CACHE_KEY) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch { return {}; }
}

export function cacheGet(store: StoreLike | null, question: string): AskPlan | null {
  if (!store) return null;
  const hit = read(store)[normalizeQuestion(question)];
  return hit ? sanitizePlan(hit) : null;
}

export function cachePut(store: StoreLike | null, question: string, plan: AskPlan) {
  if (!store) return;
  try {
    const all = read(store);
    const key = normalizeQuestion(question);
    delete all[key];
    all[key] = plan;                                   // yang terbaru di ujung
    const keys = Object.keys(all);
    for (const k of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) delete all[k];
    store.setItem(ASK_CACHE_KEY, JSON.stringify(all));
  } catch { /* penyimpanan penuh atau diblok: abaikan */ }
}

export function browserStore(): StoreLike | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}
