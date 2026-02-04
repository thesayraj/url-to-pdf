export function PageStatusView({ page }: { page: PageItem }) {
  if (page.status === "queued" || page.status === "processing") {
    return <span className="text-yellow-600">Generating...</span>;
  }

  if (page.status === "failed") {
    return <span className="text-red-600">Failed</span>;
  }

  return (
    <a
      href={`${page.downloadLink}`}
      download
      className="text-blue-600 underline"
    >
      Download PDF
    </a>
  );
}
