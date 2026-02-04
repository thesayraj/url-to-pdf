import { Worker } from "bullmq";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

import { redis } from "../redis";
import { updateCrawlState } from "../state/crawlState";
import { env } from "../config/env";

const BASE_DIR = path.resolve("storage/jobs");

export const mergeWorker = new Worker(
  "merge-queue",
  async (job) => {
    const { crawlJobId, mergeJobId, pageIds } = job.data;

    const pagesDir = path.join(BASE_DIR, crawlJobId, "pages");
    const outputDir = path.join(BASE_DIR, crawlJobId, "pages");
    const outputPath = path.join(outputDir, "merged.pdf");

    try {
      await updateCrawlState(crawlJobId, (state) => {
        if (state.merge?.mergeJobId === mergeJobId) {
          state.merge.status = "processing";
        }
        return state;
      });

      const mergedPdf = await PDFDocument.create();

      for (const pageId of pageIds) {
        const pdfPath = path.join(pagesDir, `${pageId}.pdf`);
        const bytes = await fs.readFile(pdfPath);
        const pdf = await PDFDocument.load(bytes);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );
        copiedPages.forEach((p) => mergedPdf.addPage(p));
      }

      await fs.mkdir(outputDir, { recursive: true });
      const mergedBytes = await mergedPdf.save();
      await fs.writeFile(outputPath, mergedBytes);

      const downloadLink = `${env.BACKEND_HOST}/api/pdf/${crawlJobId}/merged.pdf`;

      await updateCrawlState(crawlJobId, (state) => {
        if (state.merge?.mergeJobId === mergeJobId) {
          state.merge.status = "done";
          state.merge.downloadLink = downloadLink;
        }
        return state;
      });
    } catch (err: any) {
      await updateCrawlState(crawlJobId, (state) => {
        if (state.merge?.mergeJobId === mergeJobId) {
          state.merge.status = "failed";
          state.merge.error = err.message || "Merge failed";
        }
        return state;
      });

      throw err;
    }
  },
  {
    connection: redis,
  },
);
