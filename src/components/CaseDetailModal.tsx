import React, { useEffect, useState } from 'react';
import { Timeline } from './Timeline';
import { caseTimeline } from '../data/stage';
import { fmtWaktu } from '../data/format';
import { CaseRecord, VerificationStatus, FacilityPattern } from '../types/matahati';
import { PriorityScore } from '../services/priorityScore';
import { PriorityBreakdown } from './PriorityBreakdown';
import { HighlightedStory } from './HighlightedStory';
import { 
  X, 
  FileText, 
  History, 
  FileCheck,
  Edit3,
  Check,
  RotateCcw
} from 'lucide-react';

interface CaseDetailModalProps {
  caseRecord: CaseRecord;
  facilityPattern?: FacilityPattern;
  score?: PriorityScore;
  onClose: () => void;
  onUpdateStatus: (updatedCase: CaseRecord) => void;
  onOpenDraftModal: (caseRecord: CaseRecord) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseRecord,
  facilityPattern,
  score,
  onClose,
  onUpdateStatus,
  onOpenDraftModal
}) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus>(caseRecord.verification_status);
  const [userRole, setUserRole] = useState('Petugas Verifikator Cabang');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit Mode state
  const [isEditingData, setIsEditingData] = useState(false);
  const [editedPatientStatement, setEditedPatientStatement] = useState(caseRecord.patient_statement);
  const [editedReceivedQty, setEditedReceivedQty] = useState<number | undefined>(
    caseRecord.patient_evidence.received_quantity ?? undefined
  );
  const [editedLOSDays, setEditedLOSDays] = useState<number | undefined>(
    caseRecord.patient_evidence.length_of_stay_days ?? undefined
  );
  const [editedFacilityName, setEditedFacilityName] = useState(caseRecord.facility_name);

  const handleSaveStatusChange = () => {
    if (selectedStatus === caseRecord.verification_status && !statusNote) return;

    setIsUpdating(true);
    const updated: CaseRecord = {
      ...caseRecord,
      verification_status: selectedStatus,
      audit_log: [
        ...caseRecord.audit_log,
        {
          timestamp: new Date().toISOString(),
          user_role: userRole,
          action: `STATUS_${selectedStatus}`,
          note: statusNote.trim() || `Status verifikasi diperbarui menjadi ${selectedStatus}`
        }
      ]
    };

    setTimeout(() => {
      onUpdateStatus(updated);
      setIsUpdating(false);
      setStatusNote('');
    }, 250);
  };

  const handleSaveDataEdits = () => {
    const updated: CaseRecord = {
      ...caseRecord,
      facility_name: editedFacilityName.trim() || caseRecord.facility_name,
      patient_statement: editedPatientStatement.trim() || caseRecord.patient_statement,
      patient_evidence: {
        ...caseRecord.patient_evidence,
        received_quantity: editedReceivedQty,
        length_of_stay_days: editedLOSDays,
        stated_by_patient: [editedPatientStatement.trim()]
      },
      audit_log: [
        ...caseRecord.audit_log,
        {
          timestamp: new Date().toISOString(),
          user_role: userRole,
          action: 'DATA_KASUS_DIUBAH',
          note: 'Rincian data pengaduan diperbarui oleh verifikator.'
        }
      ]
    };

    onUpdateStatus(updated);
    setIsEditingData(false);
  };

  const getStatusLabel = (status: VerificationStatus) => {
    switch (status) {
      case 'NEW': return 'Baru Masuk';
      case 'UNDER_REVIEW': return 'Sedang Ditelaah';
      case 'CLARIFICATION_DRAFTED': return 'Draf Surat Siap';
      case 'CLOSED_NO_ACTION': return 'Selesai';
      case 'ESCALATED_FOR_OFFICIAL_PROCESS': return 'Eskalasi ke Verifikasi Lapangan';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex justify-end" onClick={onClose} role="dialog" aria-modal="true" aria-label="Lembar pemeriksaan">
      <div className="drawer bg-white shadow-2xl w-full max-w-3xl h-full overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Lembar Pemeriksaan Pengaduan</span>
              <span>·</span>
              <span className="font-mono font-bold text-slate-900">{caseRecord.case_id}</span>
              <span>·</span>
              <span className="font-mono">{caseRecord.claim_key}</span>
            </div>
            <div className="flex items-center gap-2">
              {isEditingData ? (
                <input
                  type="text"
                  value={editedFacilityName}
                  onChange={(e) => setEditedFacilityName(e.target.value)}
                  className="font-bold text-slate-900 text-base border border-slate-300 rounded px-2 py-0.5"
                />
              ) : (
                <h3 className="text-base font-bold text-slate-900">
                  {caseRecord.facility_name}
                </h3>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingData(!isEditingData)}
              className="px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingData ? 'Batal Edit' : 'Edit Rincian'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 bg-slate-50/50 flex-1">
          {score && <PriorityBreakdown score={score} />}

          {/* Edit Mode Alert */}
          {isEditingData && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center justify-between">
              <span>Mode Edit Aktif: Anda dapat menyunting pernyataan pasien atau data fisik yang diterima.</span>
              <button
                type="button"
                onClick={handleSaveDataEdits}
                className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan Perubahan
              </button>
            </div>
          )}

          {/* Grid A & B: Evidence Separation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section A: Bukti Pasien */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <div className="pb-2 border-b border-slate-100 font-bold text-slate-900 flex items-center justify-between">
                <span>Bukti Penuturan Pasien</span>
                <span className="text-[11px] font-normal text-slate-500">
                  {caseRecord.input_by === 'KADER_PENDAMPING' ? 'Pendamping / Kader' : 'Peserta Mandiri'}
                </span>
              </div>

              {isEditingData ? (
                <textarea
                  rows={4}
                  value={editedPatientStatement}
                  onChange={(e) => setEditedPatientStatement(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800"
                />
              ) : (
                <HighlightedStory story={caseRecord.patient_statement} quotes={caseRecord.evidence_quotes} evidence={caseRecord.patient_evidence} />
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                {caseRecord.patient_evidence.received_quantity !== undefined && caseRecord.patient_evidence.received_quantity !== null && (
                  <div>
                    <span className="text-slate-500 block">Obat Fisik Diterima:</span>
                    {isEditingData ? (
                      <input
                        type="number"
                        value={editedReceivedQty ?? ''}
                        onChange={(e) => setEditedReceivedQty(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-20 rounded border border-slate-300 p-1 text-xs"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">
                        {caseRecord.patient_evidence.received_quantity} item
                      </span>
                    )}
                  </div>
                )}
                {caseRecord.patient_evidence.length_of_stay_days !== undefined && caseRecord.patient_evidence.length_of_stay_days !== null && (
                  <div>
                    <span className="text-slate-500 block">Lama Rawat Fisik:</span>
                    {isEditingData ? (
                      <input
                        type="number"
                        value={editedLOSDays ?? ''}
                        onChange={(e) => setEditedLOSDays(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-20 rounded border border-slate-300 p-1 text-xs"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">
                        {caseRecord.patient_evidence.length_of_stay_days} hari
                      </span>
                    )}
                  </div>
                )}
                {caseRecord.patient_evidence.out_of_pocket_fee !== undefined && caseRecord.patient_evidence.out_of_pocket_fee !== null && (
                  <div>
                    <span className="text-slate-500 block">Iur Biaya Ditarik Kasir:</span>
                    <span className="font-bold text-rose-700">
                      Rp {caseRecord.patient_evidence.out_of_pocket_fee.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {caseRecord.patient_evidence.actual_visits_count !== undefined && caseRecord.patient_evidence.actual_visits_count !== null && (
                  <div>
                    <span className="text-slate-500 block">Kunjungan Riil Peserta:</span>
                    <span className="font-semibold text-slate-800">
                      {caseRecord.patient_evidence.actual_visits_count} kali hadir
                    </span>
                  </div>
                )}
                {caseRecord.patient_evidence.readmission_interval_days !== undefined && caseRecord.patient_evidence.readmission_interval_days !== null && (
                  <div>
                    <span className="text-slate-500 block">Interval Readmisi:</span>
                    <span className="font-semibold text-slate-800">
                      {caseRecord.patient_evidence.readmission_interval_days} hari
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section B: Data Klaim Faskes */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <div className="pb-2 border-b border-slate-100 font-bold text-slate-900 flex items-center justify-between">
                <span>Catatan Administrasi Klaim Faskes</span>
                <span className="font-mono text-[11px] text-slate-500">{caseRecord.claim_key}</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Tanggal Kunjungan:</span>
                  <span className="font-medium text-slate-800">{caseRecord.service_date}</span>
                </div>
                {caseRecord.claim_evidence.medication && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Resep Obat Klaim:</span>
                    <span className="font-medium text-slate-800">
                      {caseRecord.claim_evidence.medication} (Kuantitas Ditagihkan: {caseRecord.claim_evidence.claimed_quantity ?? 'N/A'})
                    </span>
                  </div>
                )}
                {caseRecord.claim_evidence.procedure && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Prosedur Medis:</span>
                    <span className="font-medium text-slate-800">{caseRecord.claim_evidence.procedure}</span>
                  </div>
                )}
                {caseRecord.claim_evidence.length_of_stay_days && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Durasi Rawat Inap Ditagihkan:</span>
                    <span className="font-medium text-slate-800">{caseRecord.claim_evidence.length_of_stay_days} hari</span>
                  </div>
                )}
                {caseRecord.claim_evidence.billed_visits_count && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Jumlah Kunjungan Ditagihkan:</span>
                    <span className="font-medium text-slate-800">{caseRecord.claim_evidence.billed_visits_count} kali kunjungan</span>
                  </div>
                )}
                {caseRecord.claim_evidence.claimed_amount && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Nilai Klaim Paket JKN:</span>
                    <span className="font-medium text-slate-800">Rp {caseRecord.claim_evidence.claimed_amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {caseRecord.claim_evidence.diagnosis_claimed && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Diagnosis Klaim:</span>
                    <span className="font-medium text-slate-800">{caseRecord.claim_evidence.diagnosis_claimed}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {caseRecord.facility_response && (
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg space-y-1" aria-label="Konfirmasi dari faskes">
              <h4 className="text-sm font-bold text-sky-900">Konfirmasi dari faskes</h4>
              <p className="text-sm text-sky-900"><b>{caseRecord.facility_response.reason}</b></p>
              {caseRecord.facility_response.note && <p className="text-sm text-sky-900">“{caseRecord.facility_response.note}”</p>}
              <p className="text-xs text-sky-700">Diterima {fmtWaktu(caseRecord.facility_response.at)}. Nilai jawaban ini, lalu tentukan tindak lanjut di bawah.</p>
            </div>
          )}

          {/* Section C: Hasil Rekonsiliasi & Aritmetika */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 pb-2 border-b border-slate-100">
              Hasil Rekonsiliasi Perbandingan Data
            </h4>
            <p className="leading-relaxed text-slate-800">
              {caseRecord.reconciliation.finding}
            </p>
            {caseRecord.reconciliation.computed_difference !== undefined && caseRecord.reconciliation.computed_difference !== null && (
              <div className="pt-1 text-slate-700">
                <span className="font-semibold text-slate-900">Selisih Terhitung: </span>
                <span className="font-mono font-bold text-rose-700">
                  {caseRecord.reconciliation.computed_difference} {caseRecord.reconciliation.difference_unit || ''}
                </span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 pt-1">
              {caseRecord.ai_interpretation}
            </p>
          </div>

          {/* Section D: Alternative Explanations */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Kemungkinan Penjelasan Alternatif yang Wajar</span>
              <span className="text-[11px] font-normal text-slate-400">Bukan kesimpulan</span>
            </h4>
            <ul className="space-y-1.5 pl-1">
              {caseRecord.alternative_explanations.map((alt, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-400">{idx + 1}.</span>
                  <span>{alt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section E: Rekomendasi Verifikasi */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 pb-2 border-b border-slate-100">
              Dokumen Pemeriksaan yang Dimohonkan ke Faskes
            </h4>
            <ul className="space-y-1 pl-1">
              {caseRecord.recommended_verification.map((rec, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section F: Tindakan Petugas & Jejak Audit */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900">
                Pembaruan Status Verifikasi & Jejak Audit
              </h4>
              <button
                type="button"
                onClick={() => onOpenDraftModal(caseRecord)}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buat Surat Klarifikasi</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Status Verifikasi:</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as VerificationStatus)}
                    className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800 font-medium"
                  >
                    <option value="NEW">Baru Masuk</option>
                    <option value="UNDER_REVIEW">Sedang Ditelaah Petugas</option>
                    <option value="CLARIFICATION_DRAFTED">Draf Klarifikasi Siap Dikirim</option>
                    <option value="CLOSED_NO_ACTION">Selesai Ditelaah (Tanpa Tindak Lanjut)</option>
                    <option value="ESCALATED_FOR_OFFICIAL_PROCESS">Diteruskan ke Pemeriksaan Lapangan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Nama / Jabatan Verifikator:</label>
                  <input
                    type="text"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Catatan hasil verifikasi atau catatan telaah dokumen..."
                  className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveStatusChange}
                  disabled={isUpdating}
                  className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Pembaruan Status'}
                </button>
              </div>
            </div>

            {/* Riwayat Audit */}
            <div className="pt-2">
              <span className="font-semibold text-slate-800 block mb-2">Jejak kasus (posisi laporan dari waktu ke waktu):</span>
              <Timeline events={caseTimeline(caseRecord, 'petugas')} showActor />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Kewenangan penetapan akhir berada pada proses audit resmi BPJS Kesehatan.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
