export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
          T
        </div>
        <span className="text-lg font-semibold text-ink-900">TradieAI</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
