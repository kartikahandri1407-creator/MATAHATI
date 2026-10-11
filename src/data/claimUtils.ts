import { DummyClaim, RiskType } from '../types/matahati';

export type Scenario = DummyClaim['scenario'];

export const SCENARIO_LABEL: Record<Scenario, string> = {
  OBAT: 'Obat yang diserahkan',
  TINDAKAN: 'Tindakan medis',
  LOS: 'Lama rawat inap',
  IUR_BIAYA: 'Biaya tambahan di kasir',
  KUNJUNGAN_FIKTIF: 'Jumlah kunjungan',
  READMISI: 'Rawat inap ulang',
  UPCODING: 'Diagnosis pada tagihan',
  UMUM: 'Layanan lain'
};

/** Tiga jenis inti yang dievaluasi; sisanya bersifat eksperimen. */
export const CORE_SCENARIOS: Scenario[] = ['OBAT', 'TINDAKAN', 'LOS'];

export const RISK_LABEL: Record<RiskType, string> = {
  PENGURANGAN_JUMLAH_OBAT: 'Jumlah obat berbeda',
  TINDAKAN_TIDAK_DILAKUKAN: 'Tindakan berbeda',
  PROLONGED_LOS: 'Lama rawat berbeda',
  IUR_BIAYA_ILEGAL: 'Biaya tambahan di kasir',
  KUNJUNGAN_FIKTIF: 'Jumlah kunjungan berbeda',
  READMISI_MANIPULATIF: 'Rawat inap ulang dalam waktu dekat',
  UPCODING_DIAGNOSIS: 'Diagnosis pada tagihan',
  TIDAK_DAPAT_DITENTUKAN: 'Belum dapat ditentukan'
};

export const FACILITY_TYPE_LABEL: Record<string, string> = {
  RSUD_KELAS_A: 'RSUD Kelas A', RSUD_KELAS_B: 'RSUD Kelas B', RS_SWASTA: 'RS Swasta',
  KLINIK_PRATAMA: 'Klinik Pratama', PUSKESMAS: 'Puskesmas'
};

/** Ringkasan satu baris tentang apa yang tercatat pada klaim. */
export function claimSummary(c: DummyClaim): string {
  switch (c.scenario) {
    case 'OBAT': return `${c.medication_name || 'Obat'} · tercatat ${c.claimed_quantity ?? '?'} item`;
    case 'TINDAKAN': return `${c.procedure_name || 'Tindakan'} tercatat dilakukan`;
    case 'LOS': return `Rawat inap tercatat ${c.length_of_stay_days ?? '?'} hari`;
    case 'KUNJUNGAN_FIKTIF': return `${c.billed_visits_count ?? '?'} kunjungan tercatat`;
    case 'IUR_BIAYA': return 'Layanan ditanggung JKN (tanpa biaya tambahan)';
    case 'READMISI': return `Rawat inap: ${c.diagnosis_primary}`;
    case 'UPCODING': return `Diagnosis tercatat: ${c.diagnosis_primary}`;
    default: return c.diagnosis_primary || 'Layanan rawat';
  }
}

export const claimLabel = (c: DummyClaim) => `${c.sep_number} · ${c.facility_name} · ${c.service_date}`;

/** Contoh cerita (fiktif) agar pengujian cepat. */
export const SAMPLE_STORY: Record<Scenario, (c: DummyClaim) => string> = {
  OBAT: c => `Saya berobat ke ${c.facility_name} pada ${c.service_date}. Dokter menulis resep ${c.claimed_quantity ?? 3} macam obat, tetapi di farmasi saya hanya menerima ${Math.max(1, (c.claimed_quantity ?? 3) - 2)} macam. Petugas bilang sisanya kosong dan saya diminta membeli sendiri di luar.`,
  TINDAKAN: c => `Di ${c.facility_name} saya hanya diperiksa dan diberi obat. Saya tidak pernah menjalani ${c.procedure_name || 'tindakan itu'}, tetapi di rincian tertulis tindakan tersebut dilakukan.`,
  LOS: c => `Saya dirawat di ${c.facility_name} dan sudah pulang pada hari ke-3. Di berkas tertulis saya dirawat ${c.length_of_stay_days ?? 6} hari.`,
  IUR_BIAYA: c => `Di ${c.facility_name} saya diminta membayar tunai Rp 350.000 di kasir, padahal kartu JKN saya aktif.`,
  KUNJUNGAN_FIKTIF: c => `Di Mobile JKN tercatat ${c.billed_visits_count ?? 4} kali kunjungan ke ${c.facility_name} bulan ini, padahal saya hanya datang 1 kali.`,
  READMISI: c => `Saya dipulangkan dari ${c.facility_name} saat masih lemas. Dua hari kemudian saya masuk rawat inap lagi dengan keluhan yang sama.`,
  UPCODING: c => `Saya merasa sakit ringan, tetapi tagihan ${c.facility_name} menulis diagnosis ${c.diagnosis_primary}. Saya tidak tahu apakah itu sesuai.`,
  UMUM: c => `Saya berobat ke ${c.facility_name} pada ${c.service_date}. Ada hal yang menurut saya berbeda dari catatan, yaitu ...`
};

export const EMPTY_CLAIM = (facility_id = '', facility_name = ''): DummyClaim => ({
  claim_key: '', sep_number: '', facility_id, facility_name, patient_name: 'Peserta (anonim)', patient_bpjs_id: '',
  service_date: new Date().toISOString().slice(0, 10), scenario: 'OBAT', diagnosis_primary: '', diagnosis_code: '', claim_amount: 0
});

/** Perkecil foto di browser: sisi terpanjang 1280 px, JPEG kualitas 0.7. */
export async function compressImage(file: File, maxSide = 1280, quality = 0.7): Promise<string> {
  const dataUrl: string = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = no; r.readAsDataURL(file); });
  const img: HTMLImageElement = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = dataUrl; });
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}
