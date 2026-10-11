/**
 * MATA HATI - Facility Pattern Aggregation Service
 * Source of Truth: PRD Bagian 12 (Agregasi Pola per Faskes)
 * Value proposition: Single signal is weak, repeated pattern is strong early warning.
 */

import { CaseRecord, Facility, FacilityPattern, RiskType } from '../types/matahati';

/** Ambang perhatian: jumlah PELAPOR BERBEDA dengan sinyal serupa pada satu faskes dalam jendela waktu. */
export const ATTENTION_THRESHOLDS = { TINGGI: 3, SEDANG: 2 } as const;
export const ATTENTION_WINDOW_DAYS = 30;

export function computeFacilityPatterns(
  cases: CaseRecord[],
  facilities: Facility[],
  windowDays: number = ATTENTION_WINDOW_DAYS,
  referenceDate?: string
): FacilityPattern[] {
  const patterns: FacilityPattern[] = [];

  // Group cases by facility_id and risk_type
  const groupMap = new Map<string, {
    facility_id: string;
    facility_name: string;
    risk_type: RiskType;
    signalCases: CaseRecord[];
    totalCasesForFacility: number;
    lastDate: string;
  }>();

  // Pre-calculate total reports per facility
  const totalPerFacility = new Map<string, number>();
  cases.forEach(c => {
    totalPerFacility.set(c.facility_id, (totalPerFacility.get(c.facility_id) || 0) + 1);
  });

  // Jendela waktu dihitung mundur dari tanggal acuan (default: layanan terbaru pada data).
  const ref = referenceDate || cases.map(c => c.service_date).filter(Boolean).sort().pop();
  const cutoff = ref ? new Date(new Date(ref).getTime() - windowDays * 86400000).toISOString().slice(0, 10) : '';
  const seenReporters = new Set<string>();

  cases.forEach(c => {
    if (cutoff && c.service_date && c.service_date <= cutoff) return;
    // Only count RISK_SIGNAL or POTENTIAL_DISCREPANCY with reliability != LOW
    const isSignal = (c.status === 'RISK_SIGNAL' || c.status === 'POTENTIAL_DISCREPANCY') && c.reliability_flag !== 'LOW';
    if (!isSignal || c.risk_type === 'TIDAK_DAPAT_DITENTUKAN') return;

    const key = `${c.facility_id}___${c.risk_type}`;
    const reporterKey = `${key}___${c.reporter_id || c.case_id}`;
    if (seenReporters.has(reporterKey)) return; // pelapor sama = satu sinyal
    seenReporters.add(reporterKey);
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        facility_id: c.facility_id,
        facility_name: c.facility_name,
        risk_type: c.risk_type,
        signalCases: [],
        totalCasesForFacility: totalPerFacility.get(c.facility_id) || 1,
        lastDate: c.service_date
      });
    }

    const group = groupMap.get(key)!;
    group.signalCases.push(c);
    if (c.service_date > group.lastDate) {
      group.lastDate = c.service_date;
    }
  });

  groupMap.forEach(group => {
    const signalCount = group.signalCases.length;
    let attentionLevel: 'TINGGI' | 'SEDANG' | 'RENDAH' = 'RENDAH';

    if (signalCount >= ATTENTION_THRESHOLDS.TINGGI) {
      attentionLevel = 'TINGGI';
    } else if (signalCount >= ATTENTION_THRESHOLDS.SEDANG) {
      attentionLevel = 'SEDANG';
    } else {
      attentionLevel = 'RENDAH';
    }

    let patternSummary = '';
    if (group.risk_type === 'PENGURANGAN_JUMLAH_OBAT') {
      patternSummary = `${signalCount} pelapor berbeda menyatakan jumlah obat yang diterima lebih sedikit dari yang tercatat, dalam ${windowDays} hari terakhir.`;
    } else if (group.risk_type === 'TINDAKAN_TIDAK_DILAKUKAN') {
      patternSummary = `${signalCount} pelapor berbeda menyatakan tindakan yang tercatat tidak mereka alami, dalam ${windowDays} hari terakhir.`;
    } else if (group.risk_type === 'PROLONGED_LOS') {
      patternSummary = `${signalCount} pelapor berbeda menyatakan lama rawat berbeda dari yang tercatat, dalam ${windowDays} hari terakhir.`;
    }

    patterns.push({
      facility_id: group.facility_id,
      facility_name: group.facility_name,
      risk_type: group.risk_type,
      window_days: windowDays,
      signal_count: signalCount,
      total_reports: group.totalCasesForFacility,
      attention_level: attentionLevel,
      case_ids: group.signalCases.map(c => c.case_id),
      last_signal_date: group.lastDate,
      pattern_summary: patternSummary
    });
  });

  // Sort by attention level priority (TINGGI -> SEDANG -> RENDAH)
  const priorityOrder = { TINGGI: 3, SEDANG: 2, RENDAH: 1 };
  patterns.sort((a, b) => priorityOrder[b.attention_level] - priorityOrder[a.attention_level]);

  return patterns;
}
