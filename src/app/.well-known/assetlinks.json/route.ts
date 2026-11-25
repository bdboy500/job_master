import { NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { ANDROID_PACKAGE_ID } from "@/src/lib/app_links";

export const dynamic = "force-dynamic";

const CLOUD_KV_URL =
  "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_app_settings_v2";

function normalizeFingerprint(raw: string): string {
  const cleaned = raw.trim().toUpperCase();
  if (!cleaned) return "";
  // If user pasted 64 raw hex chars without colons, format as AA:BB:CC:...
  if (/^[0-9A-F]{64}$/.test(cleaned)) {
    return cleaned.match(/.{2}/g)?.join(":") || cleaned;
  }
  return cleaned;
}

function collectFingerprints(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out = new Set<string>();
  for (const item of list) {
    if (typeof item === "string") {
      for (const part of item.split(/[\s,;]+/)) {
        const norm = normalizeFingerprint(part);
        if (norm && /^[0-9A-F]{2}(:[0-9A-F]{2}){31}$/.test(norm)) {
          out.add(norm);
        }
      }
    }
  }
  return Array.from(out);
}

export async function GET() {
  let packageName = (process.env.ANDROID_PACKAGE_NAME || "").trim() || ANDROID_PACKAGE_ID;
  const fingerprints = new Set<string>();

  if (process.env.ANDROID_SHA256_FINGERPRINTS) {
    for (const fp of collectFingerprints(
      process.env.ANDROID_SHA256_FINGERPRINTS.split(/[\s,;]+/)
    )) {
      fingerprints.add(fp);
    }
  }

  let loadedFromDb = false;

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "home_display_settings")
        .maybeSingle();

      const assetLinks = !error ? data?.value?.pwaAssetLinks : null;
      if (assetLinks) {
        loadedFromDb = true;
        if (typeof assetLinks.packageName === "string" && assetLinks.packageName.trim()) {
          packageName = assetLinks.packageName.trim();
        }
        for (const fp of collectFingerprints(assetLinks.sha256Fingerprints)) {
          fingerprints.add(fp);
        }
      }
    }
  } catch (err) {
    console.warn("assetlinks.json supabase read error:", err);
  }

  if (!loadedFromDb) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(CLOUD_KV_URL, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const kvData = await res.json();
        const assetLinks = kvData?.pwaAssetLinks;
        if (assetLinks) {
          if (typeof assetLinks.packageName === "string" && assetLinks.packageName.trim()) {
            packageName = assetLinks.packageName.trim();
          }
          for (const fp of collectFingerprints(assetLinks.sha256Fingerprints)) {
            fingerprints.add(fp);
          }
        }
      }
    } catch {
      // Ignore KV fallback errors
    }
  }

  const payload = [
    {
      relation: [
        "delegate_permission/common.handle_all_urls",
        "delegate_permission/common.get_login_creds",
      ],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: Array.from(fingerprints),
      },
    },
  ];

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
