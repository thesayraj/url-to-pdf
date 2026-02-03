import { Worker } from "bullmq";
import { chromium } from "playwright";
import { redis } from "../redis";
import { updateCrawlState } from "../state/crawlState";
import { pdfQueue } from "../queues/pdfQueue";
import { normalizeAndValidateUrl, normalizeCrawledUrl } from "../utils/url";

const MAX_PAGES = 100;

new Worker(
  "crawl-queue",
  async (job) => {
    let { crawlJobId, url: rootUrl } = job.data;
    rootUrl = normalizeAndValidateUrl(rootUrl);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const visited = new Set<string>();
    const discovered: string[] = [];

    await page.goto(rootUrl, { waitUntil: "networkidle" });

    const links = await page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => a.getAttribute("href")),
    );

    for (const href of links) {
      if (!href) continue;

      const normalized = normalizeCrawledUrl(href, rootUrl);
      if (!normalized) continue;

      if (!visited.has(normalized)) {
        visited.add(normalized);
        discovered.push(normalized);
      }

      if (discovered.length >= MAX_PAGES) break;
    }

    await browser.close();

    await updateCrawlState(crawlJobId, (state) => {
      state.status = "processing";
      state.pages = discovered.map((u, i) => ({
        pageId: `p${i}`,
        url: u,
        status: "queued",
        hasVideo: false,
      }));
      return state;
    });

    // Enqueue PDF jobs
    for (const pageUrl of discovered) {
      await pdfQueue.add("render-pdf", {
        crawlJobId,
        pageUrl,
      });
    }
  },
  { connection: redis },
);
