/**
 * MATA HATI - Type Definitions
 * Source of Truth: PRD v5.3 (Healthkathon 2026 BPJS Kesehatan - Enterprise Edition)
 * Tipe data MATA HATI
 */

export type TriageStatus = 
  | 'CONSISTENT'
  | 'INSUFFICIENT_EVIDENCE'
  | 'POTENTIAL_DISCREPANCY'
  | 'RISK_SIGNAL';

export type RiskType = 
  | 'PENGURANGAN_JUMLAH_OBAT'     // Modus #18: Resep dikurangi di apotek faskes
  | 'TINDAKAN_TIDAK_DILAKUKAN'     // Modus #14: Tindakan medis ditagihkan tapi tidak dikerjakan
  | 'PROLONGED_LOS'               // Modus #12: Penggelembungan hari rawat inap (LOS)
  | 'IUR_BIAYA_ILEGAL'            // Peserta menyebut ditarik biaya tunai tambahan
  | 'KUNJUNGAN_FIKTIF'            // Phantom Billing: Kontrol fiktif tanpa kehadiran fisik pasien
  | 'READMISI_MANIPULATIF'        // Churning: Dipulangkan prematur lalu readmisi sengaja <30 hari
  | 'UPCODING_DIAGNOSIS'          // Upcoding: Penggelembungan diagnosis untuk tarif INA-CBGs tertinggi
  | 'TIDAK_DAPAT_DITENTUKAN';

export type ReliabilityFlag = 'HIGH' | 'MEDIUM' | 'LOW';

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type InformationSufficiency = 'SUFFICIENT' | 'PARTIAL' | 'INSUFFICIENT';

export type VerificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type VerificationStatus = 
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_DRAFTED'
  | 'CLOSED_NO_ACTION'
  | 'ESCALATED_FOR_OFFICIAL_PROCESS';

export type SourceChannel = 
  | 'MOBILE_JKN_SIMULATED'
  | 'CADAS_SIMULATED'
  | 'KADER_PENDAMPING'
  | 'SIMULATED_FORM';

export interface AuditLogEntry {
  timestamp: string;
  user_role: string;
  action: string;
  note: string;
}

export interface PatientEvidence {
  medication?: string | null;
  prescribed_quantity?: number | null;
  received_quantity?: number | null;
  procedure?: string | null;
  stated_procedure_performed?: boolean | null;
  length_of_stay_days?: number | null;
  service_date?: string | null;
  out_of_pocket_fee?: number | null;
  actual_visits_count?: number | null;
  readmission_interval_days?: number | null;
  stated_by_patient: string[];
}

export interface ClaimEvidence {
  claim_key?: string;
  facility_id?: string | null;
  facility_name?: string | null;
  medication?: string | null;
  claimed_quantity?: number | null;
  procedure?: string | null;
  claimed_procedure_code?: string | null;
  length_of_stay_days?: number | null;
  service_date?: string | null;
  claimed_amount?: number | null;
  total_claim_amount?: number | null;
  billed_visits_count?: number | null;
  diagnosis_claimed?: string | null;
}

export interface ReconciliationResult {
  finding: string;
  matched_fields: string[];
  different_fields: string[];
  computed_difference?: number | null;
  difference_unit?: string | null;
  reconciliation_notes?: string;
}

export interface TriageResult {
  case_id: string;
  status: TriageStatus;
  risk_type: RiskType;
  source_channel: SourceChannel;
  claim_key: string;
  patient_evidence: PatientEvidence;
  claim_evidence: ClaimEvidence;
  reconciliation: ReconciliationResult;
  alternative_explanations: string[];
  reliability_flag: ReliabilityFlag;
  reliability_notes: string[];
  evidence_confidence: EvidenceConfidence;
  information_sufficiency: InformationSufficiency;
  verification_priority: VerificationPriority;
  recommended_verification: string[];
  fraud_determination: 'NOT_DETERMINED';
  ai_interpretation: string;
  /** Kutipan dari cerita peserta yang menjadi dasar penilaian (sudah diperiksa kode: hanya yang benar-benar ada di cerita). */
  evidence_quotes?: { quote: string; supports: string }[];
  processing_source?: string;
}

export interface FacilityResponse {
  reason: string;
  note: string;
  at: string;
}

export interface CaseRecord extends TriageResult {
  facility_id: string;
  facility_name: string;
  service_date: string;
  input_by: 'PESERTA_MANDIRI' | 'KADER_PENDAMPING';
  input_type: 'TEXT' | 'VOICE_TRANSCRIPT';
  patient_statement: string;
  visual_evidence?: {
    uploaded: boolean;
    file_name: string;
    ocr_extracted_text?: string;
    ocr_confidence?: string;
  };
  /** Penanda pelapor (anonim). Beberapa laporan dari pelapor yang sama dihitung satu sinyal. */
  reporter_id?: string;
  verification_status: VerificationStatus;
  /** Jawaban faskes atas permintaan konfirmasi (simulasi). */
  facility_response?: FacilityResponse;
  audit_log: AuditLogEntry[];
  created_at: string;
}

export interface FacilityPattern {
  facility_id: string;
  facility_name: string;
  risk_type: RiskType;
  signal_count: number;
  total_reports: number;
  attention_level: 'TINGGI' | 'SEDANG' | 'RENDAH';
  pattern_summary: string;
  case_ids: string[];
  last_occurrence_date?: string;
  last_signal_date?: string;
  window_days?: number;
}

export interface Facility {
  facility_id: string;
  facility_name: string;
  facility_type: 'RSUD_KELAS_A' | 'RSUD_KELAS_B' | 'RS_SWASTA' | 'KLINIK_PRATAMA' | 'PUSKESMAS';
  city: string;
  province: string;
  total_active_reports?: number;
}

export interface DummyClaim {
  claim_key: string;
  sep_number: string;
  facility_id: string;
  facility_name: string;
  patient_name: string;
  patient_bpjs_id: string;
  service_date: string;
  scenario: 'OBAT' | 'TINDAKAN' | 'LOS' | 'IUR_BIAYA' | 'KUNJUNGAN_FIKTIF' | 'READMISI' | 'UPCODING' | 'UMUM';
  medication_name?: string;
  claimed_quantity?: number;
  procedure_name?: string;
  procedure_code?: string;
  length_of_stay_days?: number;
  billed_visits_count?: number;
  diagnosis_primary: string;
  diagnosis_code: string;
  claim_amount: number;
}

export interface EvalCase {
  id: string;
  name?: string;
  scenario?: string;
  claim_key?: string;
  dummy_claim_key?: string;
  patient_story: string;
  expected_status?: TriageStatus | string;
  expected_risk_type?: RiskType | string;
  expected_priority?: VerificationPriority | string;
  description?: string;
  category?: string;
  notes?: string;
}
