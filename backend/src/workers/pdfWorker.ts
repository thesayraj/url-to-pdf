import { Worker } from "bullmq";
import { redis } from "../redis";
import { updateCrawlState } from "../state/crawlState";

new Worker(
  "pdf-queue",
  async (job) => {
    const { crawlJobId, pageUrl } = job.data;

    // simulate work
    await new Promise((r) => setTimeout(r, 2000));

    await updateCrawlState(crawlJobId, (state) => {
      const page = state.pages.find((p: any) => p.url === pageUrl);
      if (page) {
        page.status = "done";
        page.pdfPath = `/pdfs/${pageUrl.replace("/", "")}.pdf`;
      }
      return state;
    });
  },
  { connection: redis }
);
