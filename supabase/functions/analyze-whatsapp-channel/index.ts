import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function scrapeAndAnalyze(url: string, lovableKey: string) {
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // Ensure www prefix for whatsapp.com URLs
  formattedUrl = formattedUrl.replace('https://whatsapp.com/', 'https://www.whatsapp.com/');

  console.log('Fetching WhatsApp channel URL:', formattedUrl);

  // Step 1: Directly fetch the page with browser-like headers
  const pageResponse = await fetch(formattedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  });

  if (!pageResponse.ok) {
    console.error('Fetch error:', pageResponse.status, pageResponse.statusText);
    throw new Error(`Failed to fetch page: ${pageResponse.status}`);
  }

  const html = await pageResponse.text();
  console.log('HTML length:', html.length);
  console.log('HTML preview:', html.substring(0, 1000));

  if (!html || html.length < 100) {
    throw new Error('Could not retrieve page content');
  }

  // Step 2: Send HTML to AI to extract the follower count
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You are a data extraction assistant. You will receive raw HTML from a WhatsApp channel page. Your job is to find the follower/subscriber count and channel name.

Look for:
- Meta tags (og:description, description) that may contain follower counts
- Any text mentioning "followers", "subscribers", "Abonnenten", "Follower"
- Numbers formatted like "15.4K", "1.2M", "15,400", etc.
- The channel name from og:title, title tag, or page content

IMPORTANT RULES:
- Return ONLY a valid JSON object, nothing else.
- The JSON must have these fields:
  - "followerCount": the number as an integer (e.g. 15400, not "15.4K")
  - "channelName": the name of the channel as a string
  - "rawText": the exact text snippet where you found the follower count
- If you find numbers like "15.4K", convert to 15400. If "1.2M", convert to 1200000.
- If you cannot find a follower count, set followerCount to null and explain in rawText.
- Do NOT include any markdown formatting, code blocks, or explanation. ONLY the JSON object.`
        },
        {
          role: 'user',
          content: `Here is the raw HTML from a WhatsApp channel page. Extract the follower/subscriber count and channel name:\n\n${html.substring(0, 8000)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 300,
    }),
  });

  const aiData = await aiResponse.json();

  if (!aiResponse.ok) {
    console.error('AI Gateway error:', JSON.stringify(aiData));
    throw new Error('AI analysis failed');
  }

  const aiContent = aiData?.choices?.[0]?.message?.content || '';
  console.log('AI response:', aiContent);

  const cleaned = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    followerCount: parsed.followerCount,
    channelName: parsed.channelName || 'Unknown Channel',
    rawText: parsed.rawText || '',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableKey) {
      console.error('Missing LOVABLE_API_KEY');
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { url, mode } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // MODE: "cron" — auto-track all active channels
    if (mode === 'cron') {
      console.log('CRON mode: tracking all active channels');

      const { data: channels, error: fetchErr } = await supabase
        .from('tracked_channels')
        .select('*')
        .eq('is_active', true);

      if (fetchErr) {
        console.error('Error fetching channels:', fetchErr);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch channels' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!channels || channels.length === 0) {
        console.log('No active channels to track');
        return new Response(
          JSON.stringify({ success: true, message: 'No active channels' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = [];
      for (const channel of channels) {
        try {
          console.log(`Tracking channel: ${channel.url}`);
          const result = await scrapeAndAnalyze(channel.url, lovableKey);

          if (result.channelName && result.channelName !== 'Unknown Channel') {
            await supabase
              .from('tracked_channels')
              .update({ channel_name: result.channelName })
              .eq('id', channel.id);
          }

          await supabase.from('follower_snapshots').insert({
            channel_id: channel.id,
            follower_count: result.followerCount,
            raw_text: result.rawText,
          });

          results.push({ channel_id: channel.id, ...result });
        } catch (err) {
          console.error(`Error tracking channel ${channel.id}:`, err);
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          await supabase.from('follower_snapshots').insert({
            channel_id: channel.id,
            follower_count: null,
            error: errorMsg,
          });
          results.push({ channel_id: channel.id, error: errorMsg });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MODE: manual — single URL analysis
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await scrapeAndAnalyze(url, lovableKey);

    // Save to DB
    const { data: existing } = await supabase
      .from('tracked_channels')
      .select('id')
      .eq('url', url.trim())
      .maybeSingle();

    let channelId: string;

    if (existing) {
      channelId = existing.id;
      if (result.channelName && result.channelName !== 'Unknown Channel') {
        await supabase
          .from('tracked_channels')
          .update({ channel_name: result.channelName, is_active: true })
          .eq('id', channelId);
      }
    } else {
      const { data: newChannel, error: insertErr } = await supabase
        .from('tracked_channels')
        .insert({ url: url.trim(), channel_name: result.channelName, is_active: true })
        .select('id')
        .single();

      if (insertErr || !newChannel) {
        console.error('Error inserting channel:', insertErr);
      }
      channelId = newChannel?.id;
    }

    if (channelId) {
      await supabase.from('follower_snapshots').insert({
        channel_id: channelId,
        follower_count: result.followerCount,
        raw_text: result.rawText,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        followerCount: result.followerCount,
        channelName: result.channelName,
        rawText: result.rawText,
        scrapedAt: new Date().toISOString(),
        channelId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
