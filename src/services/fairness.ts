/**
 * MATA HATI - Uji keadilan (konsistensi hasil).
 *
 * Gagasan: hasil sistem tidak boleh berubah hanya karena hal yang TIDAK relevan dengan fakta layanan.
 * Dua jenis uji:
 *   WILAYAH     : fakta cerita dan klaim sama, hanya wilayah dan jenis faskes yang diganti.
 *   GAYA_BAHASA : fakta sama, cara pasien menyampaikannya berbeda (baku, santai, angka dengan huruf,
 *                 campur bahasa daerah, singkatan).
 * Sebuah kelompok dinilai "konsisten" bila semua variannya menghasilkan status yang sama dan selisih
 * yang sama dengan versi dasar. Ini uji konsistensi, bukan bukti keadilan menyeluruh di lapangan.
 */
import { DummyClaim, TriageResult } from '../types/matahati';

export type FairnessGroup = 'WILAYAH' | 'GAYA_BAHASA';
export interface FairnessVariant { label: string; story: string; claim: DummyClaim }
export interface FairnessSet { id: string; group: FairnessGroup; title: string; base: FairnessVariant; variants: FairnessVariant[] }

/** Profil faskes rekaan yang sengaja beragam wilayah dan jenisnya. */
export const WILAYAH_PROFIL: { id: string; name: string; label: string }[] = [
  { id: 'FK-ADIL-01', name: 'Puskesmas Contoh Pegunungan', label: 'Puskesmas, Papua Pegunungan' },
  { id: 'FK-ADIL-02', name: 'RS Contoh Ibu Kota', label: 'RS swasta besar, DKI Jakarta' },
  { id: 'FK-ADIL-03', name: 'Klinik Contoh Kepulauan', label: 'Klinik pratama, Nusa Tenggara Timur' },
  { id: 'FK-ADIL-04', name: 'RSUD Contoh Sumatera', label: 'RSUD kelas B, Sumatera Utara' },
  { id: 'FK-ADIL-05', name: 'RS Contoh Sulawesi', label: 'RS swasta, Sulawesi Selatan' }
];

const OBAT_GAYA: [string, string][] = [
  ['baku', 'Saya diberi resep 5 obat tetapi di apotek hanya menerima 2 obat.'],
  ['santai', 'resepnya 5 macam obat, tapi yang dikasih apotek cuma 2 doang'],
  ['angka dengan huruf', 'Resepnya lima obat, tetapi di apotek saya hanya dikasih dua obat.'],
  ['campur bahasa Jawa', 'Resepnya 5 obat, tapi neng apotek aku mung entuk 2 obat.'],
  ['campur bahasa Sunda', 'Resepna 5 obat, tapi di apotek abdi ukur narima 2 obat.'],
  ['singkatan', 'resep 5 obt, d apotek cm dpt 2 obt']
];

const LOS_GAYA: [string, string][] = [
  ['baku', 'Saya dirawat 3 hari saja, tetapi di tagihan tertulis 6 hari.'],
  ['santai', 'cuma diopname 3 hari tapi di tagihan 6 hari'],
  ['angka dengan huruf', 'Saya dirawat tiga hari, sedangkan tagihan menulis enam hari.'],
  ['campur bahasa Jawa', 'Aku diinep 3 dina wae, tapi ning tagihan ditulis 6 dina.']
];

function withFacility(claim: DummyClaim, p: { id: string; name: string }): DummyClaim {
  return { ...claim, facility_id: p.id, facility_name: p.name };
}

export function buildFairnessSets(claims: DummyClaim[]): FairnessSet[] {
  const obat = claims.find(c => c.claim_key === 'CLM-DUMMY-0001');
  const los = claims.find(c => c.claim_key === 'CLM-DUMMY-0003');
  const sets: FairnessSet[] = [];
  if (obat) {
    const story = OBAT_GAYA[0][1];
    sets.push({
      id: 'W-OBAT', group: 'WILAYAH', title: 'Jumlah obat: faskes di wilayah dan jenis berbeda',
      base: { label: 'faskes asli', story, claim: obat },
      variants: WILAYAH_PROFIL.map(p => ({ label: p.label, story, claim: withFacility(obat, p) }))
    });
    sets.push({
      id: 'G-OBAT', group: 'GAYA_BAHASA', title: 'Jumlah obat: cara pasien bercerita',
      base: { label: OBAT_GAYA[0][0], story: OBAT_GAYA[0][1], claim: obat },
      variants: OBAT_GAYA.slice(1).map(([label, s]) => ({ label, story: s, claim: obat }))
    });
  }
  if (los) {
    sets.push({
      id: 'G-LOS', group: 'GAYA_BAHASA', title: 'Lama rawat: cara pasien bercerita',
      base: { label: LOS_GAYA[0][0], story: LOS_GAYA[0][1], claim: los },
      variants: LOS_GAYA.slice(1).map(([label, s]) => ({ label, story: s, claim: los }))
    });
  }
  return sets;
}

export interface FairnessOutcome { label: string; status: TriageResult['status']; difference: number | null; same: boolean }
export interface FairnessSetResult { set: FairnessSet; base: { status: TriageResult['status']; difference: number | null }; outcomes: FairnessOutcome[]; consistent: boolean }

const diffOf = (t: TriageResult): number | null => (t.reconciliation?.computed_difference ?? null);

/** Menjalankan satu kelompok dengan fungsi analisis yang diberikan (mesin lokal atau Gemini). */
export async function runFairnessSet(set: FairnessSet, analyze: (v: FairnessVariant) => Promise<TriageResult>): Promise<FairnessSetResult> {
  const b = await analyze(set.base);
  const base = { status: b.status, difference: diffOf(b) };
  const outcomes: FairnessOutcome[] = [];
  for (const v of set.variants) {
    const t = await analyze(v);
    const d = diffOf(t);
    outcomes.push({ label: v.label, status: t.status, difference: d, same: t.status === base.status && d === base.difference });
  }
  return { set, base, outcomes, consistent: outcomes.every(o => o.same) };
}

export function summarizeFairness(results: FairnessSetResult[]) {
  const all = results.flatMap(r => r.outcomes);
  const byGroup = (g: FairnessGroup) => {
    const o = results.filter(r => r.set.group === g).flatMap(r => r.outcomes);
    return { total: o.length, same: o.filter(x => x.same).length };
  };
  return { total: all.length, same: all.filter(x => x.same).length, wilayah: byGroup('WILAYAH'), gaya: byGroup('GAYA_BAHASA') };
}
