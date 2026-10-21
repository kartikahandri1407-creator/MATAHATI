/** MATA HATI - klien tanya-jawab petugas. Bila server AI tidak tersedia, memakai pencocokan kata kunci lokal. */
import { AskPlan, parsePlanLocal, sanitizePlan } from '../services/askPlanCore';

export interface AskResult { plan: AskPlan; source: 'AI' | 'LOKAL' }

export async function planQuestion(question: string): Promise<AskResult> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }), signal: ctl.signal });
    clearTimeout(t);
    if (res.ok) {
      const j = await res.json();
      if (j?.plan) return { plan: sanitizePlan(j.plan), source: 'AI' };
    }
  } catch { /* jatuh ke mesin lokal */ }
  return { plan: parsePlanLocal(question), source: 'LOKAL' };
}
