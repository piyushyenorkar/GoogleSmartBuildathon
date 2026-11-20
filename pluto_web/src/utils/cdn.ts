export function getCdnUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return '';
  // Cloudflare CDN for Supabase Storage
  return originalUrl.replace(
    'gsymhdyqlqccvwowjiwv.supabase.co',
    'plutocampus-cdn.piyushyenorkar1.workers.dev'
  );
}
