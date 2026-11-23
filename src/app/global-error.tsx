'use client';

import { useEffect, useState } from 'react';

const GLOBAL_RETRY_GUARD_KEY = 'jobmaster_global_error_auto_reload_ts';

function isRecoverableAssetError(err: Error & { digest?: string }): boolean {
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

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isRecoverableAssetError(error)) return;

    try {
      const lastTs = Number(sessionStorage.getItem(GLOBAL_RETRY_GUARD_KEY) || '0');
      if (lastTs && Date.now() - lastTs < 25000) return;
      sessionStorage.setItem(GLOBAL_RETRY_GUARD_KEY, String(Date.now()));
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

  const handleHardRetry = async () => {
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
    <html lang="bn">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            backgroundColor: '#FFFFFF',
            color: '#1E293B',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            ত্রুটি দেখা দিয়েছে (Something went wrong)
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '340px', lineHeight: 1.5 }}>
            {isRecovering
              ? 'অ্যাপ রিলোড করা হচ্ছে, অনুগ্রহ করে একটু অপেক্ষা করুন...'
              : 'নেটওয়ার্ক ধীরগতির কারণে পেজ লোড সম্পূর্ণ হয়নি। নিচের বাটনে চাপ দিয়ে আবার চেষ্টা করুন।'}
          </p>
          <button
            onClick={handleHardRetry}
            disabled={isRecovering}
            style={{
              padding: '12px 24px',
              marginTop: '18px',
              backgroundColor: '#FF6A00',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: isRecovering ? 'wait' : 'pointer',
              fontWeight: 'bold',
              fontSize: '15px',
              opacity: isRecovering ? 0.75 : 1,
            }}
          >
            {isRecovering ? 'লোড হচ্ছে...' : 'পুনরায় চেষ্টা করুন'}
          </button>
        </div>
      </body>
    </html>
  );
}
