"use client";

import { useState, useEffect } from "react";

// In-memory runtime cache for blob URLs to avoid repeated reads
const memoryBlobUrlCache = new Map<string, string>();
const CACHE_NAME = "job_master_avatar_cache_v1";

/**
 * Custom hook to retrieve a cached image URL or fetch & cache it persistently
 * via the Cache API / IndexedDB, preventing redundant egress to Supabase Storage.
 */
export function useCachedImage(url?: string | null): {
  cachedUrl: string | null;
  isLoading: boolean;
  isError: boolean;
} {
  const [cachedUrl, setCachedUrl] = useState<string | null>(() => {
    if (!url) return null;
    return memoryBlobUrlCache.get(url) || url;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    if (!url || typeof window === "undefined") {
      setCachedUrl(null);
      setIsLoading(false);
      return;
    }

    // If it's a data URL, return directly
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      setCachedUrl(url);
      setIsLoading(false);
      return;
    }

    // 1. Check in-memory cache
    if (memoryBlobUrlCache.has(url)) {
      setCachedUrl(memoryBlobUrlCache.get(url)!);
      setIsLoading(false);
      return;
    }

    // 2. Check browser Cache Storage API
    let isCancelled = false;
    setIsLoading(true);

    const loadAndCacheImage = async () => {
      try {
        if ("caches" in window) {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(url);

          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            memoryBlobUrlCache.set(url, objectUrl);
            if (!isCancelled) {
              setCachedUrl(objectUrl);
              setIsLoading(false);
            }
            return;
          }

          // Fetch from network and store in Cache Storage for permanent client persistence
          try {
            const networkResponse = await fetch(url, {
              mode: "cors",
              cache: "force-cache",
            });

            if (networkResponse.ok) {
              await cache.put(url, networkResponse.clone());
              const blob = await networkResponse.blob();
              const objectUrl = URL.createObjectURL(blob);
              memoryBlobUrlCache.set(url, objectUrl);
              if (!isCancelled) {
                setCachedUrl(objectUrl);
                setIsLoading(false);
              }
              return;
            }
          } catch (netErr) {
            // If CORS restricts fetch, fall back to direct URL
          }
        }

        // Direct URL fallback
        if (!isCancelled) {
          setCachedUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setCachedUrl(url);
          setIsLoading(false);
          setIsError(true);
        }
      }
    };

    loadAndCacheImage();

    return () => {
      isCancelled = true;
    };
  }, [url]);

  return { cachedUrl, isLoading, isError };
}
