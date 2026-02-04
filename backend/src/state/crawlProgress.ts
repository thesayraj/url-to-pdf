import { updateCrawlState } from "./crawlState";

export type PageFinalStatus = "done" | "failed";

export async function finalizePage(
  crawlJobId: string,
  pageUrl: string,
  update: {
    status: PageFinalStatus;
    hasVideo?: boolean;
    downloadLink?: string;
    error?: string;
  },
) {
  await updateCrawlState(crawlJobId, (state) => {
    const page = state.pages.find((p: any) => p.url === pageUrl);
    if (!page) return state;

    // update page-level state
    page.status = update.status;
    if (update.hasVideo !== undefined) page.hasVideo = update.hasVideo;
    if (update.downloadLink) page.downloadLink = update.downloadLink;
    if (update.error) page.error = update.error;

    // check if crawl job is finished
    const allFinished = state.pages.every(
      (p: any) => p.status === "done" || p.status === "failed",
    );

    if (allFinished) {
      state.status = state.pages.some((p: any) => p.status === "failed")
        ? "failed"
        : "done";
    }

    return state;
  });
}
