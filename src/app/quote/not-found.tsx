export default function QuoteNotFound() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 text-center shadow-card">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-2xl">
        🔍
      </div>
      <h1 className="mb-2 text-lg font-semibold text-ink-900">Quote not found</h1>
      <p className="text-sm text-ink-500">
        This link may have expired or been entered incorrectly. Please contact the business that
        sent it to you for an updated link.
      </p>
    </div>
  );
}
