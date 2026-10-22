// Fungsi serverless Vercel: /api/ask (di-bundle ke api/ask.js oleh scripts/build-api.mjs)
import { runAsk, listAvailableModels } from '../../src/server/askCore';
import { clientIdOf } from './clientId';

export default async function handler(req: any, res: any) {
  // GET /api/ask?models=1 : diagnosa nama model yang tersedia (hanya nama model)
  if (req.method === 'GET' && String(req.query?.models || '') === '1') {
    const out = await listAvailableModels(process.env.GEMINI_API_KEY);
    return res.status(out.status).json(out.json);
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak didukung.' });
  const out = await runAsk({ body: req.body, apiKey: process.env.GEMINI_API_KEY, clientId: clientIdOf(req) });
  return res.status(out.status).json(out.json);
}
