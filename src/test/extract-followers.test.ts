import { describe, it, expect } from "vitest";
import { parseShortNumber, extractFollowerCount, detectPlatform } from "@/lib/extract-followers";

describe("parseShortNumber", () => {
  it("parses plain integers", () => {
    expect(parseShortNumber("100")).toBe(100);
    expect(parseShortNumber("15400")).toBe(15400);
  });

  it("parses K suffix", () => {
    expect(parseShortNumber("15.4K")).toBe(15400);
    expect(parseShortNumber("1K")).toBe(1000);
    expect(parseShortNumber("2.5k")).toBe(2500);
  });

  it("parses M suffix", () => {
    expect(parseShortNumber("1.2M")).toBe(1200000);
    expect(parseShortNumber("3m")).toBe(3000000);
  });

  it("handles commas", () => {
    expect(parseShortNumber("15,400")).toBe(15400);
  });

  it("returns null for invalid input", () => {
    expect(parseShortNumber("abc")).toBeNull();
    expect(parseShortNumber("")).toBeNull();
  });
});

describe("detectPlatform", () => {
  it("detects whatsapp", () => {
    expect(detectPlatform("https://whatsapp.com/channel/abc")).toBe("whatsapp");
  });
  it("detects tiktok", () => {
    expect(detectPlatform("https://www.tiktok.com/@user")).toBe("tiktok");
  });
  it("detects instagram", () => {
    expect(detectPlatform("https://instagram.com/user")).toBe("instagram");
  });
  it("detects youtube", () => {
    expect(detectPlatform("https://youtube.com/@channel")).toBe("youtube");
    expect(detectPlatform("https://youtu.be/abc")).toBe("youtube");
  });
  it("returns other for unknown", () => {
    expect(detectPlatform("https://example.com")).toBe("other");
  });
});

describe("extractFollowerCount", () => {
  it("extracts WhatsApp followers from og:description", () => {
    const html = `<html><head>
      <meta property="og:title" content="NoStudios" />
      <meta property="og:description" content="Channel • 10 followers • We are NoStudios" />
    </head></html>`;
    const r = extractFollowerCount(html, "https://whatsapp.com/channel/abc");
    expect(r.followerCount).toBe(10);
    expect(r.channelName).toBe("NoStudios");
    expect(r.platform).toBe("whatsapp");
  });

  it("extracts TikTok followers", () => {
    const html = `<html><head>
      <meta property="og:title" content="CoolUser" />
      <meta property="og:description" content="2.5M Followers, 100 Following" />
    </head></html>`;
    const r = extractFollowerCount(html, "https://tiktok.com/@cooluser");
    expect(r.followerCount).toBe(2500000);
    expect(r.platform).toBe("tiktok");
  });

  it("extracts Instagram followers", () => {
    const html = `<html><head>
      <meta property="og:title" content="InstaUser" />
      <meta property="og:description" content="500K Followers, 200 Following" />
    </head></html>`;
    const r = extractFollowerCount(html, "https://instagram.com/instauser");
    expect(r.followerCount).toBe(500000);
    expect(r.platform).toBe("instagram");
  });

  it("extracts YouTube subscribers", () => {
    const html = `<html><head>
      <meta property="og:title" content="YouTuber" />
      <meta property="og:description" content="1.2M subscribers on YouTube" />
    </head></html>`;
    const r = extractFollowerCount(html, "https://youtube.com/@youtuber");
    expect(r.followerCount).toBe(1200000);
    expect(r.platform).toBe("youtube");
  });

  it("handles German Abonnenten for YouTube", () => {
    const html = `<html><head>
      <meta property="og:title" content="DeutschYT" />
      <meta name="description" content="3.5K Abonnenten" />
    </head></html>`;
    const r = extractFollowerCount(html, "https://youtube.com/@de");
    expect(r.followerCount).toBe(3500);
  });

  it("returns null when no follower count found", () => {
    const html = `<html><head><title>Empty</title></head><body>No data</body></html>`;
    const r = extractFollowerCount(html, "https://example.com");
    expect(r.followerCount).toBeNull();
  });
});
