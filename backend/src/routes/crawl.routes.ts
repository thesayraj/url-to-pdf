import { Router } from "express";
import { v4 as uuid } from "uuid";
import { crawlQueue } from "../queues/crawlQueue";
import { initCrawlState, getCrawlState } from "../state/crawlState";

const router = Router();

/**
 * Start crawl
 */
router.post("/crawl", async (req, res) => {
  const { url } = req.body;
  const crawlJobId = uuid();

  await initCrawlState(crawlJobId, url);

  await crawlQueue.add("crawl-site", {
    crawlJobId,
    url,
  });

  res.json({ crawlJobId });
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
