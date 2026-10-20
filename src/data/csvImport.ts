/**
 * MATA HATI - Impor data klaim dari berkas CSV.
 * Tujuan: data klaim (simulasi atau anonim) masuk sekaligus, bukan diketik satu per satu.
 * Kolom nama dan nomor kartu SENGAJA tidak dibaca; hasil impor selalu anonim.
 */
import { DummyClaim, Facility } from '../types/matahati';

export const CSV_TEMPLATE =
  'nomor_klaim,no_sep,faskes,kota,provinsi,tanggal_layanan,jenis,nama_obat,jumlah_obat,nama_tindakan,hari_rawat,diagnosis,kode_diagnosis,nilai_klaim\n' +
  'CLM-CSV-0001,SEP-2026-1001-00001,RSUD Contoh Sehat,Kota Contoh,Provinsi Contoh,2026-10-01,obat,Obat contoh A,5,,,Hipertensi,I10,450000\n' +
  'CLM-CSV-0002,SEP-2026-1001-00002,RSUD Contoh Sehat,Kota Contoh,Provinsi Contoh,2026-10-02,tindakan,,,Tindakan contoh,,Katarak,H25,1200000\n' +
  'CLM-CSV-0003,SEP-2026-1001-00003,RSUD Contoh Sehat,Kota Contoh,Provinsi Contoh,2026-10-03,rawat inap,,,,4,Pneumonia,J18,5200000\n';

/** Kolom yang sengaja diabaikan agar tidak ada identitas peserta yang ikut masuk. */
const IDENTITY_HEADERS = ['nama', 'nama_pasien', 'nama_peserta', 'nik', 'no_kartu', 'nomor_kartu', 'no_bpjs', 'nomor_bpjs', 'patient_name', 'patient_bpjs_id', 'alamat', 'no_hp', 'telepon'];

const ALIASES: Record<string, string[]> = {
  claim_key: ['nomor_klaim', 'no_klaim', 'claim_key', 'id_klaim'],
  sep_number: ['no_sep', 'nomor_sep', 'sep', 'sep_number'],
  facility_name: ['faskes', 'nama_faskes', 'facility_name', 'fasilitas'],
  facility_id: ['id_faskes', 'kode_faskes', 'facility_id'],
  city: ['kota', 'kabupaten', 'kab_kota', 'city'],
  province: ['provinsi', 'province'],
  service_date: ['tanggal_layanan', 'tgl_layanan', 'tanggal', 'service_date', 'tgl_pelayanan'],
  scenario: ['jenis', 'jenis_layanan', 'scenario'],
  medication_name: ['nama_obat', 'obat', 'medication_name'],
  claimed_quantity: ['jumlah_obat', 'jumlah', 'qty', 'claimed_quantity'],
  procedure_name: ['nama_tindakan', 'tindakan', 'procedure_name'],
  length_of_stay_days: ['hari_rawat', 'lama_rawat', 'los', 'length_of_stay_days'],
  diagnosis_primary: ['diagnosis', 'diagnosis_utama', 'diagnosis_primary'],
  diagnosis_code: ['kode_diagnosis', 'icd10', 'icd', 'diagnosis_code'],
  claim_amount: ['nilai_klaim', 'tarif', 'biaya', 'claim_amount']
};

const SCENARIO_WORDS: Record<string, DummyClaim['scenario']> = {
  obat: 'OBAT', resep: 'OBAT', farmasi: 'OBAT',
  tindakan: 'TINDAKAN', prosedur: 'TINDAKAN', operasi: 'TINDAKAN',
  'rawat inap': 'LOS', rawatinap: 'LOS', ranap: 'LOS', los: 'LOS', 'lama rawat': 'LOS'
};

/** Pembaca CSV sederhana: mendukung tanda kutip, koma atau titik koma sebagai pemisah. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] || '';
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false; }
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  return rows;
}

const norm = (h: string) => h.trim().toLowerCase().replace(/[\s-]+/g, '_');

export interface ImportResult {
  claims: DummyClaim[];
  newFacilities: Facility[];
  errors: string[];          // baris yang ditolak, beserta alasannya
  ignoredColumns: string[];  // kolom identitas yang dibuang
  unknownColumns: string[];  // kolom yang tidak dikenali
}

const MAX_ROWS = 2000;

function toDate(v: string): string | null {
  const s = v.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (!m) { const d = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s); if (d) m = [d[0], d[3], d[2], d[1]] as unknown as RegExpExecArray; }
  if (!m) return null;
  const y = +m[1], mo = +m[2], da = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, da));
  if (y < 2000 || y > 2100 || dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== da) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
}

function toNumber(v: string): number | null {
  const s = v.trim().replace(/^rp\.?\s*/i, '').replace(/\./g, '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000_000 ? n : NaN;
}

/**
 * Ubah isi CSV menjadi klaim + faskes baru.
 * existingClaims/existingFacilities dipakai agar nomor klaim tidak bentrok dan faskes yang sudah ada dipakai ulang.
 */
