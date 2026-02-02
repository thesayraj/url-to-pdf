import { Queue } from "bullmq";
import { redis } from "../redis";

export const crawlQueue = new Queue("crawl-queue", {
  connection: redis,
});
