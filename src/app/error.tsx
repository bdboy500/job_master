'use client';

import { useEffect, useState } from 'react';

const ROUTE_RETRY_GUARD_KEY = 'jobmaster_route_error_auto_reload_ts';

function isRecoverableError(err: Error & { digest?: string }): boolean {
  const msg = String(err?.message || '').toLowerCase();
  return (
    msg.includes('chunkloaderror') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('hydration')
  );
}

async function clearAppCaches() {
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.active) {
        reg.active.postMessage({ type: 'CLEAR_ALL_CACHES' });
      }
      await reg?.update().catch(() => {});
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {}
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isRecoverableError(error)) return;

    try {
      const lastTs = Number(sessionStorage.getItem(ROUTE_RETRY_GUARD_KEY) || '0');
      if (lastTs && Date.now() - lastTs < 25000) return;
      sessionStorage.setItem(ROUTE_RETRY_GUARD_KEY, String(Date.now()));
    } catch (e) {
      return;
    }

    setIsRecovering(true);
    clearAppCaches().finally(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('_recover', String(Date.now()));
        window.location.replace(url.toString());
      } catch (e) {
        window.location.reload();
      }
    });
  }, [error]);

  const handleRetry = async () => {
    setIsRecovering(true);
    await clearAppCaches();
    try {
      reset();
    } catch (e) {}
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('_retry', String(Date.now()));
        window.location.replace(url.toString());
      } catch (e) {
        window.location.reload();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white text-slate-800">
      <h2 className="text-xl font-bold mb-2">ত্রুটি দেখা দিয়েছে (Something went wrong)</h2>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
        {isRecovering
          ? 'অ্যাপ রিলোড করা হচ্ছে, অনুগ্রহ করে একটু অপেক্ষা করুন...'
          : 'নেটওয়ার্ক ধীরগতির কারণে পেজ লোড সম্পূর্ণ হয়নি। নিচের বাটনে চাপ দিয়ে আবার চেষ্টা করুন।'}
      </p>
      <button
        onClick={handleRetry}
        disabled={isRecovering}
        className="mt-5 px-6 py-3 rounded-xl bg-[#FF6A00] text-white font-bold text-sm shadow-sm active:scale-95 transition disabled:opacity-70"
      >
        {isRecovering ? 'লোড হচ্ছে...' : 'পুনরায় চেষ্টা করুন'}
      </button>
    </div>
  );
}
