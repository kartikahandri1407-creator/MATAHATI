// Fungsi serverless Vercel: /api/analyze (di-bundle ke api/analyze.js oleh scripts/build-api.mjs)
import { runAnalysis } from '../../src/server/analyzeCore';
import { clientIdOf } from './clientId';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak didukung.' });
  const out = await runAnalysis({ body: req.body, apiKey: process.env.GEMINI_API_KEY, clientId: clientIdOf(req) });
  return res.status(out.status).json(out.json);
}
