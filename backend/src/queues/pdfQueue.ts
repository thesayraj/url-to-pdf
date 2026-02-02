import { Queue } from "bullmq";
import { redis } from "../redis";

export const pdfQueue = new Queue("pdf-queue", {
  connection: redis,
});
