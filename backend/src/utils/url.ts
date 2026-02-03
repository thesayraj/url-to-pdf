import psl from "psl";

export function normalizeAndValidateUrl(input: string): string {
  input = input.trim();

  if (hasExplicitScheme(input)) {
    if (!/^https?:\/\//i.test(input)) {
      throw new Error("Only http/https URLs are allowed");
    }
  } else {
    input = "https://" + input;
  }

  const parsed = new URL(input);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Invalid protocol");
  }

  // hostname must contain at least one dot
  if (!parsed.hostname.includes(".")) {
    throw new Error("Invalid hostname");
  }

  return parsed.toString();
}

function hasExplicitScheme(input: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input);
}

export function normalizeCrawledUrl(
  rawUrl: string,
  rootUrl: string,
): string | null {
  try {
    const u = new URL(rawUrl, rootUrl);

    if (!["http:", "https:"].includes(u.protocol)) return null;
    if (!isSameSite(u.toString(), rootUrl)) return null;

    // strip noise
    u.hash = "";
    u.search = "";

    let normalized = u.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return null;
  }
}

function isSameSite(url: string, rootUrl: string): boolean {
  const domain = getRegistrableDomain(url);
  return domain === getRegistrableDomain(rootUrl);
}

function getRegistrableDomain(url: string): string | null {
  const hostname = new URL(url).hostname;
  const parsed = psl.parse(hostname);

  if (parsed.error || !parsed.domain) return null;
  return parsed.domain; // e.g. "google.com"
}
