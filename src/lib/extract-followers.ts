/**
 * Extracts follower count from raw HTML using regex patterns.
 * No AI needed — fast and deterministic.
 */

export interface ExtractionResult {
  followerCount: number | null;
  channelName: string;
  rawText: string;
}

/**
 * Parse shorthand numbers like "15.4K" → 15400, "1.2M" → 1200000
 */
export function parseShortNumber(text: string): number | null {
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

/**
 * Extract follower count from HTML content using multiple regex strategies.
 */
export function extractFollowerCount(html: string): ExtractionResult {
  const result: ExtractionResult = {
    followerCount: null,
    channelName: 'Unknown Channel',
    rawText: '',
  };

  // Extract channel name from og:title or <title>
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (ogTitleMatch) {
    result.channelName = ogTitleMatch[1].trim();
  } else {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      result.channelName = titleMatch[1].trim();
    }
  }

  // Strategy 1: Look in og:description or meta description for follower patterns
  const descMatch = html.match(/<meta[^>]*(?:property=["']og:description["']|name=["']description["'])[^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property=["']og:description["']|name=["']description["'])/i);
  
  if (descMatch) {
    const desc = descMatch[1];
    const followerMatch = desc.match(/(\d[\d,.]*[KkMmBb]?)\s*(?:followers?|Follower|Abonnenten|subscribers?)/i)
      || desc.match(/(?:followers?|Follower|Abonnenten|subscribers?)\s*[:\s]*(\d[\d,.]*[KkMmBb]?)/i);
    
    if (followerMatch) {
      result.followerCount = parseShortNumber(followerMatch[1]);
      result.rawText = desc;
      return result;
    }
  }

  // Strategy 2: Look for "X followers" pattern anywhere in HTML body
  const bodyPatterns = [
    /(\d[\d,.]*[KkMmBb]?)\s*(?:followers?|Follower|Abonnenten|subscribers?)/gi,
    /(?:Channel|Kanal)\s*[•·|]\s*(\d[\d,.]*[KkMmBb]?)\s*(?:followers?|Follower)/gi,
  ];

  for (const pattern of bodyPatterns) {
    const matches = [...html.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      result.followerCount = parseShortNumber(match[1]);
      result.rawText = match[0];
      return result;
    }
  }

  // Strategy 3: Look for structured data / JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      if (jsonData.interactionStatistic) {
        const stats = Array.isArray(jsonData.interactionStatistic)
          ? jsonData.interactionStatistic
          : [jsonData.interactionStatistic];
        for (const stat of stats) {
          if (stat.interactionType?.includes?.('Follow') || stat['@type']?.includes?.('Follow')) {
            result.followerCount = parseInt(stat.userInteractionCount, 10);
            result.rawText = `JSON-LD: ${stat.userInteractionCount}`;
            return result;
          }
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  result.rawText = 'No follower count found in page';
  return result;
}
