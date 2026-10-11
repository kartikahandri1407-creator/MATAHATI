import React, { useState } from 'react';
import { CaseRecord } from '../types/matahati';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  FileText, 
  Printer, 
  AlertCircle 
} from 'lucide-react';

interface DraftClarificationModalProps {
  caseRecord: CaseRecord;
  onClose: () => void;
  onSaveDraft: (updatedCase: CaseRecord) => void;
}

export const DraftClarificationModal: React.FC<DraftClarificationModalProps> = ({
  caseRecord,
  onClose,
  onSaveDraft
}) => {
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const defaultLetterNumber = `[NOMOR SURAT]`;

  const generateDraftText = () => {
    return `*** DRAF SIMULASI, BUKAN SURAT RESMI ***

[KOP SURAT INSTANSI]

Nomor       : ${defaultLetterNumber}
Perihal     : Permohonan konfirmasi data pelayanan
Kepada Yth. : Pimpinan ${caseRecord.facility_name}

Dengan hormat,

Kami memohon konfirmasi atas data pelayanan berikut. Permohonan ini hanya meminta penjelasan dan dokumen, bukan kesimpulan bahwa terjadi pelanggaran.

1. Identitas pelayanan
   - Nomor kasus  : ${caseRecord.case_id}
   - Tanggal      : ${caseRecord.service_date}
   - Nomor klaim  : ${caseRecord.claim_key}

2. Yang tercatat pada klaim
   - Layanan : ${caseRecord.claim_evidence.medication || caseRecord.claim_evidence.procedure || caseRecord.claim_evidence.diagnosis_claimed || 'Paket pelayanan JKN'}
   - Jumlah  : ${
       caseRecord.claim_evidence.claimed_quantity ? `${caseRecord.claim_evidence.claimed_quantity} item` :
       caseRecord.claim_evidence.length_of_stay_days ? `${caseRecord.claim_evidence.length_of_stay_days} hari rawat` :
       caseRecord.claim_evidence.billed_visits_count ? `${caseRecord.claim_evidence.billed_visits_count} kunjungan` : 'tidak tercatat'
     }

3. Perbedaan yang perlu dikonfirmasi
   ${caseRecord.reconciliation.finding}
   (Identitas dan kutipan cerita peserta sengaja tidak dicantumkan.)

4. Kemungkinan penjelasan lain
${caseRecord.alternative_explanations?.map((alt, idx) => `   ${idx + 1}. ${alt}`).join('\n') || '   -'}

5. Dokumen yang dimohonkan
${caseRecord.recommended_verification?.map(rec => `   - ${rec}`).join('\n') || '   - Catatan pelayanan dan bukti penyerahan'}

Mohon tanggapan tertulis dalam [JUMLAH] hari kerja.

Hormat kami,
[NAMA DAN JABATAN PETUGAS]`;
  };

  const [letterContent, setLetterContent] = useState(generateDraftText());

  const handleCopy = () => {
    navigator.clipboard.writeText(letterContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsDrafted = () => {
    const updated: CaseRecord = {
      ...caseRecord,
      verification_status: 'CLARIFICATION_DRAFTED',
      audit_log: [
        ...caseRecord.audit_log,
        {
          timestamp: new Date().toISOString(),
          user_role: 'Petugas Verifikator BPJS',
          action: 'DRAFT_CLARIFICATION_CREATED',
          note: `Draf simulasi surat konfirmasi dibuat.`
        }
      ]
    };
    onSaveDraft(updated);
    setIsSaved(true);
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">
              <span>Draf simulasi surat konfirmasi · </span>
              <span>·</span>
              <span className="font-mono font-bold text-slate-900">{caseRecord.case_id}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {caseRecord.facility_name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 text-xs text-slate-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>
            Ini hanya contoh draf. Nomor surat, kop, dan tanda tangan sengaja dikosongkan; petugas yang mengisi dan menyetujui.
          </span>
        </div>

        {/* Editor */}
        <div className="p-6 flex-1 overflow-y-auto">
          <textarea
            value={letterContent}
            onChange={(e) => setLetterContent(e.target.value)}
            rows={16}
            className="w-full rounded-lg border border-slate-300 p-4 font-mono text-xs leading-relaxed text-slate-800 focus:border-emerald-700 focus:outline-hidden"
          />
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleMarkAsDrafted}
            disabled={isSaved}
            className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Tersimpan' : 'Simpan Status Draf'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
