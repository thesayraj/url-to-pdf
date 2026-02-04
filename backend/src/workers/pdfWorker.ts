import { Worker } from "bullmq";
import { chromium } from "playwright";
import path from "path";
import fs from "fs/promises";

import { env } from "../config/env";
import { redis } from "../redis";
import { getCrawlState, updateCrawlState } from "../state/crawlState";
import { finalizePage } from "../state/crawlProgress";

const BASE_DIR = path.resolve("storage/jobs");

export const pdfWorker = new Worker(
  "pdf-queue",
  async (job) => {
    const { crawlJobId, pageUrl } = job.data as {
      crawlJobId: string;
      pageUrl: string;
    };

    const state = await getCrawlState(crawlJobId);
    const pageData = state.pages.find((p: any) => p.url === pageUrl);
    const pageId = pageData.pageId;

    const pagesDir = path.join(BASE_DIR, crawlJobId, "pages");
    const pdfPath = `${pagesDir}/${pageId}.pdf`;
    const downloadLink = `${env.BACKEND_HOST}/api/pdf/${crawlJobId}/${pageId}.pdf`;

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

      const hasVideo = Boolean(
        await page.$("video, iframe[src*='youtube'], iframe[src*='vimeo']"),
      );

      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
      });

      await browser.close();

      await finalizePage(crawlJobId, pageUrl, {
        status: "done",
        hasVideo,
        downloadLink,
      });
    } catch (err: any) {
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }

      await finalizePage(crawlJobId, pageUrl, {
        status: "failed",
        error: err.message || "PDF generation failed",
      });

      throw err;
    }
  },
  {
    connection: redis,
  },
);
