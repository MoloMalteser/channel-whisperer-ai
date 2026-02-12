import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function parseShortNumber(text: string): number | null {
  const cleaned = text.replace(/,/g, '').replace(/\s/g, '');
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*([KkMmBb])?$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  switch (suffix) {
    case 'K': return Math.round(num * 1_000);
    case 'M': return Math.round(num * 1_000_000);
    case 'B': return Math.round(num * 1_000_000_000);
    default: return Math.round(num);
  }
}

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('whatsapp.com')) return 'whatsapp';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  return 'other';
}

function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`, 'i');
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

function extractFollowers(html: string, url: string) {
  const platform = detectPlatform(url);
  const ogTitle = extractMeta(html, 'og:title');
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const channelName = ogTitle?.trim() || titleTag?.[1]?.trim() || 'Unknown Channel';

  const desc = extractMeta(html, 'og:description') || extractMeta(html, 'description') || '';
  const patterns = [
    /(\d[\d,.]*[KkMmBb]?)\s*(?:followers?|Follower|Abonnenten|subscribers?|Fans|abonnés?)/i,
    /(?:followers?|Follower|Abonnenten|subscribers?)\s*[:\s]*(\d[\d,.]*[KkMmBb]?)/i,
  ];

  for (const p of patterns) {
    const m = desc.match(p);
    if (m) return { followerCount: parseShortNumber(m[1]), channelName, rawText: desc, platform };
  }

  for (const p of patterns) {
    const bp = new RegExp(p.source, 'gi');
    const matches = [...html.matchAll(bp)];
    if (matches.length > 0) return { followerCount: parseShortNumber(matches[0][1]), channelName, rawText: matches[0][0], platform };
  }

  return { followerCount: null, channelName, rawText: 'No follower count found', platform };
}

async function scrapeChannel(url: string) {
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://'))
    formattedUrl = `https://${formattedUrl}`;
  formattedUrl = formattedUrl.replace('https://whatsapp.com/', 'https://www.whatsapp.com/');

  console.log('Fetching:', formattedUrl);
  const resp = await fetch(formattedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
  const html = await resp.text();
  if (!html || html.length < 100) throw new Error('Empty page');
  return extractFollowers(html, formattedUrl);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { url, mode } = body;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Get user from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    if (mode === 'cron') {
      const { data: channels } = await supabase.from('tracked_channels').select('*').eq('is_active', true);
      if (!channels?.length) return new Response(JSON.stringify({ success: true, message: 'No active channels' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const results = [];
      for (const ch of channels) {
        try {
          const r = await scrapeChannel(ch.url);
          if (r.channelName !== 'Unknown Channel')
            await supabase.from('tracked_channels').update({ channel_name: r.channelName, platform: r.platform }).eq('id', ch.id);
          await supabase.from('follower_snapshots').insert({ channel_id: ch.id, follower_count: r.followerCount, raw_text: r.rawText });
          results.push({ channel_id: ch.id, ...r });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown';
          await supabase.from('follower_snapshots').insert({ channel_id: ch.id, follower_count: null, error: msg });
          results.push({ channel_id: ch.id, error: msg });
        }
      }
      return new Response(JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!url) return new Response(JSON.stringify({ success: false, error: 'URL is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const result = await scrapeChannel(url);
    const { data: existing } = await supabase.from('tracked_channels').select('id').eq('url', url.trim()).maybeSingle();

    let channelId: string;
    if (existing) {
      channelId = existing.id;
      await supabase.from('tracked_channels').update({
        channel_name: result.channelName !== 'Unknown Channel' ? result.channelName : undefined,
        is_active: true, platform: result.platform,
        ...(userId ? { user_id: userId } : {}),
      }).eq('id', channelId);
    } else {
      const { data: nc } = await supabase.from('tracked_channels')
        .insert({ url: url.trim(), channel_name: result.channelName, is_active: true, platform: result.platform, user_id: userId })
        .select('id').single();
      channelId = nc?.id;
    }

    if (channelId) {
      await supabase.from('follower_snapshots').insert({ channel_id: channelId, follower_count: result.followerCount, raw_text: result.rawText });
    }

    return new Response(JSON.stringify({
      success: true, ...result, scrapedAt: new Date().toISOString(), channelId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
