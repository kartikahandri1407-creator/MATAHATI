/**
 * MATA HATI - Ringkasan hasil pemeriksaan untuk petugas dan ringkasan antrean untuk faskes.
 * Fungsi murni (tanpa tampilan) agar mudah diuji.
 */
import { CaseRecord } from '../types/matahati';
import { Stage, countByStage } from './stage';

export interface Outcomes {
  total: number;
  /** Jumlah kasus per tahap; semuanya bersama-sama sama dengan total. */
  stages: Record<Stage, number>;
  closed: number;            // ditutup petugas
  escalated: number;         // diteruskan ke verifikasi lapangan
  waitingFaskes: number;     // menunggu jawaban faskes
  faskesAnswered: number;    // faskes sudah menjawab
  reasons: { reason: string; count: number }[];
  /** Jawaban faskes yang menunjukkan penjelasan wajar (bukan indikasi masalah). */
  benignAnswers: number;
}

const BENIGN = ['Sesuai catatan', 'Stok kosong', 'Diberikan di layanan lain'];
const isBenign = (r: string) => BENIGN.some(b => r.startsWith(b));

export function summarizeOutcomes(cases: CaseRecord[]): Outcomes {
  const answered = cases.filter(c => c.facility_response);
  const tally = new Map<string, number>();
  for (const c of answered) { const r = c.facility_response!.reason; tally.set(r, (tally.get(r) || 0) + 1); }
  return {
    total: cases.length,
    stages: countByStage(cases),
    closed: cases.filter(c => c.verification_status === 'CLOSED_NO_ACTION').length,
    escalated: cases.filter(c => c.verification_status === 'ESCALATED_FOR_OFFICIAL_PROCESS').length,
    waitingFaskes: cases.filter(c => c.verification_status === 'CLARIFICATION_DRAFTED').length,
    faskesAnswered: answered.length,
    reasons: [...tally.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
    benignAnswers: answered.filter(c => isBenign(c.facility_response!.reason)).length
  };
}

/** Berapa hari sebuah permintaan konfirmasi menunggu (dari catatan audit pembuatan draf). */
export function waitingDays(c: CaseRecord, now = Date.now()): number | null {
  const e = [...(c.audit_log || [])].reverse().find(a => a.action === 'DRAFT_CLARIFICATION_CREATED' || a.action === 'STATUS_CLARIFICATION_DRAFTED');
  const t = e ? Date.parse(e.timestamp) : NaN;
  return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / 86_400_000)) : null;
}

/**
 * "Jam demo": data contoh bertanggal September, sedangkan peragaan bisa dilakukan berminggu-minggu kemudian.
 * Agar "menunggu N hari" tidak terbaca janggal, waktu acuan dibatasi satu hari setelah kejadian terbaru di antrean.
 * Begitu ada laporan yang dibuat sungguhan hari ini, kejadian terbaru adalah hari ini dan jam demo sama dengan jam nyata.
 */
export function demoNow(cases: CaseRecord[], real = Date.now()): number {
  let latest = 0;
  for (const c of cases) {
    const t0 = Date.parse(c.created_at); if (t0 > latest) latest = t0;
    for (const l of c.audit_log || []) { const t = Date.parse(l.timestamp); if (t > latest) latest = t; }
  }
  return latest ? Math.min(real, latest + 86_400_000) : real;
}
