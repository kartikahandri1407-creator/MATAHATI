// Membundle fungsi serverless Vercel menjadi file JS mandiri di folder api/.
// Alasannya: proyek ini "type": "module", dan impor tanpa ekstensi dari api/ dapat gagal di runtime Vercel.
// Jalankan: npm run build:api  (juga dijalankan otomatis oleh npm run build)
import { build } from 'esbuild';

await build({
  entryPoints: {
    analyze: 'server-src/vercel/analyze.ts',
    db: 'server-src/vercel/db.ts',
    health: 'server-src/vercel/health.ts'
  },
  outdir: 'api',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  external: ['@google/genai', 'firebase-admin', 'firebase-admin/*'],
  banner: { js: '// FILE HASIL BUNDLE - jangan disunting. Sumber: server-src/vercel dan src/server. Regenerasi: npm run build:api' },
  logLevel: 'info'
});
