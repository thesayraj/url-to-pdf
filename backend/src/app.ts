import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import crawlRoutes from "./routes/crawl.routes";
import fileRouter from "./routes/file";
import mergeRouter from "./routes/merge";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api", crawlRoutes);
app.use("/api", fileRouter);
app.use("/api", mergeRouter);

export default app;
