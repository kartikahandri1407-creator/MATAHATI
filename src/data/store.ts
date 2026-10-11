/**
 * MATA HATI - Penyimpanan data dinamis (tambah / ubah / hapus).
 * - Bila server punya Supabase (/api/db): data disimpan di database.
 * - Bila tidak: data disimpan di browser (localStorage). Aplikasi tetap penuh berfungsi.
 * Data contoh dimasukkan sekali saat pertama dibuka (bisa dihapus / dikembalikan).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CaseRecord, DummyClaim, Facility } from '../types/matahati';
import demoCases from './demoCases.json';
import facilitiesSeed from './facilities.json';
import claimsSeed from './dummyClaims.json';

export type CollectionName = 'facilities' | 'claims' | 'cases';
export type BackendMode = 'checking' | 'database' | 'browser';

type Item = Record<string, any>;
const ID_FIELD: Record<CollectionName, string> = { facilities: 'facility_id', claims: 'claim_key', cases: 'case_id' };
const LOCAL_PREFIX = 'matahati_v7_';

export const SEEDS: Record<CollectionName, Item[]> = {
  facilities: facilitiesSeed as Item[],
  claims: claimsSeed as Item[],
  cases: demoCases as Item[]
};

// ---------- backend detection (sekali) ----------
let modePromise: Promise<BackendMode> | null = null;
export function detectBackend(): Promise<BackendMode> {
  if (!modePromise) {
    modePromise = (async () => {
      try {
        const r = await fetch('/api/db?status=1');
        if (!r.ok) return 'browser';
        const j = await r.json();
        return j?.configured ? 'database' : 'browser';
      } catch { return 'browser'; }
    })();
  }
  return modePromise;
}

// ---------- adapter ----------
async function dbList(c: CollectionName): Promise<Item[] | null> {
  try {
    const r = await fetch(`/api/db?c=${c}`);
    if (!r.ok) return null;
    return ((await r.json()).items || []).map((x: any) => x.data);
  } catch { return null; }
}
async function dbPut(c: CollectionName, items: Item[]) {
  const idf = ID_FIELD[c];
  for (let i = 0; i < items.length; i += 100) {
    const r = await fetch(`/api/db?c=${c}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.slice(i, i + 100).map(d => ({ id: String(d[idf]), data: d })) })
    });
    if (!r.ok) throw new Error('Gagal menyimpan ke database');
  }
}
async function dbDelete(c: CollectionName, id?: string) {
  const r = await fetch(`/api/db?c=${c}&${id ? `id=${encodeURIComponent(id)}` : 'all=1'}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Gagal menghapus dari database');
}
function localRead(c: CollectionName): Item[] | null {
  try { const s = localStorage.getItem(LOCAL_PREFIX + c); const p = s ? JSON.parse(s) : null; return Array.isArray(p) ? p : null; } catch { return null; }
}
function localWrite(c: CollectionName, items: Item[]) {
  try { localStorage.setItem(LOCAL_PREFIX + c, JSON.stringify(items)); } catch { /* penuh/diblok */ }
}

// ---------- hook ----------
export interface Collection<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  mode: BackendMode;
  add: (item: T) => Promise<void>;
  update: (item: T) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => Promise<void>;   // kembalikan ke data contoh
  clear: () => Promise<void>;   // kosongkan
}

export function useCollection<T extends Item>(name: CollectionName): Collection<T> {
  const idf = ID_FIELD[name];
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<BackendMode>('checking');
  const modeRef = useRef<BackendMode>('checking');
  const itemsRef = useRef<T[]>([]);
  const commit = (next: T[]) => { itemsRef.current = next; setItems(next); };

  useEffect(() => {
    let alive = true;
    (async () => {
      const m = await detectBackend();
      modeRef.current = m;
      let list: Item[] | null = null;
      if (m === 'database') {
        list = await dbList(name);
        if (list && list.length === 0) {
          // Isi data contoh hanya sekali (penanda disimpan di database).
          const flag = `seeded_${name}`;
          let seeded = false;
          try {
            const r = await fetch('/api/db?c=meta');
            seeded = ((await r.json()).items || []).some((x: any) => x.id === flag);
          } catch { /* anggap belum */ }
          if (!seeded) {
            list = SEEDS[name];
            try {
              await dbPut(name, list);
              await fetch('/api/db?c=meta', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: flag, data: { at: new Date().toISOString() } }) });
            } catch { /* tampil saja */ }
          }
        }
        if (list === null) { modeRef.current = 'browser'; }
      }
      if (modeRef.current === 'browser') {
        list = localRead(name);
        if (list === null) { list = SEEDS[name]; localWrite(name, list); }
      }
      if (!alive) return;
      setMode(modeRef.current);
      commit((list || []) as T[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [name]);

  const persist = useCallback(async (next: T[], op: () => Promise<void>) => {
    const prev = itemsRef.current;
    commit(next);
    setError(null);
    try {
      if (modeRef.current === 'database') await op();
      else localWrite(name, next);
    } catch (e: any) {
      commit(prev);
      setError(e?.message || 'Perubahan tidak tersimpan');
    }
  }, [name]);

  const upsert = (item: T) => persist(
    itemsRef.current.some(x => x[idf] === item[idf]) ? itemsRef.current.map(x => (x[idf] === item[idf] ? item : x)) : [item, ...itemsRef.current],
    () => dbPut(name, [item])
  );

  return {
    items, loading, error, mode,
    add: upsert,
    update: upsert,
    remove: (id) => persist(itemsRef.current.filter(x => x[idf] !== id), () => dbDelete(name, id)),
    clear: () => persist([], () => dbDelete(name)),
    reset: () => persist(SEEDS[name] as T[], async () => { await dbDelete(name); await dbPut(name, SEEDS[name]); })
  };
}

// ---------- ID kasus berurutan ----------
export function nextCaseId(existing: { case_id: string }[], year = new Date().getFullYear()): string {
  const re = /^MH-(\d{4})-(\d{4})$/;
  const max = existing.reduce((m, c) => { const x = re.exec(c.case_id); return x ? Math.max(m, parseInt(x[2], 10)) : m; }, 0);
  return `MH-${year}-${String(max + 1).padStart(4, '0')}`;
}

export type { CaseRecord, DummyClaim, Facility };
