import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4 text-center">
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl shadow-xl p-8 space-y-4">
        <h2 className="text-4xl font-extrabold text-slate-950">404</h2>
        <h3 className="text-xl font-bold text-slate-800">Page Not Found</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          The requested page could not be found. Please return to the quiz homepage.
        </p>
        <Link
          href="/"
          prefetch={false}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/15"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

