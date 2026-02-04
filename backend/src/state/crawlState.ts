import { redis } from "../redis";
import { CrawlState } from "../types/common";

const key = (crawlJobId: string) => `app:crawl:${crawlJobId}`;

export async function initCrawlState(crawlJobId: string, url: string) {
  const state: CrawlState = {
    crawlJobId,
    url,
    status: "queued",
    pages: [],
    createdAt: Date.now(),
  };
  await redis.set(key(crawlJobId), JSON.stringify(state));
}

export async function getCrawlState(crawlJobId: string) {
  const data = await redis.get(key(crawlJobId));
  return data ? JSON.parse(data) : null;
}

export async function updateCrawlState(
  crawlJobId: string,
  updater: (state: CrawlState) => CrawlState,
) {
  const state = await getCrawlState(crawlJobId);
  if (!state) return;

  const updated = updater(state);
  await redis.set(key(crawlJobId), JSON.stringify(updated));
}
