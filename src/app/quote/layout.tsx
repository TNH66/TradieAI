export default function PublicQuoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">{children}</div>
      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-ink-400">
        Powered by TradieAI
      </p>
    </div>
  );
}
