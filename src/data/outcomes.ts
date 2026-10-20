/**
 * MATA HATI - Ringkasan hasil pemeriksaan untuk petugas dan ringkasan antrean untuk faskes.
 * Fungsi murni (tanpa tampilan) agar mudah diuji.
 */
import { CaseRecord } from '../types/matahati';

export interface Outcomes {
  total: number;
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
  const e = [...(c.audit_log || [])].reverse().find(a => a.action === 'DRAFT_CLARIFICATION_CREATED');
  const t = e ? Date.parse(e.timestamp) : NaN;
  return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / 86_400_000)) : null;
}
