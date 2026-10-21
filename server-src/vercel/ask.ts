// Fungsi serverless Vercel: /api/ask (di-bundle ke api/ask.js oleh scripts/build-api.mjs)
import { runAsk } from '../../src/server/askCore';
import { clientIdOf } from './clientId';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak didukung.' });
  const out = await runAsk({ body: req.body, apiKey: process.env.GEMINI_API_KEY, clientId: clientIdOf(req) });
  return res.status(out.status).json(out.json);
}
