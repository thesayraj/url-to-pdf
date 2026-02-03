import crypto from "crypto";

export function pageIdFromUrl(url: string) {
  return crypto.createHash("sha1").update(url).digest("hex");
}
