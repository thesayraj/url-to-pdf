import { Worker } from "bullmq";
import { chromium } from "playwright";
import path from "path";
import fs from "fs/promises";

import { redis } from "../redis";
import { updateCrawlState } from "../state/crawlState";
import { pageIdFromUrl } from "../utils/pageId";

const BASE_DIR = path.resolve("storage/jobs");

export const pdfWorker = new Worker(
  "pdf-queue",
  async (job) => {
    const { crawlJobId, pageUrl } = job.data as {
      crawlJobId: string;
      pageUrl: string;
    };

    const pageId = pageIdFromUrl(pageUrl);
    const pagesDir = path.join(BASE_DIR, crawlJobId, "pages");
    const pdfPath = path.join(pagesDir, `${pageId}.pdf`);

    let browser;

    try {
      await updateCrawlState(crawlJobId, (state) => {
        const page = state.pages.find((p: any) => p.url === pageUrl);
        if (page) page.status = "processing";
        return state;
      });

      await fs.mkdir(pagesDir, { recursive: true });

      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(pageUrl, {
        waitUntil: "networkidle",
        timeout: 30_000,
      });

      // Generate PDF
      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
      });

      await browser.close();

      await updateCrawlState(crawlJobId, (state) => {
        const page = state.pages.find((p: any) => p.url === pageUrl);
        if (page) {
          page.status = "done";
          page.pdfPath = pdfPath;
        }
        return state;
      });
    } catch (err: any) {
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }

      await updateCrawlState(crawlJobId, (state) => {
        const page = state.pages.find((p: any) => p.url === pageUrl);
        if (page) {
          page.status = "failed";
          page.error = err.message || "PDF generation failed";
        }
        return state;
      });

      throw err; // important for BullMQ retries
    }
  },
  {
    connection: redis,
  },
);
