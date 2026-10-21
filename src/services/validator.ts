/**
 * MATA HATI - Response Validator & Safety Enforcer
 * Menegakkan aturan terkunci PRD (Bagian 14, 18, 19, 42).
 * Semua aturan di sini dijalankan oleh KODE, bukan hanya diminta kepada model.
 */

import {
  EvidenceConfidence,
  InformationSufficiency,
  ReliabilityFlag,
  RiskType,
  TriageResult,
  TriageStatus,
  VerificationPriority
} from '../types/matahati';
import { SCENARIO_KNOWLEDGE } from '../ai/scenarioKnowledge';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  sanitizedResult: TriageResult;
}

const STATUSES: TriageStatus[] = ['CONSISTENT', 'INSUFFICIENT_EVIDENCE', 'POTENTIAL_DISCREPANCY', 'RISK_SIGNAL'];
const RISK_TYPES: RiskType[] = [
  'PENGURANGAN_JUMLAH_OBAT', 'TINDAKAN_TIDAK_DILAKUKAN', 'PROLONGED_LOS', 'IUR_BIAYA_ILEGAL',
  'KUNJUNGAN_FIKTIF', 'READMISI_MANIPULATIF', 'UPCODING_DIAGNOSIS', 'TIDAK_DAPAT_DITENTUKAN'
];
const LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
const SUFFICIENCY: InformationSufficiency[] = ['SUFFICIENT', 'PARTIAL', 'INSUFFICIENT'];

/** Modus yang butuh penilaian medis: peserta tidak dapat memastikannya, jadi maksimal POTENTIAL_DISCREPANCY. */
export const MODES_NEEDING_MEDICAL_REVIEW: RiskType[] = ['UPCODING_DIAGNOSIS', 'READMISI_MANIPULATIF'];

/** Modus inti yang dievaluasi (dipetakan ke modus resmi Healthkathon #18, #14, #12). */
export const CORE_RISK_TYPES: RiskType[] = ['PENGURANGAN_JUMLAH_OBAT', 'TINDAKAN_TIDAK_DILAKUKAN', 'PROLONGED_LOS'];

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): { value: T; ok: boolean } =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? { value: value as T, ok: true }
    : { value: fallback, ok: value === undefined || value === null };

function alternativesFor(riskType: RiskType): string[] {
  const knowledge: any = Object.values(SCENARIO_KNOWLEDGE).find((s: any) => s?.code === riskType);
  const list: string[] | undefined = knowledge?.common_alternative_explanations;
  if (Array.isArray(list) && list.length > 0) return list.slice(0, 2);
  return ['Perbedaan pencatatan atau ingatan peserta; perlu dikonfirmasi dengan dokumen pendukung.'];
}

