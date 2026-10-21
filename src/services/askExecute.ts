/**
 * MATA HATI - Tanya-jawab petugas: pelaksana rencana.
 * Semua angka dihitung di sini oleh PROGRAM, dari data kasus yang sudah ada di perangkat petugas.
 * Model AI tidak pernah menerima data kasus dan tidak pernah menghitung jawaban.
 */
import { CaseRecord, FacilityPattern } from '../types/matahati';
import { RISK_LABEL } from '../data/claimUtils';
import { VERIFICATION_LABEL, queueGroup } from '../data/workflow';
import { summarizeOutcomes } from '../data/outcomes';
import { AskPlan } from './askPlanCore';

export interface AskRow { label: string; value: string; caseId?: string }
export interface AskAnswer { title: string; summary: string; rows: AskRow[]; method: string }

export interface AskContext {
  cases: CaseRecord[];
  patterns: FacilityPattern[];
  scoreOf?: (caseId: string) => number;
  now?: number;
}

const GROUP_LABEL = { OPEN: 'Belum diproses', PROGRESS: 'Sedang diproses', DONE: 'Selesai' } as const;
const daysSince = (iso: string, now: number) => { const t = Date.parse(iso); return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / 86_400_000)) : 0; };

export function executePlan(plan: AskPlan, ctx: AskContext): AskAnswer {
  const now = ctx.now ?? Date.now();
  const total = ctx.cases.length;
  const method = `Dihitung program dari ${total} kasus di perangkat ini. AI hanya membaca pertanyaan; data kasus tidak dikirim ke AI.`;
  const notDone = ctx.cases.filter(c => queueGroup(c.verification_status) !== 'DONE');

  switch (plan.intent) {
    case 'top_priority': {
      const n = plan.limit ?? 3;
      const open = ctx.cases.filter(c => queueGroup(c.verification_status) === 'OPEN');
      const ranked = [...open].sort((a, b) => (ctx.scoreOf?.(b.case_id) ?? 0) - (ctx.scoreOf?.(a.case_id) ?? 0)).slice(0, n);
      return {
        title: 'Kasus yang paling perlu diperiksa dulu',
        summary: ranked.length ? `${ranked.length} kasus dengan indeks prioritas tertinggi dari ${open.length} yang belum diproses.` : 'Tidak ada kasus yang belum diproses.',
        rows: ranked.map(c => ({ label: `${c.case_id} · ${c.facility_name}`, value: `Indeks ${ctx.scoreOf?.(c.case_id) ?? 0} · ${RISK_LABEL[c.risk_type]}`, caseId: c.case_id })),
        method
      };
    }
    case 'facility_attention': {
      const list = ctx.patterns.filter(p => !plan.risk_type || p.risk_type === plan.risk_type)
        .sort((a, b) => b.signal_count - a.signal_count).slice(0, plan.limit ?? 5);
      const what = plan.risk_type ? RISK_LABEL[plan.risk_type].toLowerCase() : 'laporan serupa';
      return {
        title: `Faskes dengan ${what}`,
        summary: list.length ? `${list.length} faskes. Ini prioritas pemeriksaan, bukan kesimpulan kesalahan.` : 'Belum ada faskes dengan pola laporan serupa pada jendela 30 hari.',
        rows: list.map(p => ({ label: p.facility_name, value: `${p.signal_count} pelapor berbeda · ${RISK_LABEL[p.risk_type]} · perhatian ${p.attention_level.toLowerCase()}`, caseId: p.case_ids[0] })),
        method
      };
    }
    case 'waiting_longest': {
      const ranked = [...notDone].sort((a, b) => daysSince(b.created_at, now) - daysSince(a.created_at, now)).slice(0, plan.limit ?? 5);
      return {
        title: 'Kasus yang paling lama menunggu',
        summary: ranked.length ? `${ranked.length} kasus belum selesai dengan masa tunggu terlama.` : 'Tidak ada kasus yang belum selesai.',
        rows: ranked.map(c => ({ label: `${c.case_id} · ${c.facility_name}`, value: `${daysSince(c.created_at, now)} hari sejak masuk · ${VERIFICATION_LABEL[c.verification_status]}`, caseId: c.case_id })),
        method
      };
    }
    case 'count_status': {
      const g = (k: 'OPEN' | 'PROGRESS' | 'DONE') => ctx.cases.filter(c => queueGroup(c.verification_status) === k).length;
      if (plan.group) return { title: GROUP_LABEL[plan.group], summary: `${g(plan.group)} dari ${total} kasus.`, rows: [], method };
      return {
        title: 'Jumlah kasus per tahap', summary: `${total} kasus seluruhnya.`,
        rows: (['OPEN', 'PROGRESS', 'DONE'] as const).map(k => ({ label: GROUP_LABEL[k], value: String(g(k)) })), method
      };
    }
    case 'count_risk': {
      const tally = new Map<string, number>();
      for (const c of ctx.cases) tally.set(RISK_LABEL[c.risk_type], (tally.get(RISK_LABEL[c.risk_type]) || 0) + 1);
      return {
        title: 'Jumlah kasus per jenis perbedaan', summary: `${total} kasus seluruhnya.`,
        rows: [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, value: String(n) })), method
      };
    }
    case 'facility_cases': {
      const q = (plan.facility_query || '').toLowerCase();
      const found = ctx.cases.filter(c => c.facility_name.toLowerCase().includes(q));
      return {
        title: `Kasus pada faskes "${plan.facility_query}"`,
        summary: found.length ? `${found.length} kasus ditemukan.` : 'Tidak ada faskes dengan nama itu pada data. Coba tulis sebagian namanya.',
        rows: found.slice(0, 10).map(c => ({ label: `${c.case_id} · ${c.facility_name}`, value: `${RISK_LABEL[c.risk_type]} · ${VERIFICATION_LABEL[c.verification_status]}`, caseId: c.case_id })),
        method
      };
    }
    case 'outcomes': {
      const o = summarizeOutcomes(ctx.cases);
      return {
        title: 'Hasil pemeriksaan sejauh ini', summary: `Dari ${o.total} laporan.`,
        rows: [
          { label: 'Ditutup petugas', value: String(o.closed) },
          { label: 'Diteruskan ke verifikasi lapangan', value: String(o.escalated) },
          { label: 'Menunggu jawaban faskes', value: String(o.waitingFaskes) },
          { label: 'Faskes sudah menjawab', value: String(o.faskesAnswered) },
          { label: 'Penjelasan wajar dari faskes', value: String(o.benignAnswers) }
        ], method
      };
    }
    default:
      return {
        title: 'Pertanyaan ini belum bisa saya jawab',
        summary: 'Saya hanya menjawab hal yang bisa dihitung dari antrean, dan tidak menyatakan faskes bersalah. Coba salah satu contoh di bawah.',
        rows: [], method
      };
  }
}
