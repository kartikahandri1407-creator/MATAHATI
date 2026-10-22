/** Format tanggal seragam untuk seluruh aplikasi: "12 September 2026". */
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function fmtTanggal(v?: string | null): string {
  if (!v) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (m) { const mo = Number(m[2]) - 1; if (mo >= 0 && mo < 12) return `${Number(m[3])} ${BULAN[mo]} ${m[1]}`; }
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return v;
  const d = new Date(t);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtWaktu(v?: string | null): string {
  const t = v ? Date.parse(v) : NaN;
  if (!Number.isFinite(t)) return fmtTanggal(v);
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fmtTanggal(v)}, ${p(d.getHours())}.${p(d.getMinutes())}`;
}

export const fmtRupiah = (n: number): string => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
