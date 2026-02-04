import { Router } from "express";
import { v4 as uuid } from "uuid";
import { crawlQueue } from "../queues/crawlQueue";
import { initCrawlState, getCrawlState } from "../state/crawlState";
import { normalizeAndValidateUrl } from "../utils/url";

const router = Router();

/**
 * Start crawl
 */
router.post("/crawl", async (req, res) => {
  let { url } = req.body;

  try {
    url = normalizeAndValidateUrl(url);
  } catch (err) {
    return res.status(400).json({
      error: "Invalid URL provided",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }

  const crawlJobId = uuid();

  try {
    await initCrawlState(crawlJobId, url);

    await crawlQueue.add("crawl-site", {
      crawlJobId,
      url,
    });

    res.json({ crawlJobId });
  } catch (queueErr) {
    res.status(500).json({ error: "Failed to initialize crawl job" });
  }
});

/**
 * Poll status
 */
router.get("/crawl/:id/status", async (req, res) => {
  const state = await getCrawlState(req.params.id);
  if (!state) return res.status(404).json({ error: "Not found" });

  res.json(state);
});

export default router;
