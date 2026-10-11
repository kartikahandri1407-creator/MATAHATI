/**
 * MATA HATI - Deterministic Reconciliation Service
 * PRD Rule: Arithmetic (selisih jumlah, selisih hari, selisih nominal) is calculated by CODE, not by model.
 */

import { ClaimEvidence, PatientEvidence, ReconciliationResult, RiskType } from '../types/matahati';

export interface ComputeReconciliationParams {
  patientEvidence: PatientEvidence;
  claimEvidence: ClaimEvidence;
  riskType: RiskType;
  storyText: string;
}

export function computeDeterministicReconciliation(params: ComputeReconciliationParams): ReconciliationResult {
  const { patientEvidence, claimEvidence, riskType } = params;
  const matchedFields: string[] = [];
  const differentFields: string[] = [];
  let computedDifference: number | null = null;
  let differenceUnit: string | null = null;
  let finding = '';
  let notes = '';

  // Match service date if both present
  if (patientEvidence.service_date && claimEvidence.service_date) {
    if (patientEvidence.service_date === claimEvidence.service_date) {
      matchedFields.push('service_date');
    } else {
      differentFields.push('service_date');
    }
  }

  switch (riskType) {
    case 'PENGURANGAN_JUMLAH_OBAT': {
      const claimedQty = claimEvidence.claimed_quantity ?? patientEvidence.prescribed_quantity ?? null;
      const receivedQty = patientEvidence.received_quantity ?? null;

      if (claimedQty !== null && receivedQty !== null) {
        computedDifference = Math.max(0, claimedQty - receivedQty);
        differenceUnit = 'item/unit obat';

        if (computedDifference > 0) {
          differentFields.push('quantity');
          finding = `Terdeteksi potensi selisih kuantitas obat sebesar ${computedDifference} ${differenceUnit} antara penagihan/resep (${claimedQty}) dan fisik yang diserahkan ke peserta (${receivedQty}).`;
          notes = `Perhitungan kode: ${claimedQty} (klaim/resep) - ${receivedQty} (diterima) = selisih ${computedDifference} unit.`;
        } else {
          matchedFields.push('quantity');
          finding = `Kuantitas obat konsisten: ${claimedQty} item diresepkan/ditagihkan dan ${receivedQty} item diterima peserta.`;
        }
      } else {
        finding = 'Kuantitas obat tidak dapat dihitung secara pasti karena data kuantitas belum lengkap.';
      }
      break;
    }

    case 'PROLONGED_LOS': {
      const claimedDays = claimEvidence.length_of_stay_days ?? null;
      const patientDays = patientEvidence.length_of_stay_days ?? null;

      if (claimedDays !== null && patientDays !== null) {
        computedDifference = claimedDays - patientDays;
        differenceUnit = 'hari rawat inap';

        if (computedDifference > 0) {
          differentFields.push('length_of_stay_days');
          finding = `Terdeteksi potensi perbedaan lama rawat inap (LOS) sebesar ${computedDifference} hari antara klaim administrasi (${claimedDays} hari) dan penuturan kepulangan pasien (${patientDays} hari).`;
          notes = `Perhitungan kode: ${claimedDays} hari (klaim) - ${patientDays} hari (pasien) = selisih ${computedDifference} hari.`;
        } else if (computedDifference < 0) {
          finding = `Lama rawat inap di klaim (${claimedDays} hari) lebih pendek dari pernyataan pasien (${patientDays} hari).`;
        } else {
          matchedFields.push('length_of_stay_days');
          finding = `Lama rawat inap konsisten: ${claimedDays} hari pada klaim dan pernyataan pasien.`;
        }
      } else {
        finding = 'Durasi hari rawat inap belum memiliki pembanding yang lengkap.';
      }
      break;
    }

    case 'TINDAKAN_TIDAK_DILAKUKAN': {
      if (patientEvidence.stated_procedure_performed === false) {
        differentFields.push('procedure_performed');
        finding = `Tindakan ${claimEvidence.procedure || 'medis/terapi'} tercatat ditagihkan pada klaim faskes, namun peserta menyatakan dalam kondisi sadar tidak pernah menerima tindakan tersebut.`;
        notes = 'Potensi ketidaksesuaian tindakan yang perlu diverifikasi (modus #14).';
      } else if (patientEvidence.stated_procedure_performed === true) {
        matchedFields.push('procedure_performed');
        finding = `Tindakan ${claimEvidence.procedure || 'medis'} dinyatakan peserta telah dilaksanakan sesuai penuturan peserta.`;
      } else {
        finding = `Tindakan ${claimEvidence.procedure || 'medis'} memerlukan klarifikasi berkas rekam medis faskes.`;
      }
      break;
    }

    case 'IUR_BIAYA_ILEGAL': {
      const fee = patientEvidence.out_of_pocket_fee ?? null;
      if (fee !== null && fee > 0) {
        computedDifference = fee;
        differenceUnit = 'Rupiah (Urun Biaya Ilegal)';
        differentFields.push('out_of_pocket_fee');
        finding = `Peserta menyebut membayar tunai Rp ${fee.toLocaleString('id-ID')}. Apakah biaya itu sesuai ketentuan urun biaya perlu diverifikasi ke faskes.`;
        notes = `Nominal yang disebut peserta: Rp ${fee.toLocaleString('id-ID')}. Tidak ada pembanding pada data klaim.`;
      } else {
        differentFields.push('cost_sharing');
        finding = 'Peserta melaporkan adanya pungutan biaya tambahan, tetapi nominalnya tidak disebut sehingga belum dapat dibandingkan.';
      }
      break;
    }

    case 'KUNJUNGAN_FIKTIF': {
      // Tidak ada angka bawaan: bila salah satu sisi tidak tersedia, selisih tidak dihitung.
      const billedVisits = claimEvidence.billed_visits_count ?? null;
      const actualVisits = patientEvidence.actual_visits_count ?? null;
      if (billedVisits !== null && actualVisits !== null) {
        computedDifference = Math.max(0, billedVisits - actualVisits);
        differenceUnit = 'kunjungan';
        if (computedDifference > 0) {
          differentFields.push('visits_count');
          finding = `Klaim mencatat ${billedVisits} kunjungan, sedangkan peserta menyebut hadir ${actualVisits} kali (selisih ${computedDifference} kunjungan yang perlu diverifikasi).`;
          notes = `Perhitungan kode: ${billedVisits} (klaim) - ${actualVisits} (hadir menurut peserta) = ${computedDifference}.`;
        } else {
          matchedFields.push('visits_count');
          finding = `Jumlah kunjungan konsisten: ${billedVisits} pada klaim dan ${actualVisits} menurut peserta.`;
        }
      } else {
        finding = 'Jumlah kunjungan pada klaim atau menurut peserta belum lengkap, sehingga selisih tidak dapat dihitung.';
      }
      break;
    }

    case 'READMISI_MANIPULATIF': {
      // Ditentukan hanya bila peserta menyebut jeda hari; tidak ada nilai bawaan.
      const interval = patientEvidence.readmission_interval_days ?? null;
      if (interval !== null) {
        computedDifference = interval;
        differenceUnit = 'hari jeda rawat ulang';
        differentFields.push('readmission_interval');
        finding = `Peserta menyebut dirawat ulang ${interval} hari setelah pulang. Apakah ini sesuai indikasi medis perlu ditinjau oleh pihak yang berwenang menilai.`;
        notes = 'Modus ini membutuhkan penilaian medis; sistem hanya mencatat jeda hari yang disebut peserta.';
      } else {
        finding = 'Jeda hari rawat ulang tidak disebut peserta, sehingga tidak dapat dibandingkan.';
      }
      break;
    }

    case 'UPCODING_DIAGNOSIS': {
      // Peserta tidak dapat menilai derajat keparahan diagnosis; tidak ada selisih yang dihitung.
      finding = `Derajat keparahan diagnosis (${claimEvidence.diagnosis_claimed || 'tidak disebut'}) tidak dapat dinilai dari penuturan peserta dan memerlukan telaah rekam medis oleh tenaga yang berwenang.`;
      notes = 'Modus ini membutuhkan penilaian medis; tidak ada selisih yang dihitung oleh sistem.';
      break;
    }

    default:
      finding = 'Rekonsiliasi data umum: Belum ditemukan indikasi perbedaan spesifik.';
      break;
  }

  return {
    finding,
    matched_fields: matchedFields,
    different_fields: differentFields,
    computed_difference: computedDifference ?? undefined,
    difference_unit: differenceUnit ?? undefined,
    reconciliation_notes: notes
  };
}
