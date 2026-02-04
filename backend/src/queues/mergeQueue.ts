import { Queue } from "bullmq";
import { redis } from "../redis";

export const mergeQueue = new Queue("merge-queue", {
  connection: redis,
});