export function validateAndSanitizeTriageResult(raw: Partial<TriageResult>): ValidationReport {
  const errors: string[] = [];

  const status = pick<TriageStatus>(raw.status, STATUSES, 'INSUFFICIENT_EVIDENCE');
  if (!status.ok) errors.push(`Status '${String(raw.status)}' tidak dikenal. Diganti INSUFFICIENT_EVIDENCE.`);
  const riskType = pick<RiskType>(raw.risk_type, RISK_TYPES, 'TIDAK_DAPAT_DITENTUKAN');
  if (!riskType.ok) errors.push(`Jenis risiko '${String(raw.risk_type)}' tidak dikenal.`);
  const reliability = pick<ReliabilityFlag>(raw.reliability_flag, LEVELS as ReliabilityFlag[], 'MEDIUM');
  const confidence = pick<EvidenceConfidence>(raw.evidence_confidence, LEVELS as EvidenceConfidence[], 'MEDIUM');
  const sufficiency = pick<InformationSufficiency>(raw.information_sufficiency, SUFFICIENCY, 'PARTIAL');
  const priority = pick<VerificationPriority>(raw.verification_priority, LEVELS as VerificationPriority[], 'LOW');

  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(x => x.slice(0, 600)) : [];

  const sanitized: TriageResult = {
    case_id: raw.case_id || `MH-2026-${Date.now().toString().slice(-4)}`,
    status: status.value,
    risk_type: riskType.value,
    source_channel: raw.source_channel || 'SIMULATED_FORM',
    claim_key: raw.claim_key || 'UNKNOWN',
    patient_evidence: { ...(raw.patient_evidence || {}), stated_by_patient: strings(raw.patient_evidence?.stated_by_patient) },
    claim_evidence: raw.claim_evidence || {},
    reconciliation: {
      finding: raw.reconciliation?.finding || 'Belum dilakukan rekonsiliasi',
      matched_fields: strings(raw.reconciliation?.matched_fields),
      different_fields: strings(raw.reconciliation?.different_fields),
      computed_difference: raw.reconciliation?.computed_difference,
      difference_unit: raw.reconciliation?.difference_unit,
      reconciliation_notes: raw.reconciliation?.reconciliation_notes
    },
    alternative_explanations: strings(raw.alternative_explanations),
    reliability_flag: reliability.value,
    reliability_notes: strings(raw.reliability_notes),
    evidence_confidence: confidence.value,
    information_sufficiency: sufficiency.value,
    verification_priority: priority.value,
    recommended_verification: strings(raw.recommended_verification),
    fraud_determination: 'NOT_DETERMINED', // ATURAN 1: selalu NOT_DETERMINED
    ai_interpretation: raw.ai_interpretation || 'Interpretasi otomatis MATA HATI.',
    ...(Array.isArray(raw.evidence_quotes) && raw.evidence_quotes.length
      ? { evidence_quotes: raw.evidence_quotes.filter(q => q && typeof q.quote === 'string').slice(0, 5).map(q => ({ quote: q.quote.slice(0, 160), supports: String(q.supports || '').slice(0, 120) })) }
      : {}),
    processing_source: raw.processing_source
  };

  // Aturan 1: fraud_determination tidak boleh bernilai lain
  if (raw.fraud_determination && raw.fraud_determination !== 'NOT_DETERMINED') {
    errors.push(`Nilai fraud_determination '${raw.fraud_determination}' dilarang dan di-reset ke NOT_DETERMINED.`);
  }

  // Aturan 2: modus yang butuh penilaian medis maksimal POTENTIAL_DISCREPANCY
  if (MODES_NEEDING_MEDICAL_REVIEW.includes(sanitized.risk_type) && sanitized.status === 'RISK_SIGNAL') {
    errors.push('Modus ini membutuhkan penilaian medis; status diturunkan ke POTENTIAL_DISCREPANCY.');
    sanitized.status = 'POTENTIAL_DISCREPANCY';
    sanitized.reliability_notes.push(
      'Modus ini membutuhkan penilaian medis yang tidak dapat ditetapkan dari penuturan peserta; maksimal berstatus perbedaan potensial.'
    );
  }

  // Aturan 3: reliabilitas LOW tidak boleh menghasilkan RISK_SIGNAL
  if (sanitized.reliability_flag === 'LOW' && sanitized.status === 'RISK_SIGNAL') {
    errors.push("Reliabilitas 'LOW' tidak boleh berstatus RISK_SIGNAL; diturunkan ke POTENTIAL_DISCREPANCY.");
    sanitized.status = 'POTENTIAL_DISCREPANCY';
  }

  // Aturan 4: discrepancy/signal wajib memuat penjelasan alternatif yang spesifik pada modusnya
  if ((sanitized.status === 'RISK_SIGNAL' || sanitized.status === 'POTENTIAL_DISCREPANCY') && sanitized.alternative_explanations.length === 0) {
    sanitized.alternative_explanations = alternativesFor(sanitized.risk_type);
  }

  // Aturan 5: prioritas verifikasi mengikuti status dan reliabilitas (urutan antrean, bukan skor fraud)
  if (sanitized.status === 'RISK_SIGNAL') {
    sanitized.verification_priority = 'HIGH';
  } else if (sanitized.status === 'POTENTIAL_DISCREPANCY') {
    sanitized.verification_priority = sanitized.reliability_flag === 'LOW' ? 'LOW' : 'MEDIUM';
  } else {
    sanitized.verification_priority = 'LOW';
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedResult: sanitized
  };
}
