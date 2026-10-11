// Fungsi serverless Vercel: /api/db (di-bundle ke api/db.js oleh scripts/build-api.mjs)
import { handleDb } from '../../src/server/dbHandler';
import { clientIdOf } from './clientId';

export default async function handler(req: any, res: any) {
  const out = await handleDb({ method: req.method, query: req.query || {}, body: req.body, clientId: clientIdOf(req) });
  return res.status(out.status).json(out.json);
}
