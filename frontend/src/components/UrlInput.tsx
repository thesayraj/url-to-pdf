interface UrlInputCardProps {
  url: string;
  loading?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function UrlInputCard({
  url,
  loading = false,
  onChange,
  onSubmit,
}: UrlInputCardProps) {
  return (
    <div className="flex justify-center mt-24">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          <button
            onClick={onSubmit}
            disabled={!url || loading}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Starting..." : "Start"}
          </button>
        </div>
      </div>
    </div>
  );
}
