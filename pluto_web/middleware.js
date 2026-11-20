const SUPABASE_URL = 'https://gsymhdyqlqccvwowjiwv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const SITE_URL = 'https://www.plutocampus.in';
const DEFAULT_IMAGE = `${SITE_URL}/plutocampus.jpeg`;

// Bot user-agent patterns — these crawlers don't run JS
const BOT_PATTERNS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'Slackbot', 'TelegramBot', 'Discordbot', 'Pinterest',
  'Googlebot', 'bingbot', 'Applebot',
];

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(bot => ua.includes(bot.toLowerCase()));
}

function getCdnUrl(path) {
  if (!path) return DEFAULT_IMAGE;
  if (path.startsWith('http')) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${path}`;
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildOgHtml({ title, description, image, url }) {
  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${esc(url)}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:image" content="${esc(image)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:site_name" content="Pluto Campus"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image" content="${esc(image)}"/>
<meta http-equiv="refresh" content="0;url=${esc(url)}"/>
</head>
<body><p>Redirecting...</p></body>
</html>`;
}

// Query Supabase REST API directly (no SDK needed)
async function querySupabase(table, id, fields) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&select=${fields}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0] || null;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  // Only intercept for bots/crawlers — normal users get the SPA
  if (!isBot(userAgent)) return;

  // Match /event/:id
  const eventMatch = url.pathname.match(/^\/event\/([a-zA-Z0-9-]+)\/?$/);
  if (eventMatch) {
    try {
      const event = await querySupabase('events', eventMatch[1], 'title,description,banner_url,venue,city,start_date');
      if (event) {
        const dateStr = event.start_date
          ? new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : '';
        const locationStr = [event.venue, event.city].filter(Boolean).join(', ');
        const desc = event.description
          ? event.description.substring(0, 200).replace(/\n/g, ' ')
          : [dateStr, locationStr].filter(Boolean).join(' • ');

        return new Response(buildOgHtml({
          title: `${event.title} | Pluto Campus`,
          description: desc,
          image: getCdnUrl(event.banner_url),
          url: `${SITE_URL}/event/${eventMatch[1]}`,
        }), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    } catch (e) { console.error('OG error (event):', e); }
  }

  // Match /competition/:id
  const compMatch = url.pathname.match(/^\/competition\/([a-zA-Z0-9-]+)\/?$/);
  if (compMatch) {
    try {
      const comp = await querySupabase('competitions', compMatch[1], 'title,description,banner_url,venue,city,start_date,entry_fee,category');
      if (comp) {
        const feeStr = comp.entry_fee > 0 ? `Entry: ₹${comp.entry_fee}` : 'Free Entry';
        const catStr = comp.category ? comp.category.charAt(0).toUpperCase() + comp.category.slice(1).replace(/_/g, ' ') : '';
        const desc = comp.description
          ? comp.description.substring(0, 200).replace(/\n/g, ' ')
          : [catStr, feeStr].filter(Boolean).join(' • ');

        return new Response(buildOgHtml({
          title: `${comp.title} | Pluto Campus`,
          description: desc,
          image: getCdnUrl(comp.banner_url),
          url: `${SITE_URL}/competition/${compMatch[1]}`,
        }), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    } catch (e) { console.error('OG error (competition):', e); }
  }

  // No match — let Vercel serve normal SPA
  return;
}

export const config = {
  matcher: ['/event/:path*', '/competition/:path*'],
};
