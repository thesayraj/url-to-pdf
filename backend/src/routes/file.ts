import path from "path";
import express from "express";

const router = express.Router();

router.get("/pdf/:crawlJobId/:fileName", (req, res) => {
  const { crawlJobId, fileName } = req.params;

  const filePath = path.join(
    process.cwd(),
    "storage",
    "jobs",
    crawlJobId,
    "pages",
    fileName
  );

  res.download(filePath, fileName, (err) => {
    if (err) {
      res.status(404).json({ error: "File not found" });
    }
  });
});

export default router;
