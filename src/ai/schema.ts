/**
 * MATA HATI - JSON Response Schema Definition
 */

export const MATA_HATI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["CONSISTENT", "INSUFFICIENT_EVIDENCE", "POTENTIAL_DISCREPANCY", "RISK_SIGNAL"]
    },
    risk_type: {
      type: "string",
      enum: ["PENGURANGAN_JUMLAH_OBAT", "TINDAKAN_TIDAK_DILAKUKAN", "PROLONGED_LOS", "TIDAK_DAPAT_DITENTUKAN"]
    },
    patient_evidence: {
      type: "object",
      properties: {
        medication: { type: "string" },
        prescribed_quantity: { type: "number" },
        received_quantity: { type: "number" },
        procedure: { type: "string" },
        stated_procedure_performed: { type: "boolean" },
        length_of_stay_days: { type: "number" },
        service_date: { type: "string" },
        stated_by_patient: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["stated_by_patient"]
    },
    claim_evidence: {
      type: "object",
      properties: {
        medication: { type: "string" },
        claimed_quantity: { type: "number" },
        procedure: { type: "string" },
        length_of_stay_days: { type: "number" },
        service_date: { type: "string" }
      }
    },
    reconciliation: {
      type: "object",
      properties: {
        finding: { type: "string" },
        matched_fields: { type: "array", items: { type: "string" } },
        different_fields: { type: "array", items: { type: "string" } },
        computed_difference: { type: "number" },
        difference_unit: { type: "string" },
        reconciliation_notes: { type: "string" }
      },
      required: ["finding", "matched_fields", "different_fields"]
    },
    alternative_explanations: {
      type: "array",
      items: { type: "string" }
    },
    reliability_flag: {
      type: "string",
      enum: ["HIGH", "MEDIUM", "LOW"]
    },
    reliability_notes: {
      type: "array",
      items: { type: "string" }
    },
    evidence_confidence: {
      type: "string",
      enum: ["HIGH", "MEDIUM", "LOW"]
    },
    information_sufficiency: {
      type: "string",
      enum: ["SUFFICIENT", "PARTIAL", "INSUFFICIENT"]
    },
    verification_priority: {
      type: "string",
      enum: ["HIGH", "MEDIUM", "LOW"]
    },
    recommended_verification: {
      type: "array",
      items: { type: "string" }
    },
    fraud_determination: {
      type: "string",
      enum: ["NOT_DETERMINED"]
    },
    ai_interpretation: {
      type: "string"
    }
  },
  required: [
    "status",
    "risk_type",
    "patient_evidence",
    "reconciliation",
    "alternative_explanations",
    "reliability_flag",
    "reliability_notes",
    "evidence_confidence",
    "information_sufficiency",
    "verification_priority",
    "recommended_verification",
    "fraud_determination",
    "ai_interpretation"
  ]
};
