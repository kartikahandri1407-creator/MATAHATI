/**
 * MATA HATI - Tahap kasus (satu sumber kebenaran).
 * Setiap kasus berada di TEPAT SATU tahap. Antrean petugas, Laporan Saya, ruang faskes, panel hasil
 * dan jawaban "Tanya antrean" semuanya membaca dari sini, sehingga angkanya tidak bisa saling bertentangan.
 * Fungsi murni, tanpa tampilan, agar mudah diuji.
 */
import { AuditLogEntry, CaseRecord } from '../types/matahati';

export type Stage = 'SESUAI' | 'BARU' | 'DIPERIKSA' | 'MENUNGGU_FASKES' | 'JAWABAN_DITERIMA' | 'DITERUSKAN' | 'DITUTUP';

/** Urutan tahap sepanjang alur. */
export const STAGES: Stage[] = ['SESUAI', 'BARU', 'DIPERIKSA', 'MENUNGGU_FASKES', 'JAWABAN_DITERIMA', 'DITERUSKAN', 'DITUTUP'];

export const STAGE_LABEL: Record<Stage, string> = {
  SESUAI: 'Sesuai catatan',
  BARU: 'Baru masuk',
  DIPERIKSA: 'Sedang diperiksa',
  MENUNGGU_FASKES: 'Menunggu jawaban faskes',
  JAWABAN_DITERIMA: 'Jawaban faskes diterima',
  DITERUSKAN: 'Diteruskan ke lapangan',
  DITUTUP: 'Ditutup'
};

/** Penjelasan satu kalimat untuk petugas. */
export const STAGE_HINT: Record<Stage, string> = {
  SESUAI: 'Jawaban peserta sama dengan klaim. Tidak perlu tindakan.',
  BARU: 'Belum disentuh petugas.',
  DIPERIKSA: 'Petugas sedang menelaah, belum meminta faskes.',
  MENUNGGU_FASKES: 'Surat konfirmasi sudah dibuat, faskes belum menjawab.',
  JAWABAN_DITERIMA: 'Faskes sudah menjawab, menunggu keputusan petugas.',
  DITERUSKAN: 'Dilanjutkan ke pemeriksaan lapangan resmi.',
  DITUTUP: 'Pemeriksaan selesai tanpa tindak lanjut.'
};

export function caseStage(c: Pick<CaseRecord, 'status' | 'verification_status' | 'facility_response'>): Stage {
  switch (c.verification_status) {
    case 'CLOSED_NO_ACTION': return 'DITUTUP';
    case 'ESCALATED_FOR_OFFICIAL_PROCESS': return 'DITERUSKAN';
    case 'CLARIFICATION_DRAFTED': return 'MENUNGGU_FASKES';
    case 'UNDER_REVIEW': return c.facility_response ? 'JAWABAN_DITERIMA' : 'DIPERIKSA';
    default: return c.status === 'CONSISTENT' ? 'SESUAI' : 'BARU';
  }
}

export type QueueGroup = 'OPEN' | 'PROGRESS' | 'DONE';
export const stageGroup = (s: Stage): QueueGroup =>
  s === 'BARU' ? 'OPEN' : s === 'SESUAI' || s === 'DITUTUP' ? 'DONE' : 'PROGRESS';
export const caseGroup = (c: Parameters<typeof caseStage>[0]): QueueGroup => stageGroup(caseStage(c));

/** Jumlah kasus per tahap. Jumlah semua tahap selalu sama dengan jumlah kasus. */
export function countByStage(cases: Parameters<typeof caseStage>[0][]): Record<Stage, number> {
  const out = Object.fromEntries(STAGES.map(s => [s, 0])) as Record<Stage, number>;
  for (const c of cases) out[caseStage(c)]++;
  return out;
}

// ---------------- Jejak waktu ----------------
export interface TimelineEvent { at: string; actor: string; title: string; detail?: string; tone: 'info' | 'wait' | 'ok' | 'alert'; derived?: boolean }
export type Audience = 'peserta' | 'petugas';

