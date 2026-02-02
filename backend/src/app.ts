import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import crawlRoutes from "./routes/crawl.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api", crawlRoutes);

export default app;
