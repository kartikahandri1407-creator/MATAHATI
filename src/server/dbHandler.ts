/**
 * MATA HATI - Handler database (SATU sumber logika untuk AI Studio/Express dan Vercel).
 *
 * Penyimpanan: Supabase (Postgres) lewat REST, memakai SATU tabel `mh_records`
 * (collection, id, data jsonb). Kunci rahasia hanya dibaca di server dan tidak pernah dikirim ke browser.
 * Bila Supabase belum diatur, endpoint menjawab configured:false dan aplikasi memakai penyimpanan browser.
 */

export interface DbRequest {
  method: string;
  query: Record<string, any>;
  body: any;
  clientId: string;
}
export interface DbResponse {
  status: number;
  json: any;
}

export const COLLECTIONS = ['facilities', 'claims', 'cases', 'meta'] as const;
const ID_PATTERN = /^[A-Za-z0-9._:-]{1,80}$/;
export const DB_LIMITS = { itemBytes: 100_000, itemsPerRequest: 200, writesPerMinute: 120 };
const TABLE = 'mh_records';

// ---- batas tulis sederhana (best-effort) ----
const writes = new Map<string, number[]>();
function writeLimited(clientId: string, count: number, now = Date.now()): boolean {
  const recent = (writes.get(clientId) || []).filter(t => now - t < 60_000);
  for (let i = 0; i < count; i++) recent.push(now);
  writes.set(clientId, recent);
  if (writes.size > 5000) writes.clear();
  return recent.length > DB_LIMITS.writesPerMinute;
}

interface Backend {
  provider: 'firebase' | 'supabase';
  list(c: string): Promise<{ id: string; data: any }[]>;
  put(c: string, rows: { id: string; data: any }[]): Promise<void>;
  del(c: string, id?: string): Promise<void>;
}

// ---- Firebase (Firestore) lewat firebase-admin; kredensial hanya di server ----
let fsPromise: Promise<any> | null = null;
function firebaseCreds(): any | null {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) return null;
  try {
    const j = JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
    if (j.private_key) j.private_key = String(j.private_key).replace(/\\n/g, '\n');
    return j.project_id && j.client_email && j.private_key ? j : null;
  } catch { return null; }
}
async function firestore() {
  if (!fsPromise) {
    fsPromise = (async () => {
      const app = await import('firebase-admin/app');
      const fs = await import('firebase-admin/firestore');
      const creds = firebaseCreds()!;
      const inst = app.getApps().length ? app.getApps()[0] : app.initializeApp({ credential: app.cert(creds) });
      return fs.getFirestore(inst);
    })();
  }
  return fsPromise;
}
const firebaseBackend: Backend = {
  provider: 'firebase',
  async list(c) {
    const db = await firestore();
    const snap = await db.collection(`mh_${c}`).limit(1000).get();
    return snap.docs.map((d: any) => ({ id: d.id, data: JSON.parse(d.data().json), t: d.data().updated_at || '' }))
      .sort((a: any, b: any) => String(b.t).localeCompare(String(a.t))).map(({ id, data }: any) => ({ id, data }));
  },
  async put(c, rows) {
    const db = await firestore();
    const batch = db.batch();
    for (const r of rows) batch.set(db.collection(`mh_${c}`).doc(r.id), { json: JSON.stringify(r.data), updated_at: new Date().toISOString() });
    await batch.commit();
  },
  async del(c, id) {
    const db = await firestore();
    if (id) { await db.collection(`mh_${c}`).doc(id).delete(); return; }
    const snap = await db.collection(`mh_${c}`).limit(500).get();
    const batch = db.batch();
    snap.docs.forEach((d: any) => batch.delete(d.ref));
    await batch.commit();
  }
};

