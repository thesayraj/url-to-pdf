type PageStatus = "queued" | "processing" | "done" | "failed";

interface PageItem {
  pageId: string;
  url: string;
  status: PageStatus;
  downloadLink?: string;
}

interface CrawlJob {
  id: string;
  pages: PageItem[];
  status: "running" | "done";
}
