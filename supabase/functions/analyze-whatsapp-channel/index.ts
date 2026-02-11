import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExtractionResult {
  followerCount: number | null;
  channelName: string;
  rawText: string;
}

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

function extractFollowerCount(html: string): ExtractionResult {
  const result: ExtractionResult = { followerCount: null, channelName: 'Unknown Channel', rawText: '' };

  // Channel name
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (ogTitle) result.channelName = ogTitle[1].trim();
  else {
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (title) result.channelName = title[1].trim();
  }

  // Strategy 1: meta description
  const descMatch = html.match(/<meta[^>]*(?:property=["']og:description["']|name=["']description["'])[^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property=["']og:description["']|name=["']description["'])/i);
  if (descMatch) {
    const desc = descMatch[1];
    const fm = desc.match(/(\d[\d,.]*[KkMmBb]?)\s*(?:followers?|Follower|Abonnenten|subscribers?)/i)
      || desc.match(/(?:followers?|Follower|Abonnenten|subscribers?)\s*[:\s]*(\d[\d,.]*[KkMmBb]?)/i);
    if (fm) {
      result.followerCount = parseShortNumber(fm[1]);
      result.rawText = desc;
      return result;
    }
  }

  // Strategy 2: body patterns
  const patterns = [
    /(\d[\d,.]*[KkMmBb]?)\s*(?:followers?|Follower|Abonnenten|subscribers?)/gi,
    /(?:Channel|Kanal)\s*[•·|]\s*(\d[\d,.]*[KkMmBb]?)\s*(?:followers?|Follower)/gi,
  ];
  for (const p of patterns) {
    const matches = [...html.matchAll(p)];
    if (matches.length > 0) {
      result.followerCount = parseShortNumber(matches[0][1]);
      result.rawText = matches[0][0];
      return result;
    }
  }

  result.rawText = 'No follower count found';
  return result;
}

async function scrapeChannel(url: string): Promise<ExtractionResult> {
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }
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
  console.log('HTML length:', html.length);

  if (!html || html.length < 100) throw new Error('Empty page');

  return extractFollowerCount(html);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url, mode } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (mode === 'cron') {
      console.log('CRON mode');
      const { data: channels, error: fetchErr } = await supabase
        .from('tracked_channels').select('*').eq('is_active', true);

      if (fetchErr) {
        return new Response(JSON.stringify({ success: false, error: 'DB error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (!channels?.length) {
        return new Response(JSON.stringify({ success: true, message: 'No active channels' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const results = [];
      for (const ch of channels) {
        try {
          const r = await scrapeChannel(ch.url);
          if (r.channelName !== 'Unknown Channel') {
            await supabase.from('tracked_channels').update({ channel_name: r.channelName }).eq('id', ch.id);
          }
          await supabase.from('follower_snapshots').insert({
            channel_id: ch.id, follower_count: r.followerCount, raw_text: r.rawText,
          });
          results.push({ channel_id: ch.id, ...r });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown';
          await supabase.from('follower_snapshots').insert({
            channel_id: ch.id, follower_count: null, error: msg,
          });
          results.push({ channel_id: ch.id, error: msg });
        }
      }

      return new Response(JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Manual mode
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const result = await scrapeChannel(url);

    const { data: existing } = await supabase
      .from('tracked_channels').select('id').eq('url', url.trim()).maybeSingle();

    let channelId: string;
    if (existing) {
      channelId = existing.id;
      if (result.channelName !== 'Unknown Channel') {
        await supabase.from('tracked_channels')
          .update({ channel_name: result.channelName, is_active: true }).eq('id', channelId);
      }
    } else {
      const { data: nc } = await supabase.from('tracked_channels')
        .insert({ url: url.trim(), channel_name: result.channelName, is_active: true })
        .select('id').single();
      channelId = nc?.id;
    }

    if (channelId) {
      await supabase.from('follower_snapshots').insert({
        channel_id: channelId, follower_count: result.followerCount, raw_text: result.rawText,
      });
    }

    return new Response(JSON.stringify({
      success: true, followerCount: result.followerCount, channelName: result.channelName,
      rawText: result.rawText, scrapedAt: new Date().toISOString(), channelId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
