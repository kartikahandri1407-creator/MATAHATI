/**
 * MATA HATI - Data pembanding untuk konteks klaim.
 * Isi di bawah adalah CONTOH SIMULASI (bukan statistik BPJS). Bentuknya meniru ringkasan sebaran
 * lama rawat per kelompok diagnosis (3 karakter pertama ICD-10): median, persentil 75, persentil 90.
 * Bila data sampel BPJS sudah diizinkan, ganti isi tabel ini dengan ringkasan statistik yang
 * dihitung sendiri di komputer pribadi. Jangan memasukkan baris data sampel ke sini.
 */
export interface LosRef { median: number; p75: number; p90: number }

export const REF_NOTE = 'Pembanding: contoh simulasi, belum dari data sampel BPJS.';

export const LOS_REF: Record<string, LosRef> = {
  A01: { median: 4, p75: 5, p90: 7 },   // demam tifoid
  A09: { median: 3, p75: 4, p90: 6 },   // gastroenteritis
  E11: { median: 4, p75: 6, p90: 9 },   // diabetes melitus tipe 2
  I10: { median: 3, p75: 4, p90: 6 },   // hipertensi esensial
  J18: { median: 5, p75: 7, p90: 10 },  // pneumonia
  O80: { median: 2, p75: 3, p90: 4 }    // persalinan normal
};
export const LOS_REF_DEFAULT: LosRef = { median: 4, p75: 6, p90: 9 };

export function lookupLosRef(icd?: string | null): { group: string; ref: LosRef; specific: boolean } {
  const g = (icd || '').trim().toUpperCase().slice(0, 3);
  return LOS_REF[g] ? { group: g, ref: LOS_REF[g], specific: true } : { group: g || 'umum', ref: LOS_REF_DEFAULT, specific: false };
}
