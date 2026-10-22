import { CaseRecord, RiskType, TriageStatus, VerificationPriority, VerificationStatus } from '../types/matahati';
import { QueueGroup, caseGroup } from './stage';

export { PESERTA_STEPS, pesertaProgress } from './stage';
export type { QueueGroup } from './stage';

/** Istilah untuk petugas. */
export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  NEW: 'Baru',
  UNDER_REVIEW: 'Sedang diperiksa',
  CLARIFICATION_DRAFTED: 'Menunggu konfirmasi faskes',
  CLOSED_NO_ACTION: 'Selesai',
  ESCALATED_FOR_OFFICIAL_PROCESS: 'Diteruskan ke verifikasi lapangan'
};

export const TRIAGE_LABEL: Record<TriageStatus, string> = {
  RISK_SIGNAL: 'Perlu diverifikasi',
  POTENTIAL_DISCREPANCY: 'Mungkin berbeda',
  CONSISTENT: 'Sesuai catatan',
  INSUFFICIENT_EVIDENCE: 'Info belum cukup'
};

export const PRIORITY_LABEL: Record<VerificationPriority, string> = { HIGH: 'Tinggi', MEDIUM: 'Sedang', LOW: 'Rendah' };

const PRIORITY_RANK: Record<VerificationPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const GROUP_RANK: Record<QueueGroup, number> = { OPEN: 0, PROGRESS: 1, DONE: 2 };

/** Urutan antrean: yang belum selesai dulu, lalu prioritas (indeks bila ada), lalu tanggal terbaru. */
export function sortQueue(cases: CaseRecord[], scoreOf?: (c: CaseRecord) => number): CaseRecord[] {
  return [...cases].sort((a, b) =>
    GROUP_RANK[caseGroup(a)] - GROUP_RANK[caseGroup(b)] ||
    (scoreOf ? scoreOf(b) - scoreOf(a) : PRIORITY_RANK[a.verification_priority] - PRIORITY_RANK[b.verification_priority]) ||
    (b.service_date || '').localeCompare(a.service_date || '')
  );
}

export type { RiskType };