function supabaseBackend(cfg: { url: string; key: string }): Backend {
  return {
    provider: 'supabase',
    async list(c) {
      const r = await rest(cfg, `${TABLE}?collection=eq.${c}&select=id,data,updated_at&order=updated_at.desc&limit=1000`);
      if (!r.ok) throw new Error('read');
      return (r.json || []).map((row: any) => ({ id: row.id, data: row.data }));
    },
    async put(c, rows) {
      const r = await rest(cfg, `${TABLE}?on_conflict=collection,id`, {
        method: 'POST',
        body: JSON.stringify(rows.map(x => ({ collection: c, id: x.id, data: x.data, updated_at: new Date().toISOString() }))),
        prefer: 'resolution=merge-duplicates,return=minimal'
      });
      if (!r.ok) throw new Error('write');
    },
    async del(c, id) {
      const q = id ? `${TABLE}?collection=eq.${c}&id=eq.${encodeURIComponent(id)}` : `${TABLE}?collection=eq.${c}`;
      const r = await rest(cfg, q, { method: 'DELETE', prefer: 'return=minimal' });
      if (!r.ok) throw new Error('delete');
    }
  };
}

function backend(): Backend | null {
  if (firebaseCreds()) return firebaseBackend;
  const c = config();
  return c ? supabaseBackend(c) : null;
}

function config(): { url: string; key: string } | null {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim();
  return url && key ? { url, key } : null;
}

async function rest(cfg: { url: string; key: string }, path: string, init: RequestInit & { prefer?: string } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
        ...(init.prefer ? { Prefer: init.prefer } : {})
      },
      signal: controller.signal
    });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* abaikan */ }
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

export async function handleDb(req: DbRequest): Promise<DbResponse> {
  const be = backend();
  const q = req.query || {};

  if (req.method === 'GET' && (q.status === '1' || q.status === 'true')) {
    return { status: 200, json: { configured: !!be, provider: be ? be.provider : null } };
  }
  if (!be) return { status: 503, json: { configured: false, error: 'Database belum dikonfigurasi di server.' } };

  const collection = typeof q.c === 'string' ? q.c : '';
  if (!(COLLECTIONS as readonly string[]).includes(collection)) {
    return { status: 400, json: { error: 'Koleksi tidak dikenal.' } };
  }

  try {
    if (req.method === 'GET') {
      return { status: 200, json: { items: await be.list(collection) } };
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const list: any[] = Array.isArray(req.body?.items) ? req.body.items : req.body?.id ? [req.body] : [];
      if (list.length === 0) return { status: 400, json: { error: 'Tidak ada data untuk disimpan.' } };
      if (list.length > DB_LIMITS.itemsPerRequest) return { status: 400, json: { error: 'Terlalu banyak item dalam satu permintaan.' } };
      const rows: { id: string; data: any }[] = [];
      for (const it of list) {
        if (!it || typeof it.id !== 'string' || !ID_PATTERN.test(it.id)) return { status: 400, json: { error: 'ID tidak valid.' } };
        if (!it.data || typeof it.data !== 'object' || Array.isArray(it.data)) return { status: 400, json: { error: 'Data harus berupa objek.' } };
        if (JSON.stringify(it.data).length > DB_LIMITS.itemBytes) return { status: 413, json: { error: 'Data terlalu besar.' } };
        rows.push({ id: it.id, data: it.data });
      }
      if (writeLimited(req.clientId, rows.length)) return { status: 429, json: { error: 'Terlalu banyak penulisan. Coba lagi sebentar.' } };
      await be.put(collection, rows);
      return { status: 200, json: { ok: true, count: rows.length } };
    }

    if (req.method === 'DELETE') {
      if (writeLimited(req.clientId, 1)) return { status: 429, json: { error: 'Terlalu banyak penulisan. Coba lagi sebentar.' } };
      if (q.all === '1' || q.all === 'true') { await be.del(collection); return { status: 200, json: { ok: true } }; }
      const id = typeof q.id === 'string' ? q.id : '';
      if (!ID_PATTERN.test(id)) return { status: 400, json: { error: 'ID tidak valid.' } };
      await be.del(collection, id);
      return { status: 200, json: { ok: true } };
    }

    return { status: 405, json: { error: 'Metode tidak didukung.' } };
  } catch (err: any) {
    console.error('DB error:', err?.message || err);
    return { status: 502, json: { error: 'Database tidak dapat dihubungi.' } };
  }
}