const ACTION_TITLE: Record<string, { peserta?: string; petugas: string; tone: TimelineEvent['tone'] }> = {
  FOLLOW_UP_ANSWERED: { peserta: 'Anda menambah informasi', petugas: 'Pelapor menambah informasi atas pertanyaan lanjutan', tone: 'info' },
  SUBMITTED: { peserta: 'Laporan Anda diterima', petugas: 'Laporan masuk dan dibandingkan dengan klaim', tone: 'info' },
  TRIAGE_COMPLETED: { peserta: 'Laporan Anda diterima', petugas: 'Laporan masuk dan dibandingkan dengan klaim', tone: 'info' },
  STATUS_UPDATED: { petugas: 'Status diperbarui petugas', tone: 'info' },
  STATUS_NEW: { petugas: 'Dikembalikan ke antrean baru', tone: 'info' },
  STATUS_UNDER_REVIEW: { peserta: 'Mulai diperiksa petugas', petugas: 'Mulai diperiksa', tone: 'wait' },
  STATUS_CLARIFICATION_DRAFTED: { peserta: 'Faskes dimintai konfirmasi', petugas: 'Surat konfirmasi disiapkan untuk faskes', tone: 'wait' },
  DRAFT_CLARIFICATION_CREATED: { peserta: 'Faskes dimintai konfirmasi', petugas: 'Surat konfirmasi dibuat dan dikirim ke faskes', tone: 'wait' },
  FACILITY_RESPONDED: { peserta: 'Faskes sudah menjawab', petugas: 'Faskes menjawab', tone: 'info' },
  STATUS_ESCALATED_FOR_OFFICIAL_PROCESS: { peserta: 'Diteruskan untuk pemeriksaan lanjutan', petugas: 'Diteruskan ke verifikasi lapangan', tone: 'alert' },
  STATUS_CLOSED_NO_ACTION: { peserta: 'Pemeriksaan selesai', petugas: 'Kasus ditutup', tone: 'ok' },
  DATA_KASUS_DIUBAH: { petugas: 'Data kasus diperbarui petugas', tone: 'info' }
};

export const actionLabel = (a: string): string => ACTION_TITLE[a]?.petugas || a;

const needsAction = (log: AuditLogEntry[], pred: (a: string) => boolean) => log.some(l => pred(l.action));

export function caseTimeline(c: CaseRecord, audience: Audience): TimelineEvent[] {
  const log = c.audit_log || [];
  const out: TimelineEvent[] = [];
  for (const l of log) {
    const def = ACTION_TITLE[l.action];
    if (audience === 'peserta') {
      if (!def?.peserta) continue; // hanya kejadian yang boleh dilihat peserta
      out.push({ at: l.timestamp, actor: 'MATA HATI', title: def.peserta, tone: def.tone });
    } else {
      const detail = l.action === 'FACILITY_RESPONDED' ? l.note : l.action === 'DATA_KASUS_DIUBAH' || l.action.startsWith('STATUS_') ? l.note : undefined;
      out.push({ at: l.timestamp, actor: l.user_role, title: def?.petugas || l.action, detail, tone: def?.tone || 'info' });
    }
  }
  // Kasus lama bisa tidak punya catatan untuk status sekarang. Tambahkan baris turunan agar jejak tetap jujur dan lengkap.
  const last = log.length ? log[log.length - 1].timestamp : c.created_at;
  const stage = caseStage(c);
  const derive = (title: string, tone: TimelineEvent['tone']) => out.push({ at: last, actor: 'Sistem', title, tone, derived: true });
  const P = audience === 'peserta';
  if (stage === 'DITUTUP' && !needsAction(log, a => a === 'STATUS_CLOSED_NO_ACTION')) derive(P ? 'Pemeriksaan selesai' : 'Pemeriksaan ditutup', 'ok');
  if (stage === 'DITERUSKAN' && !needsAction(log, a => a === 'STATUS_ESCALATED_FOR_OFFICIAL_PROCESS')) derive(P ? 'Diteruskan untuk pemeriksaan lanjutan' : 'Diteruskan ke verifikasi lapangan', 'alert');
  if (stage === 'MENUNGGU_FASKES' && !needsAction(log, a => a === 'DRAFT_CLARIFICATION_CREATED' || a === 'STATUS_CLARIFICATION_DRAFTED')) derive(P ? 'Faskes dimintai konfirmasi' : 'Menunggu jawaban faskes', 'wait');
  if (stage === 'SESUAI' && P) derive('Jawaban sama dengan catatan layanan', 'ok');
  if (c.facility_response && !needsAction(log, a => a === 'FACILITY_RESPONDED')) {
    out.push({ at: c.facility_response.at || last, actor: 'Faskes', title: P ? 'Faskes sudah menjawab' : 'Faskes menjawab', detail: P ? undefined : c.facility_response.reason, tone: 'info', derived: true });
  }
  return out.sort((a, b) => (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0));
}

