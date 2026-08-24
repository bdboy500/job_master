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
            // Job Master official PWABuilder SHA256 signatures
            "43:9A:CF:62:2E:66:B6:F6:DE:ED:69:FD:9C:D4:CD:88:83:AA:89:AD:8A:A1:37:82:8C:3C:50:51:B5:EA:3C:3E",
            "1F:31:53:2C:36:87:D9:2F:F4:3C:1E:24:52:B9:1E:14:05:C9:C2:BD:A7:6A:7C:16:1D:CB:3D:7B:65:AB:FC:37"
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
