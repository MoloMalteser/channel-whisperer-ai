/**
 * Multi-platform follower extraction from HTML.
 * Supports: WhatsApp, TikTok, Instagram, YouTube
 */

export interface ExtractionResult {
  followerCount: number | null;
  channelName: string;
  rawText: string;
  platform: string;
}

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

export function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('whatsapp.com')) return 'whatsapp';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  return 'other';
}

function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
  const match = html.match(re);
  if (match) return match[1];
  // reversed order
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`, 'i');
  const match2 = html.match(re2);
  return match2 ? match2[1] : null;
}

function extractTitle(html: string): string {
  const ogTitle = extractMeta(html, 'og:title');
  if (ogTitle) return ogTitle.trim();
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : 'Unknown Channel';
}

function extractGenericFollowers(html: string): { count: number | null; rawText: string } {
  // Meta description
  const desc = extractMeta(html, 'og:description') || extractMeta(html, 'description') || '';

  const followerPatterns = [
    /(\d[\d,.]*[KkMmBb]?)\s*(?:followers?|Follower|Abonnenten|subscribers?|abonnés?)/i,
    /(?:followers?|Follower|Abonnenten|subscribers?|abonnés?)\s*[:\s]*(\d[\d,.]*[KkMmBb]?)/i,
  ];

  // Check description first
  for (const p of followerPatterns) {
    const m = desc.match(p);
    if (m) return { count: parseShortNumber(m[1]), rawText: desc };
  }

  // Check body
  for (const p of followerPatterns) {
    const bodyPatterns = new RegExp(p.source, 'gi');
    const matches = [...html.matchAll(bodyPatterns)];
    if (matches.length > 0) return { count: parseShortNumber(matches[0][1]), rawText: matches[0][0] };
  }

  return { count: null, rawText: 'No follower count found' };
}

function extractTikTok(html: string): { count: number | null; rawText: string } {
  // TikTok often has "X Followers" in meta or page content
  const desc = extractMeta(html, 'og:description') || '';
  const patterns = [
    /(\d[\d,.]*[KkMmBb]?)\s*Followers/i,
    /(\d[\d,.]*[KkMmBb]?)\s*Fans/i,
  ];
  for (const p of patterns) {
    const m = desc.match(p);
    if (m) return { count: parseShortNumber(m[1]), rawText: desc };
  }
  return extractGenericFollowers(html);
}

function extractInstagram(html: string): { count: number | null; rawText: string } {
  const desc = extractMeta(html, 'og:description') || extractMeta(html, 'description') || '';
  // Instagram description format: "1.2M Followers, 500 Following, 200 Posts"
  const m = desc.match(/(\d[\d,.]*[KkMmBb]?)\s*Followers/i);
  if (m) return { count: parseShortNumber(m[1]), rawText: desc };
  return extractGenericFollowers(html);
}

function extractYouTube(html: string): { count: number | null; rawText: string } {
  const desc = extractMeta(html, 'og:description') || '';
  // YouTube: "X subscribers"
  const patterns = [
    /(\d[\d,.]*[KkMmBb]?)\s*subscribers?/i,
    /(\d[\d,.]*[KkMmBb]?)\s*Abonnenten/i,
  ];
  for (const p of patterns) {
    const m = desc.match(p);
    if (m) return { count: parseShortNumber(m[1]), rawText: desc };
    // body
    const bodyMatches = [...html.matchAll(new RegExp(p.source, 'gi'))];
    if (bodyMatches.length > 0) return { count: parseShortNumber(bodyMatches[0][1]), rawText: bodyMatches[0][0] };
  }
  return extractGenericFollowers(html);
}

export function extractFollowerCount(html: string, url: string): ExtractionResult {
  const platform = detectPlatform(url);
  const channelName = extractTitle(html);

  let extraction: { count: number | null; rawText: string };

  switch (platform) {
    case 'tiktok': extraction = extractTikTok(html); break;
    case 'instagram': extraction = extractInstagram(html); break;
    case 'youtube': extraction = extractYouTube(html); break;
    default: extraction = extractGenericFollowers(html); break;
  }

  return {
    followerCount: extraction.count,
    channelName,
    rawText: extraction.rawText,
    platform,
  };
}
