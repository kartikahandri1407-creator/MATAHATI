import React, { useState } from 'react';
import { DummyClaim, Facility } from '../types/matahati';
import { Collection } from '../data/store';
import { EMPTY_CLAIM, FACILITY_TYPE_LABEL, SCENARIO_LABEL, Scenario, claimSummary } from '../data/claimUtils';
import { Download, Pencil, Plus, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import { fmtTanggal } from '../data/format';
import { PageHeader } from './PageHeader';
import { CSV_TEMPLATE, ImportResult, importClaimsCsv } from '../data/csvImport';

interface Props {
  facilities: Collection<Facility>;
  claims: Collection<DummyClaim>;
}

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-emerald-700 focus:outline-hidden';
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block text-xs font-semibold text-slate-700 space-y-1"><span>{label}</span>{children}</label>
);

export const DataMaster: React.FC<Props> = ({ facilities, claims }) => {
  const [tab, setTab] = useState<'facilities' | 'claims'>('claims');
  const [facForm, setFacForm] = useState<{ item: Facility; isNew: boolean } | null>(null);
  const [claimForm, setClaimForm] = useState<{ item: DummyClaim; isNew: boolean } | null>(null);
  const [confirm, setConfirm] = useState<{ text: string; run: () => void } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [imp, setImp] = useState<{ name: string; res: ImportResult } | null>(null);

  const onCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (f.size > 2_000_000) return setImp({ name: f.name, res: { claims: [], newFacilities: [], errors: ['Berkas terlalu besar (maksimal 2 MB).'], ignoredColumns: [], unknownColumns: [] } });
    setImp({ name: f.name, res: importClaimsCsv(await f.text(), claims.items, facilities.items) });
  };
  const downloadTemplate = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' }));
    a.download = 'templat-klaim-mata-hati.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  const runImport = async () => {
    if (!imp) return;
    if (imp.res.newFacilities.length) await facilities.addMany(imp.res.newFacilities);
    await claims.addMany(imp.res.claims);
    setImp(null); setTab('claims');
  };

  const col = tab === 'facilities' ? facilities : claims;
  const nextId = (prefix: string, existing: string[]) => {
    let n = existing.length + 1;
    while (existing.includes(`${prefix}${String(n).padStart(4, '0')}`)) n++;
    return `${prefix}${String(n).padStart(4, '0')}`;
  };

  const saveFacility = async () => {
    const f = facForm!.item;
    if (!f.facility_name.trim()) return setFormError('Nama faskes wajib diisi.');
    if (facForm!.isNew && facilities.items.some(x => x.facility_id === f.facility_id)) return setFormError('ID faskes sudah dipakai.');
    setFormError(null);
    await (facForm!.isNew ? facilities.add(f) : facilities.update(f));
    // nama faskes di klaim yang terkait ikut diperbarui
    if (!facForm!.isNew) for (const c of claims.items.filter(c => c.facility_id === f.facility_id && c.facility_name !== f.facility_name)) await claims.update({ ...c, facility_name: f.facility_name });
    setFacForm(null);
  };

  const saveClaim = async () => {
    const c = claimForm!.item;
    if (!c.facility_id) return setFormError('Pilih faskes.');
    if (!c.service_date) return setFormError('Tanggal layanan wajib diisi.');
    if (claimForm!.isNew && claims.items.some(x => x.claim_key === c.claim_key)) return setFormError('Nomor klaim sudah dipakai.');
    for (const k of ['claimed_quantity', 'length_of_stay_days', 'billed_visits_count', 'claim_amount'] as const) {
      const v = c[k]; if (v !== undefined && (!Number.isFinite(v) || v < 0 || v > 1_000_000_000)) return setFormError('Angka tidak valid.');
    }
    setFormError(null);
    const fac = facilities.items.find(f => f.facility_id === c.facility_id);
    const clean: DummyClaim = { ...c, facility_name: fac?.facility_name || c.facility_name };
    await (claimForm!.isNew ? claims.add(clean) : claims.update(clean));
    setClaimForm(null);
  };

  const num = (v: string): number | undefined => (v === '' ? undefined : Number(v));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader eyebrow="Pengelola" title="Data Klaim" text="Catatan klaim dan faskes yang menjadi pembanding jawaban peserta. Di produksi, halaman ini menjadi titik hubung ke sistem klaim BPJS Kesehatan; di prototipe, di sinilah data fiktif dimasukkan, diubah, atau diimpor lewat CSV." />
      <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600 leading-relaxed">Hanya Pengelola yang membuka halaman ini. Impor CSV membuang kolom identitas peserta secara otomatis, dan semua isian di sini fiktif. Perubahan tersimpan otomatis dan terlihat oleh semua peran.</div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['claims', 'facilities'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setTab(t); setFormError(null); }} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${tab === t ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}>
              {t === 'claims' ? `Klaim (${claims.items.length})` : `Faskes (${facilities.items.length})`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === 'claims' && (<>
            <label className="px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-semibold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"><Upload className="w-4 h-4" />Impor CSV<input type="file" accept=".csv,text/csv" onChange={onCsv} className="hidden" /></label>
            <button type="button" onClick={downloadTemplate} className="px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-semibold flex items-center gap-1.5 hover:bg-slate-50"><Download className="w-4 h-4" />Templat</button>
          </>)}
          <button type="button" onClick={() => { setFormError(null); tab === 'facilities'
            ? setFacForm({ isNew: true, item: { facility_id: nextId('FK-', facilities.items.map(f => f.facility_id)), facility_name: '', facility_type: 'RS_SWASTA', city: '', province: '' } })
            : setClaimForm({ isNew: true, item: { ...EMPTY_CLAIM(facilities.items[0]?.facility_id, facilities.items[0]?.facility_name), claim_key: nextId('CLM-', claims.items.map(c => c.claim_key)), sep_number: `SEP-${new Date().getFullYear()}-${String(claims.items.length + 1).padStart(4, '0')}` } }); }}
            className="px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-emerald-800"><Plus className="w-4 h-4" />Tambah</button>
          <button type="button" onClick={() => setConfirm({ text: 'Kembalikan data ke contoh awal? Perubahan Anda pada daftar ini akan hilang.', run: () => col.reset() })} className="px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-semibold flex items-center gap-1.5 hover:bg-slate-50"><RotateCcw className="w-4 h-4" />Kembalikan contoh</button>
          <button type="button" onClick={() => setConfirm({ text: 'Hapus semua data di daftar ini?', run: () => col.clear() })} className="px-3.5 py-2 rounded-lg border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-50">Kosongkan</button>
        </div>
      </div>

      {col.error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800" role="alert">{col.error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        {tab === 'claims' ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 text-left"><tr><th className="p-3">No. SEP</th><th className="p-3">Faskes</th><th className="p-3">Tanggal</th><th className="p-3">Jenis</th><th className="p-3">Tercatat</th><th className="p-3 w-24" /></tr></thead>
            <tbody>
              {claims.items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Belum ada klaim. Klik Tambah.</td></tr>}
              {claims.items.map(c => (
                <tr key={c.claim_key} className="border-t border-slate-100">
                  <td className="p-3 font-mono text-xs">{c.sep_number}</td><td className="p-3">{c.facility_name}</td><td className="p-3 whitespace-nowrap">{fmtTanggal(c.service_date)}</td>
                  <td className="p-3">{SCENARIO_LABEL[c.scenario]}</td><td className="p-3 text-slate-600">{claimSummary(c)}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button type="button" aria-label="Ubah" onClick={() => { setFormError(null); setClaimForm({ isNew: false, item: { ...c } }); }} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                    <button type="button" aria-label="Hapus" onClick={() => setConfirm({ text: `Hapus klaim ${c.sep_number}?`, run: () => claims.remove(c.claim_key) })} className="p-1.5 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 text-left"><tr><th className="p-3">ID</th><th className="p-3">Nama</th><th className="p-3">Jenis</th><th className="p-3">Kota</th><th className="p-3">Klaim</th><th className="p-3 w-24" /></tr></thead>
            <tbody>
              {facilities.items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Belum ada faskes. Klik Tambah.</td></tr>}
              {facilities.items.map(f => (
                <tr key={f.facility_id} className="border-t border-slate-100">
                  <td className="p-3 font-mono text-xs">{f.facility_id}</td><td className="p-3 font-medium">{f.facility_name}</td>
                  <td className="p-3">{FACILITY_TYPE_LABEL[f.facility_type] || f.facility_type}</td><td className="p-3">{[f.city, f.province].filter(Boolean).join(', ')}</td>
                  <td className="p-3">{claims.items.filter(c => c.facility_id === f.facility_id).length}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button type="button" aria-label="Ubah" onClick={() => { setFormError(null); setFacForm({ isNew: false, item: { ...f } }); }} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                    <button type="button" aria-label="Hapus" onClick={() => setConfirm({ text: `Hapus faskes ${f.facility_name}? Klaim yang terkait tidak ikut terhapus.`, run: () => facilities.remove(f.facility_id) })} className="p-1.5 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form faskes */}
      {facForm && (
        <Modal title={facForm.isNew ? 'Tambah faskes' : 'Ubah faskes'} onClose={() => setFacForm(null)} onSave={saveFacility} error={formError}>
          <Field label="ID"><input className={inputCls} value={facForm.item.facility_id} disabled={!facForm.isNew} onChange={e => setFacForm({ ...facForm, item: { ...facForm.item, facility_id: e.target.value.replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 40) } })} /></Field>
          <Field label="Nama faskes"><input className={inputCls} maxLength={120} value={facForm.item.facility_name} onChange={e => setFacForm({ ...facForm, item: { ...facForm.item, facility_name: e.target.value } })} /></Field>
          <Field label="Jenis"><select className={inputCls} value={facForm.item.facility_type} onChange={e => setFacForm({ ...facForm, item: { ...facForm.item, facility_type: e.target.value as Facility['facility_type'] } })}>{Object.entries(FACILITY_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kota"><input className={inputCls} maxLength={80} value={facForm.item.city} onChange={e => setFacForm({ ...facForm, item: { ...facForm.item, city: e.target.value } })} /></Field>
            <Field label="Provinsi"><input className={inputCls} maxLength={80} value={facForm.item.province} onChange={e => setFacForm({ ...facForm, item: { ...facForm.item, province: e.target.value } })} /></Field>
          </div>
        </Modal>
      )}

      {/* Form klaim */}
      {claimForm && (
        <Modal title={claimForm.isNew ? 'Tambah klaim' : 'Ubah klaim'} onClose={() => setClaimForm(null)} onSave={saveClaim} error={formError}>
          {(() => {
            const c = claimForm.item;
            const set = (p: Partial<DummyClaim>) => setClaimForm({ ...claimForm, item: { ...c, ...p } });
            return (<>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nomor klaim (ID)"><input className={inputCls} disabled={!claimForm.isNew} value={c.claim_key} onChange={e => set({ claim_key: e.target.value.replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 40) })} /></Field>
                <Field label="No. SEP"><input className={inputCls} maxLength={40} value={c.sep_number} onChange={e => set({ sep_number: e.target.value })} /></Field>
              </div>
              <Field label="Faskes">
                <select className={inputCls} value={c.facility_id} onChange={e => set({ facility_id: e.target.value, facility_name: facilities.items.find(f => f.facility_id === e.target.value)?.facility_name || '' })}>
                  {facilities.items.length === 0 && <option value="">(tambah faskes dulu)</option>}
                  {facilities.items.map(f => <option key={f.facility_id} value={f.facility_id}>{f.facility_name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tanggal layanan"><input type="date" className={inputCls} value={c.service_date} onChange={e => set({ service_date: e.target.value })} /></Field>
                <Field label="Jenis layanan"><select className={inputCls} value={c.scenario} onChange={e => set({ scenario: e.target.value as Scenario })}>{Object.entries(SCENARIO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
              </div>
              {c.scenario === 'OBAT' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2"><Field label="Nama obat"><input className={inputCls} maxLength={120} value={c.medication_name || ''} onChange={e => set({ medication_name: e.target.value })} /></Field></div>
                  <Field label="Jumlah tercatat"><input type="number" min={0} className={inputCls} value={c.claimed_quantity ?? ''} onChange={e => set({ claimed_quantity: num(e.target.value) })} /></Field>
                </div>
              )}
              {c.scenario === 'TINDAKAN' && <Field label="Nama tindakan"><input className={inputCls} maxLength={120} value={c.procedure_name || ''} onChange={e => set({ procedure_name: e.target.value })} /></Field>}
              {c.scenario === 'LOS' && <Field label="Lama rawat tercatat (hari)"><input type="number" min={0} className={inputCls} value={c.length_of_stay_days ?? ''} onChange={e => set({ length_of_stay_days: num(e.target.value) })} /></Field>}
              {c.scenario === 'KUNJUNGAN_FIKTIF' && <Field label="Jumlah kunjungan tercatat"><input type="number" min={0} className={inputCls} value={c.billed_visits_count ?? ''} onChange={e => set({ billed_visits_count: num(e.target.value) })} /></Field>}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Field label="Diagnosis"><input className={inputCls} maxLength={120} value={c.diagnosis_primary} onChange={e => set({ diagnosis_primary: e.target.value })} /></Field></div>
                <Field label="Kode"><input className={inputCls} maxLength={12} value={c.diagnosis_code} onChange={e => set({ diagnosis_code: e.target.value })} /></Field>
              </div>
              <Field label="Nilai klaim (Rp)"><input type="number" min={0} className={inputCls} value={c.claim_amount} onChange={e => set({ claim_amount: Number(e.target.value) || 0 })} /></Field>
            </>);
          })()}
        </Modal>
      )}

      {imp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3 shadow-xl">
            <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">Impor data klaim</h3><button type="button" aria-label="Tutup" onClick={() => setImp(null)} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
            <p className="text-xs text-slate-500 font-mono break-all">{imp.name}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-50 p-3"><div className="text-2xl font-extrabold text-emerald-800">{imp.res.claims.length}</div><div className="text-xs text-slate-600">klaim siap masuk</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-2xl font-extrabold text-slate-800">{imp.res.newFacilities.length}</div><div className="text-xs text-slate-600">faskes baru</div></div>
              <div className="rounded-lg bg-rose-50 p-3"><div className="text-2xl font-extrabold text-rose-700">{imp.res.errors.length}</div><div className="text-xs text-slate-600">baris ditolak</div></div>
            </div>
            {imp.res.ignoredColumns.length > 0 && <p className="text-sm text-emerald-800 bg-emerald-50 rounded-lg p-3">Kolom identitas tidak dibaca dan tidak disimpan: <b>{imp.res.ignoredColumns.join(', ')}</b>. Semua klaim masuk sebagai anonim.</p>}
            {imp.res.unknownColumns.length > 0 && <p className="text-xs text-slate-500">Kolom tidak dikenali (dilewati): {imp.res.unknownColumns.join(', ')}</p>}
            {imp.res.errors.length > 0 && <ul className="text-sm text-rose-800 list-disc pl-5 space-y-0.5 max-h-40 overflow-y-auto">{imp.res.errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}{imp.res.errors.length > 20 && <li>dan {imp.res.errors.length - 20} lainnya</li>}</ul>}
            <p className="text-xs text-slate-500">Gunakan hanya data fiktif atau yang sudah dianonimkan dan diizinkan tertulis.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setImp(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm">Batal</button>
              <button type="button" disabled={imp.res.claims.length === 0} onClick={runImport} className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">Masukkan {imp.res.claims.length} klaim</button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <p className="text-sm text-slate-800">{confirm.text}</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm">Batal</button>
              <button type="button" onClick={() => { const r = confirm.run; setConfirm(null); r(); }} className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold">Ya, lanjutkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; onSave: () => void; error: string | null; children: React.ReactNode }> = ({ title, onClose, onSave, error, children }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
    <div className="bg-white rounded-xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3 shadow-xl">
      <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">{title}</h3><button type="button" aria-label="Tutup" onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
      {children}
      {error && <div className="text-sm text-rose-700" role="alert">{error}</div>}
      <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-sm">Batal</button><button type="button" onClick={onSave} className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold">Simpan</button></div>
    </div>
  </div>
);
