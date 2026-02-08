import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function scrapeAndAnalyze(url: string, firecrawlKey: string, lovableKey: string) {
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  console.log('Scraping WhatsApp channel URL:', formattedUrl);

  // Step 1: Scrape the page with Firecrawl
  const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: formattedUrl,
      formats: ['markdown'],
      onlyMainContent: false,
      waitFor: 3000,
    }),
  });

  const scrapeData = await scrapeResponse.json();

  if (!scrapeResponse.ok) {
    console.error('Firecrawl error:', JSON.stringify(scrapeData));
    throw new Error('Failed to scrape the WhatsApp channel page');
  }

  const pageText = scrapeData?.data?.markdown || scrapeData?.markdown || '';
  console.log('Scraped text length:', pageText.length);
  console.log('Scraped text preview:', pageText.substring(0, 500));

  if (!pageText) {
    throw new Error('Could not extract text from the page');
  }

  // Step 2: Send to AI to extract the follower count
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
          content: `You are a data extraction assistant. You will receive scraped text from a WhatsApp channel page. Your job is to find the follower/subscriber count. 

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
          content: `Here is the scraped text from a WhatsApp channel page. Extract the follower/subscriber count:\n\n${pageText.substring(0, 4000)}`
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
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlKey || !lovableKey) {
      console.error('Missing API keys');
      return new Response(
        JSON.stringify({ success: false, error: 'API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { url, mode } = body;

    // MODE: "cron" — auto-track all active channels
    if (mode === 'cron') {
      console.log('CRON mode: tracking all active channels');

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

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
          const result = await scrapeAndAnalyze(channel.url, firecrawlKey, lovableKey);

          // Update channel name if found
          if (result.channelName && result.channelName !== 'Unknown Channel') {
            await supabase
              .from('tracked_channels')
              .update({ channel_name: result.channelName })
              .eq('id', channel.id);
          }

          // Insert snapshot
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

    // MODE: manual — single URL analysis (also saves to DB)
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await scrapeAndAnalyze(url, firecrawlKey, lovableKey);

    // Save to DB
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if channel already exists
    const { data: existing } = await supabase
      .from('tracked_channels')
      .select('id')
      .eq('url', url.trim())
      .maybeSingle();

    let channelId: string;

    if (existing) {
      channelId = existing.id;
      // Update name
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

    // Insert snapshot
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
