import { Worker } from "bullmq";
import { redis } from "../redis";
import { updateCrawlState } from "../state/crawlState";
import { pdfQueue } from "../queues/pdfQueue";

new Worker(
  "crawl-queue",
  async (job) => {
    const { crawlJobId, url } = job.data;

    // TODO: extract real pages
    const pages = ["/", "/about", "/contact"];

    await updateCrawlState(crawlJobId, (state) => {
      console.log("updating state: ", state)
      state.status = "processing";
      state.pages = pages.map((p, i) => ({
        pageId: `p${i}`,
        url: p,
        status: "queued",
        hasVideo: false,
      }));
      return state;
    });

    for (const page of pages) {
      await pdfQueue.add("render-pdf", {
        crawlJobId,
        pageUrl: page,
      });
    }
  },
  { connection: redis }
);
