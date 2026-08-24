import { NextResponse } from "next/server";
import { getCachedAppSettings, fetchAppSettingsFromDb } from "@/src/lib/app_settings";

export const dynamic = "force-dynamic";

export async function GET() {
  let settings;
  try {
    settings = await fetchAppSettingsFromDb();
  } catch (e) {
    settings = getCachedAppSettings();
  }

  const pwaConfig = (settings as any)?.pwaAssetLinks;

  const packageName = pwaConfig?.packageName || process.env.ANDROID_PACKAGE_NAME || "bd.com.jobmaster.twa";
  const sha256Fingerprints = pwaConfig?.sha256Fingerprints?.length
    ? pwaConfig.sha256Fingerprints
    : (process.env.ANDROID_SHA256_FINGERPRINTS 
        ? process.env.ANDROID_SHA256_FINGERPRINTS.split(",").map((s: string) => s.trim()) 
        : [
            // Standard PWABuilder default / placeholder signatures
            "14:6D:E9:7D:0F:52:AB:E0:47:66:3A:43:2D:E2:B6:81:49:EE:4B:E8:2C:9A:BB:2E:7C:1E:E7:57:9F:8B:2A:42"
          ]);

  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: sha256Fingerprints
      }
    }
  ];

  return NextResponse.json(assetLinks, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}
