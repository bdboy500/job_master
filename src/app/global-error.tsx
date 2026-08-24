'use client';

export default function GlobalError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="bn">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4 text-center">
          <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl shadow-xl p-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Something went wrong!</h2>
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-[#FF6A00] text-white font-semibold rounded-xl"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
