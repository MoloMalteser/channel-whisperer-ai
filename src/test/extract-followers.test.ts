import { describe, it, expect } from "vitest";
import { parseShortNumber, extractFollowerCount } from "@/lib/extract-followers";

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

  it("parses B suffix", () => {
    expect(parseShortNumber("1B")).toBe(1000000000);
  });

  it("handles commas", () => {
    expect(parseShortNumber("15,400")).toBe(15400);
    expect(parseShortNumber("1,200,000")).toBe(1200000);
  });

  it("returns null for invalid input", () => {
    expect(parseShortNumber("abc")).toBeNull();
    expect(parseShortNumber("")).toBeNull();
  });
});

describe("extractFollowerCount", () => {
  it("extracts from og:description meta tag", () => {
    const html = `<html><head>
      <meta property="og:title" content="NoStudios" />
      <meta property="og:description" content="Channel • 10 followers • We are NoStudios" />
    </head><body></body></html>`;

    const result = extractFollowerCount(html);
    expect(result.followerCount).toBe(10);
    expect(result.channelName).toBe("NoStudios");
  });

  it("extracts K-format followers", () => {
    const html = `<html><head>
      <meta property="og:title" content="BigChannel" />
      <meta property="og:description" content="15.4K followers on WhatsApp" />
    </head><body></body></html>`;

    const result = extractFollowerCount(html);
    expect(result.followerCount).toBe(15400);
    expect(result.channelName).toBe("BigChannel");
  });

  it("extracts M-format followers", () => {
    const html = `<html><head>
      <meta property="og:description" content="1.2M Follower" />
      <title>MegaChannel</title>
    </head><body></body></html>`;

    const result = extractFollowerCount(html);
    expect(result.followerCount).toBe(1200000);
    expect(result.channelName).toBe("MegaChannel");
  });

  it("extracts from body text if no meta tags", () => {
    const html = `<html><head><title>TestCh</title></head>
    <body><div>500 followers</div></body></html>`;

    const result = extractFollowerCount(html);
    expect(result.followerCount).toBe(500);
  });

  it("returns null when no follower count found", () => {
    const html = `<html><head><title>Empty</title></head><body>No data</body></html>`;
    const result = extractFollowerCount(html);
    expect(result.followerCount).toBeNull();
    expect(result.channelName).toBe("Empty");
  });

  it("handles German Abonnenten", () => {
    const html = `<html><head>
      <meta property="og:description" content="3.5K Abonnenten" />
      <meta property="og:title" content="DeutschKanal" />
    </head><body></body></html>`;

    const result = extractFollowerCount(html);
    expect(result.followerCount).toBe(3500);
  });
});
