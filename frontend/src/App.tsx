import { useState, useEffect } from "react";
import { PageStatusView } from "./components/PageStatus";
import { UrlInputCard } from "./components/UrlInput";
import API from "./api";

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);

  const [excludedPages, setExcludedPages] = useState<Set<string>>(new Set());

  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeJobId, setMergeJobId] = useState<string | null>(null);

  const visiblePages = pages.filter((p) => !excludedPages.has(p.pageId));
  function removePage(id: string) {
    setExcludedPages((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  async function startCrawl() {
    resetStates();
    setLoading(true);

    try {
      const { data } = await API.post("/crawl", { url });
      setJobId(data.crawlJobId);
    } catch (err: any) {
      console.error("Error in crawling:", err);

      const errorMessage =
        err.response?.data?.details || "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function resetStates() {
    setError(null);
    setExcludedPages(new Set());
    setMergeJobId(null);
    setJobId(null);
    setLoading(false);
  }

  async function mergePdfs() {
    if (!jobId || mergeLoading) return;

    const pageIds = visiblePages
      .filter((p) => p.status === "done")
      .map((p) => p.pageId);

    if (pageIds.length === 0) return;

    try {
      setMergeLoading(true);

      const { data } = await API.post(`/merge`, {
        crawlJobId: jobId,
        pageIds,
      });

      setMergeJobId(data.mergeJobId);
    } catch (err) {
      console.error("Merge failed", err);
      setMergeLoading(false);
    }
  }

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      const { data } = await API.get(`/crawl/${jobId}/status`);

      setPages(data.pages);

      if (data.status === "failed") {
        setError(data.error);
        setLoading(false);
        clearInterval(interval);
      }

      if (data.status === "done") {
        setLoading(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  useEffect(() => {
    if (!jobId || !mergeJobId) return;

    const interval = setInterval(async () => {
      const { data } = await API.get(`/crawl/${jobId}/status`);

      if (!data.merge) return;

      if (data.merge.status === "processing") {
        setMergeLoading(true);
      }

      if (data.merge.status === "done") {
        setMergeLoading(false);
        window.open(data.merge.downloadLink);
        clearInterval(interval);
      }

      if (data.merge.status === "failed") {
        setMergeLoading(false);
        setError(data.merge.error || "Merge failed");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, mergeJobId]);

  return (
    <div className="min-h-screen min-w-screen p-6 flex-row justify-center items-center bg-blue-50">
      <h1 className="text-3xl font-semibold text-gray-800 mb-2 text-center">
        Website to PDF
      </h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        Enter a website URL and convert all pages into PDFs
      </p>

      <UrlInputCard
        url={url}
        loading={loading}
        onChange={setUrl}
        onSubmit={startCrawl}
      />

      <div className="max-w-4xl mx-auto mt-10 bg-white rounded-xl shadow divide-y">
        {visiblePages.map((p) => (
          <div
            key={p.pageId}
            className="flex justify-between items-center px-4 py-3 gap-4"
          >
            <span className="text-sm break-all flex-1">{p.url}</span>

            <PageStatusView page={p} />

            <button
              onClick={() => removePage(p.pageId)}
              className="text-gray-400 hover:text-red-500 text-sm"
              title="Remove page"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {visiblePages.some((p) => p.status === "done") && (
        <div className="max-w-4xl mx-auto mt-4 flex justify-end">
          <button
            onClick={mergePdfs}
            disabled={mergeLoading}
            className="mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white disabled:opacity-50"
          >
            {mergeLoading ? "Merging PDFs..." : "Merge PDFs"}
          </button>
        </div>
      )}

      {loading && <p className="mt-4 text-gray-500">Crawling...</p>}
      {error && <p className="text-red-500 text-sm font-medium">⚠️ {error}</p>}
    </div>
  );
}
