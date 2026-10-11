// Fungsi serverless Vercel: /api/health (di-bundle ke api/health.js oleh scripts/build-api.mjs)
export default function handler(_req: any, res: any) {
  return res.status(200).json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    dbConfigured: !!(process.env.FIREBASE_SERVICE_ACCOUNT || (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY))),
    timestamp: new Date().toISOString()
  });
}
