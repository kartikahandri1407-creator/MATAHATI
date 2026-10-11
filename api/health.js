// FILE HASIL BUNDLE - jangan disunting. Sumber: server-src/vercel dan src/server. Regenerasi: npm run build:api

// server-src/vercel/health.ts
function handler(_req, res) {
  return res.status(200).json({
    status: "ok",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    dbConfigured: !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
export {
  handler as default
};
