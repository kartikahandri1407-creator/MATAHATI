/**
 * MATA HATI - Indeks prioritas pemeriksaan yang dapat dijelaskan.
 * Dihitung oleh kode (bukan AI) dari tiga sinyal, lalu dikali dua pengali keandalan.
 *   sinyal : selisih (maks 40) + pola pelapor per faskes (maks 35) + konteks klaim (maks 25)
 *   pengali: keandalan laporan, kecukupan informasi
 * Indeks hanya mengurutkan pemeriksaan. Tidak menyatakan kecurangan; petugas yang memutuskan.
 */
import { CaseRecord, DummyClaim, FacilityPattern, VerificationPriority } from '../types/matahati';
import { REF_NOTE, lookupLosRef, lookupReadmitRef } from '../data/refStats';

export interface ScoreFactor { id: 'selisih' | 'pola' | 'konteks'; label: string; points: number; max: number; detail: string }
export interface ScoreModifier { id: 'keandalan' | 'informasi'; label: string; multiplier: number; detail: string }
export interface PriorityScore { total: number; base: number; level: VerificationPriority; factors: ScoreFactor[]; modifiers: ScoreModifier[] }

export const LEVEL_CUTOFF = { HIGH: 65, MEDIUM: 35 } as const;
export const levelOf = (n: number): VerificationPriority => (n >= LEVEL_CUTOFF.HIGH ? 'HIGH' : n >= LEVEL_CUTOFF.MEDIUM ? 'MEDIUM' : 'LOW');

const isSignal = (c: CaseRecord) => c.status === 'RISK_SIGNAL' || c.status === 'POTENTIAL_DISCREPANCY';

export function scoreCase(c: CaseRecord, patterns: FacilityPattern[], claims: DummyClaim[]): PriorityScore {
  const ce = c.claim_evidence || {};
  const claim = claims.find(x => x.claim_key === c.claim_key);

  // 1) Selisih antara klaim dan jawaban pasien (maks 40)
  const diff = c.reconciliation?.computed_difference;
  const unit = c.reconciliation?.difference_unit || '';
  const baseVal = ce.claimed_quantity ?? ce.length_of_stay_days ?? ce.billed_visits_count ?? claim?.claimed_quantity ?? claim?.length_of_stay_days ?? null;
  let sel: ScoreFactor = { id: 'selisih', label: 'Selisih klaim dan jawaban pasien', points: 0, max: 40, detail: 'Tidak ada selisih yang terhitung.' };
  if (c.status !== 'CONSISTENT' && diff != null && diff > 0) {
    if (baseVal && baseVal > 0) {
      const ratio = diff / baseVal;
      sel = { ...sel, points: Math.round(40 * Math.min(1, ratio / 0.5)), detail: `Selisih ${diff} ${unit} dari ${baseVal} yang tercatat (${Math.round(ratio * 100)}%).`.replace('  ', ' ') };
    } else {
      sel = { ...sel, points: c.status === 'RISK_SIGNAL' ? 32 : 16, detail: `Ada selisih ${diff} ${unit}, tetapi angka pembanding tidak tersedia.`.replace('  ', ' ') };
    }
  }

  // 2) Pola: pelapor berbeda dengan sinyal serupa pada faskes yang sama (maks 35)
  const pat = isSignal(c) ? patterns.find(p => p.facility_id === c.facility_id && p.risk_type === c.risk_type) : undefined;
  const n = pat?.signal_count ?? 0;
  const polaPts = n >= 3 ? 35 : n === 2 ? 20 : n === 1 ? 8 : 0;
  const pola: ScoreFactor = {
    id: 'pola', label: 'Pelapor berbeda di faskes yang sama', points: polaPts, max: 35,
    detail: n >= 1 ? `${n} pelapor berbeda menyebut hal serupa di ${c.facility_name} dalam 30 hari.` : 'Belum ada sinyal serupa dari pelapor lain.'
  };

  // 3) Konteks klaim: apakah angka pada klaim tidak lazim dibanding kasus serupa (maks 25)
  let kon: ScoreFactor = { id: 'konteks', label: 'Konteks klaim dibanding kasus serupa', points: 0, max: 25, detail: claim?.scenario === 'OBAT' ? 'Data sampel tidak memuat jumlah obat, jadi pembanding belum tersedia untuk jenis ini.' : 'Belum ada data pembanding untuk jenis layanan ini.' };
  if (isSignal(c) && (c.risk_type === 'PROLONGED_LOS' || claim?.scenario === 'LOS')) {
    const los = ce.length_of_stay_days ?? claim?.length_of_stay_days;
    if (los != null) {
      const { group, ref, specific } = lookupLosRef(claim?.diagnosis_code);
      const pts = los > ref.p90 ? 25 : los > ref.p75 ? 16 : los > ref.median ? 8 : 0;
      kon = { ...kon, points: pts, detail: `Lama rawat tercatat ${los} hari. Pada kelompok diagnosis ${specific ? group : 'umum'} biasanya ${ref.median} hari, dan 90% kasus tidak lebih dari ${ref.p90} hari. ${REF_NOTE}` };
    }
  }

  if (isSignal(c) && c.risk_type === 'READMISI_MANIPULATIF') {
    const { group, ref, specific } = lookupReadmitRef(claim?.diagnosis_code);
    const pts = ref.ratePct < 5 ? 25 : ref.ratePct < 10 ? 16 : ref.ratePct < 20 ? 8 : 0;
    const wajar = ref.ratePct >= 20 ? ' Kondisi ini memang sering berulang (misalnya perawatan terjadwal), jadi masuk ulang cepat belum tentu janggal.' : '';
    kon = { ...kon, points: pts, detail: `Pada kelompok diagnosis ${specific ? group : 'umum'}, sekitar ${ref.ratePct.toLocaleString('id-ID')}% rawat inap diikuti rawat inap ulang dalam 30 hari.${wajar} ${REF_NOTE}` };
  }

  // Pengali: laporan lemah menurunkan prioritas
  const rel = c.reliability_flag;
  const m1 = rel === 'HIGH' ? 1 : rel === 'MEDIUM' ? 0.8 : 0.5;
  const inf = c.information_sufficiency;
  const m2 = inf === 'SUFFICIENT' ? 1 : inf === 'PARTIAL' ? 0.85 : 0.6;
  const modifiers: ScoreModifier[] = [
    { id: 'keandalan', label: 'Keandalan laporan', multiplier: m1, detail: rel === 'HIGH' ? 'Laporan dinilai andal.' : rel === 'MEDIUM' ? 'Keandalan laporan sedang.' : 'Keandalan laporan rendah.' },
    { id: 'informasi', label: 'Kecukupan informasi', multiplier: m2, detail: inf === 'SUFFICIENT' ? 'Informasi cukup untuk dibandingkan.' : inf === 'PARTIAL' ? 'Informasi sebagian.' : 'Informasi belum cukup.' }
  ];

  const base = sel.points + pola.points + kon.points;
  const total = Math.max(0, Math.min(100, Math.round(base * m1 * m2)));
  return { total, base, level: levelOf(total), factors: [sel, pola, kon], modifiers };
}