// ---------------- Tampilan peserta ----------------
export const PESERTA_STEPS = ['Diterima', 'Diperiksa petugas', 'Faskes dimintai konfirmasi', 'Selesai'] as const;

export function pesertaProgress(c: CaseRecord): { step: number; headline: string; message: string; tone: 'ok' | 'wait' | 'info'; done: boolean } {
  switch (caseStage(c)) {
    case 'SESUAI': return { step: 3, done: true, headline: 'Sesuai catatan', message: 'Jawaban Anda sama dengan catatan layanan. Tidak ada tindak lanjut.', tone: 'ok' };
    case 'BARU':
      return c.status === 'INSUFFICIENT_EVIDENCE'
        ? { step: 0, done: false, headline: 'Diterima, perlu info tambahan', message: 'Terima kasih. Informasinya belum cukup untuk dibandingkan. Anda bisa menambahkan cerita atau foto kapan saja.', tone: 'info' }
        : { step: 0, done: false, headline: 'Diterima', message: 'Laporan Anda sudah masuk ke antrean petugas. Anda tidak perlu melakukan apa-apa.', tone: 'wait' };
    case 'DIPERIKSA': return { step: 1, done: false, headline: 'Sedang diperiksa petugas', message: 'Petugas sedang membandingkan jawaban Anda dengan catatan klaim.', tone: 'wait' };
    case 'JAWABAN_DITERIMA': return { step: 2, done: false, headline: 'Faskes sudah menjawab', message: 'Faskes sudah memberi penjelasan. Petugas sedang menilainya bersama laporan Anda.', tone: 'wait' };
    case 'MENUNGGU_FASKES': return { step: 2, done: false, headline: 'Faskes dimintai konfirmasi', message: 'Petugas meminta penjelasan dari faskes. Ini bukan tuduhan; bisa jadi hanya salah catat atau stok kosong.', tone: 'wait' };
    case 'DITERUSKAN': return { step: 2, done: false, headline: 'Diproses sesuai prosedur', message: 'Laporan Anda diteruskan untuk pemeriksaan lanjutan. Identitas Anda tidak dibagikan ke faskes.', tone: 'wait' };
    case 'DITUTUP': return { step: 3, done: true, headline: 'Selesai', message: 'Pemeriksaan selesai. Terima kasih sudah membantu menjaga layanan JKN.', tone: 'ok' };
  }
}

/**
 * Rincian perbandingan (catatan klaim vs jawaban) baru boleh dilihat peserta setelah petugas menyentuh kasusnya.
 * Sebelum itu hasilnya hanya perkiraan otomatis dan belum diperiksa manusia.
 */
export const pesertaMaySeeComparison = (c: Parameters<typeof caseStage>[0]): boolean => caseStage(c) !== 'BARU';