export function importClaimsCsv(text: string, existingClaims: DummyClaim[], existingFacilities: Facility[]): ImportResult {
  const out: ImportResult = { claims: [], newFacilities: [], errors: [], ignoredColumns: [], unknownColumns: [] };
  const rows = parseCsv(text);
  if (rows.length < 2) { out.errors.push('Berkas kosong atau hanya berisi judul kolom.'); return out; }
  if (rows.length - 1 > MAX_ROWS) { out.errors.push(`Terlalu banyak baris (maksimal ${MAX_ROWS}).`); return out; }

  const headers = rows[0].map(norm);
  const col: Record<string, number> = {};
  headers.forEach((h, i) => {
    if (IDENTITY_HEADERS.includes(h)) { out.ignoredColumns.push(rows[0][i].trim()); return; }
    const key = Object.keys(ALIASES).find(k => ALIASES[k].includes(h));
    if (key && col[key] === undefined) col[key] = i; else if (!key && h) out.unknownColumns.push(rows[0][i].trim());
  });
  for (const need of ['facility_name', 'service_date', 'scenario'] as const) {
    if (col[need] === undefined && !(need === 'facility_name' && col.facility_id !== undefined)) {
      out.errors.push(`Kolom wajib tidak ditemukan: ${ALIASES[need][0]}.`); }
  }
  if (out.errors.length) return out;

  const get = (r: string[], k: string) => (col[k] === undefined ? '' : (r[col[k]] ?? '').trim());
  const usedClaimIds = new Set(existingClaims.map(c => c.claim_key));
  const facs = [...existingFacilities];
  let seq = existingClaims.length;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i], line = i + 1;
    const fail = (why: string) => out.errors.push(`Baris ${line}: ${why}`);

    const scenario = SCENARIO_WORDS[get(r, 'scenario').toLowerCase()];
    if (!scenario) { fail(`jenis "${get(r, 'scenario')}" tidak dikenali (pakai: obat, tindakan, rawat inap).`); continue; }
    const date = toDate(get(r, 'service_date'));
    if (!date) { fail('tanggal layanan tidak valid (pakai 2026-10-01 atau 01/10/2026).'); continue; }

    let fac = facs.find(f => (get(r, 'facility_id') && f.facility_id === get(r, 'facility_id')) || (get(r, 'facility_name') && f.facility_name.toLowerCase() === get(r, 'facility_name').toLowerCase()));
    if (!fac) {
      const name = get(r, 'facility_name');
      if (!name) { fail('nama faskes kosong.'); continue; }
      const id = (get(r, 'facility_id') || `FK-CSV-${String(facs.length + 1).padStart(2, '0')}`).replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 40);
      fac = { facility_id: id, facility_name: name.slice(0, 120), facility_type: 'RS_SWASTA', city: get(r, 'city').slice(0, 80), province: get(r, 'province').slice(0, 80) };
      facs.push(fac); out.newFacilities.push(fac);
    }

    const qty = toNumber(get(r, 'claimed_quantity')), los = toNumber(get(r, 'length_of_stay_days')), amt = toNumber(get(r, 'claim_amount'));
    if ([qty, los, amt].some(n => Number.isNaN(n))) { fail('ada angka yang tidak valid.'); continue; }
    if (scenario === 'OBAT' && qty === null) { fail('jumlah obat kosong.'); continue; }
    if (scenario === 'LOS' && los === null) { fail('hari rawat kosong.'); continue; }
    if (scenario === 'TINDAKAN' && !get(r, 'procedure_name')) { fail('nama tindakan kosong.'); continue; }

    let key = get(r, 'claim_key').replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 40);
    if (!key) { do { seq++; key = `CLM-CSV-${String(seq).padStart(4, '0')}`; } while (usedClaimIds.has(key)); }
    if (usedClaimIds.has(key)) { fail(`nomor klaim ${key} sudah ada atau dobel.`); continue; }
    usedClaimIds.add(key);

    out.claims.push({
      claim_key: key,
      sep_number: get(r, 'sep_number').slice(0, 40) || `SEP-${date.replace(/-/g, '')}-${String(out.claims.length + 1).padStart(5, '0')}`,
      facility_id: fac.facility_id, facility_name: fac.facility_name,
      patient_name: 'Peserta (anonim)', patient_bpjs_id: '',
      service_date: date, scenario,
      ...(scenario === 'OBAT' ? { medication_name: get(r, 'medication_name').slice(0, 120) || 'Obat', claimed_quantity: qty! } : {}),
      ...(scenario === 'TINDAKAN' ? { procedure_name: get(r, 'procedure_name').slice(0, 120) } : {}),
      ...(scenario === 'LOS' ? { length_of_stay_days: los! } : {}),
      diagnosis_primary: get(r, 'diagnosis_primary').slice(0, 120), diagnosis_code: get(r, 'diagnosis_code').slice(0, 12),
      claim_amount: amt ?? 0
    });
  }
  return out;
}
