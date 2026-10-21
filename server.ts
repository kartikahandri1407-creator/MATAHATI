import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAnalysis } from './src/server/analyzeCore';
import { handleDb } from './src/server/dbHandler';
import { runAsk } from './src/server/askCore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientIdOf = (req: express.Request) =>
  (String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown');

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Batas body: foto maksimal 3 MB (base64 ~4 MB) + teks.
  app.use(express.json({ limit: '5mb' }));

  // Status layanan (tanpa membocorkan nilai rahasia apa pun)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      dbConfigured: !!(process.env.FIREBASE_SERVICE_ACCOUNT || (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY))),
      timestamp: new Date().toISOString()
    });
  });

  // Proxy Gemini: logika sama persis dengan Vercel (src/server/analyzeCore.ts)
  app.post('/api/analyze', async (req, res) => {
    const out = await runAnalysis({ body: req.body, apiKey: process.env.GEMINI_API_KEY, clientId: clientIdOf(req) });
    res.status(out.status).json(out.json);
  });

  // Tanya-jawab petugas: model hanya menerjemahkan pertanyaan (tanpa data kasus)
  app.post('/api/ask', async (req, res) => {
    const out = await runAsk({ body: req.body, apiKey: process.env.GEMINI_API_KEY, clientId: clientIdOf(req) });
    res.status(out.status).json(out.json);
  });

  // Database (Supabase): CRUD generik
  app.all('/api/db', async (req, res) => {
    const out = await handleDb({ method: req.method, query: req.query as any, body: req.body, clientId: clientIdOf(req) });
    res.status(out.status).json(out.json);
  });

  // Integrasi Vite
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MATA HATI] Server siap di http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Gagal menjalankan server:', err);
  process.exit(1);
});
