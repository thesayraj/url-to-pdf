export type CrawlState = {
  crawlJobId;
  url;
  status: "queued" | "processing" | "failed" | "done";
  error?: string;
  pages: Array;
  merge?: any;
  createdAt: Number;
};
