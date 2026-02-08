const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI Gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
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
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape the WhatsApp channel page' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pageText = scrapeData?.data?.markdown || scrapeData?.markdown || '';
    console.log('Scraped text length:', pageText.length);
    console.log('Scraped text preview:', pageText.substring(0, 500));

    if (!pageText) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract text from the page' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiContent = aiData?.choices?.[0]?.message?.content || '';
    console.log('AI response:', aiContent);

    // Parse the AI response
    let parsed;
    try {
      // Clean potential markdown code blocks
      const cleaned = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not parse the follower count from the page',
          rawAiResponse: aiContent,
          scrapedPreview: pageText.substring(0, 500)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsed result:', JSON.stringify(parsed));

    return new Response(
      JSON.stringify({
        success: true,
        followerCount: parsed.followerCount,
        channelName: parsed.channelName || 'Unknown Channel',
        rawText: parsed.rawText || '',
        scrapedAt: new Date().toISOString(),
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
