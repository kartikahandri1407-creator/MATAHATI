import React, { useMemo, useState } from 'react';

function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const Slider: React.FC<{ label: string; v: number; set: (n: number) => void; min: number; max: number; step?: number; unit?: string }> = ({ label, v, set, min, max, step = 1, unit = '%' }) => (
  <label className="block text-sm"><div className="flex justify-between font-semibold text-slate-700"><span>{label}</span><span className="font-mono">{v}{unit}</span></div>
    <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="w-full accent-emerald-700" /></label>
);

export const SimulasiSkala: React.FC = () => {
  const [resp, setResp] = useState(15);
  const [badFac, setBadFac] = useState(10);
  const [badClaim, setBadClaim] = useState(8);
  const [falseRep, setFalseRep] = useState(1.5);
  const N = 400, FAC = 300, RECALL = 0.85;

  const res = useMemo(() => {
    const rnd = rng(2026);
    const ks = [1, 2, 3];
    const hit = [0, 0, 0], fa = [0, 0, 0]; let bad = 0, good = 0, reports = 0;
    for (let f = 0; f < FAC; f++) {
      const isBad = rnd() < badFac / 100; isBad ? bad++ : good++;
      let flagged = 0;
      for (let i = 0; i < N; i++) {
        if (rnd() >= resp / 100) continue;
        const real = isBad && rnd() < badClaim / 100;
        if ((real && rnd() < RECALL) || rnd() < falseRep / 100) flagged++;
      }
      reports += flagged;
      ks.forEach((k, j) => { if (flagged >= k) isBad ? hit[j]++ : fa[j]++; });
    }
    return { rows: ks.map((k, j) => ({ k, det: bad ? Math.round(100 * hit[j] / bad) : 0, fa: good ? Math.round(100 * fa[j] / good) : 0 })), reports, bad, good };
  }, [resp, badFac, badClaim, falseRep]);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 space-y-5">
      <div className="hero rounded-3xl p-6 text-white space-y-2">
        <div className="text-xs font-bold uppercase tracking-[.18em] text-matahari">Simulasi skala · asumsi bisa diubah</div>
        <h3 className="text-2xl font-extrabold leading-tight">Mengapa butuh 3 pelapor berbeda?</h3>
        <p className="text-white/80 text-sm">{FAC} faskes, {N} layanan per faskes per bulan. Laporan keliru atau iseng tetap ada, tapi jarang menumpuk pada faskes yang sama.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 bg-white rounded-2xl border border-slate-200 p-5">
        <Slider label="Peserta yang menjawab" v={resp} set={setResp} min={2} max={40} />
        <Slider label="Faskes bermasalah" v={badFac} set={setBadFac} min={1} max={30} />
        <Slider label="Layanan bermasalah di faskes itu" v={badClaim} set={setBadClaim} min={1} max={30} />
        <Slider label="Laporan keliru atau iseng" v={falseRep} set={setFalseRep} min={0} max={5} step={0.5} />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="text-left p-3">Faskes ditandai bila pelapor berbeda ≥</th><th className="p-3">Faskes bermasalah terdeteksi</th><th className="p-3">Faskes baik salah ditandai</th></tr></thead>
          <tbody>{res.rows.map(r => (
            <tr key={r.k} className={`border-t border-slate-100 ${r.k === 3 ? 'bg-emerald-50 font-bold' : ''}`}><td className="p-3">{r.k} pelapor{r.k === 3 ? ' (perhatian tinggi)' : r.k === 2 ? ' (perhatian sedang)' : ''}</td><td className="p-3 text-center font-mono">{r.det}%</td><td className="p-3 text-center font-mono">{r.fa}%</td></tr>))}</tbody></table>
      </div>
      <p className="text-sm text-slate-600">Dari {res.bad} faskes bermasalah dan {res.good} faskes baik, terkumpul {res.reports.toLocaleString('id-ID')} laporan berbeda per bulan. Dengan ambang 3 pelapor, faskes baik yang salah ditandai turun dari {res.rows[0].fa}% menjadi {res.rows[2].fa}%, dengan harga deteksi turun dari {res.rows[0].det}% menjadi {res.rows[2].det}%. Ambang 2 pelapor adalah jalan tengah; makin banyak peserta menjawab, deteksi naik tanpa menambah salah tandai.</p>
      <p className="text-xs text-slate-500">Ini simulasi dengan asumsi yang Anda atur, bukan hasil dari data nyata. Pengingat jawaban peserta diasumsikan {Math.round(RECALL * 100)}% akurat. Angka sebenarnya baru bisa diukur lewat uji coba terbatas.</p>
    </section>
  );
};
