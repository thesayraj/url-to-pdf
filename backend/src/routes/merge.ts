import { Router } from "express";
import { v4 as uuid } from "uuid";
import { mergeQueue } from "../queues/mergeQueue";
import { getCrawlState, updateCrawlState } from "../state/crawlState";

const router = Router();

router.post("/merge", async (req, res) => {
  const { crawlJobId, pageIds } = req.body;

  if (!crawlJobId || !Array.isArray(pageIds) || pageIds.length === 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const state = await getCrawlState(crawlJobId);
  if (!state) {
    return res.status(404).json({ error: "Crawl job not found" });
  }

  const mergeJobId = uuid();

  await updateCrawlState(crawlJobId, (state) => {
    state.merge = {
      mergeJobId,
      status: "queued",
    };
    return state;
  });

  await mergeQueue.add("merge", {
    crawlJobId,
    mergeJobId,
    pageIds,
  });

  res.json({ mergeJobId, status: "queued" });
});

export default router;
