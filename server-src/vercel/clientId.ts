export function clientIdOf(req: any): string {
  const fwd = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req?.socket?.remoteAddress || 'unknown';
}
