import { CaseRecord, RiskType, TriageStatus, VerificationPriority, VerificationStatus } from '../types/matahati';

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

export type QueueGroup = 'OPEN' | 'PROGRESS' | 'DONE';
export const queueGroup = (s: VerificationStatus): QueueGroup =>
  s === 'NEW' ? 'OPEN' : s === 'CLOSED_NO_ACTION' ? 'DONE' : 'PROGRESS';

const PRIORITY_RANK: Record<VerificationPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const GROUP_RANK: Record<QueueGroup, number> = { OPEN: 0, PROGRESS: 1, DONE: 2 };

/** Urutan antrean: yang belum selesai dulu, lalu prioritas, lalu tanggal terbaru. */
export function sortQueue(cases: CaseRecord[]): CaseRecord[] {
  return [...cases].sort((a, b) =>
    GROUP_RANK[queueGroup(a.verification_status)] - GROUP_RANK[queueGroup(b.verification_status)] ||
    PRIORITY_RANK[a.verification_priority] - PRIORITY_RANK[b.verification_priority] ||
    (b.service_date || '').localeCompare(a.service_date || '')
  );
}

/** Tahapan yang dilihat peserta. Tidak memuat istilah risiko atau prioritas. */
export const PESERTA_STEPS = ['Diterima', 'Diperiksa petugas', 'Faskes dimintai konfirmasi', 'Selesai'] as const;

export function pesertaProgress(c: CaseRecord): { step: number; headline: string; message: string; tone: 'ok' | 'wait' | 'info' } {
  if (c.status === 'CONSISTENT' && c.verification_status === 'NEW') {
    return { step: 3, headline: 'Sesuai catatan', message: 'Jawaban Anda sama dengan catatan layanan. Tidak ada tindak lanjut.', tone: 'ok' };
  }
  switch (c.verification_status) {
    case 'NEW':
      return c.status === 'INSUFFICIENT_EVIDENCE'
        ? { step: 0, headline: 'Diterima, perlu info tambahan', message: 'Terima kasih. Informasinya belum cukup untuk dibandingkan. Anda bisa menambahkan cerita atau foto kapan saja.', tone: 'info' }
        : { step: 0, headline: 'Diterima', message: 'Laporan Anda sudah masuk ke antrean petugas. Anda tidak perlu melakukan apa-apa.', tone: 'wait' };
    case 'UNDER_REVIEW':
      if (c.facility_response) return { step: 1, headline: 'Faskes sudah menjawab', message: 'Faskes sudah memberi penjelasan. Petugas sedang menilainya bersama laporan Anda.', tone: 'wait' };
      return { step: 1, headline: 'Sedang diperiksa petugas', message: 'Petugas sedang membandingkan jawaban Anda dengan catatan klaim.', tone: 'wait' };
    case 'CLARIFICATION_DRAFTED':
      return { step: 2, headline: 'Faskes dimintai konfirmasi', message: 'Petugas meminta penjelasan dari faskes. Ini bukan tuduhan; bisa jadi hanya salah catat atau stok kosong.', tone: 'wait' };
    case 'ESCALATED_FOR_OFFICIAL_PROCESS':
      return { step: 2, headline: 'Diproses sesuai prosedur', message: 'Laporan Anda diteruskan untuk pemeriksaan lanjutan. Identitas Anda tidak dibagikan ke faskes.', tone: 'wait' };
    case 'CLOSED_NO_ACTION':
      return { step: 3, headline: 'Selesai', message: 'Pemeriksaan selesai. Terima kasih sudah membantu menjaga layanan JKN.', tone: 'ok' };
  }
}

export type { RiskType };
