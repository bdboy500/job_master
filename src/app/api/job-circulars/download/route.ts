import { NextRequest, NextResponse } from "next/server";
import { extractGoogleDriveFileId } from "@/src/lib/job_circulars";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function buildSafeFilename(rawName: string, fileType: string, contentType: string): string {
  const cleanedBase = (rawName || "jobmaster-circular")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "jobmaster-circular";

  let ext = fileType === "image" ? "jpg" : "pdf";
  if (contentType.includes("pdf")) ext = "pdf";
  else if (contentType.includes("png")) ext = "png";
  else if (contentType.includes("webp")) ext = "webp";
  else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";

  const hasExt = /\.(pdf|png|jpe?g|webp)$/i.test(cleanedBase);
  return hasExt ? cleanedBase : `${cleanedBase}.${ext}`;
}

async function fetchGoogleDriveBinary(driveId: string, preferredType: string): Promise<Response | null> {
  const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
  const res = await fetch(directDownloadUrl, {
    headers: { "User-Agent": BROWSER_UA },
    redirect: "follow",
    cache: "no-store",
  });

  const cType = (res.headers.get("content-type") || "").toLowerCase();

  // Direct binary received cleanly
  if (res.ok && !cType.includes("text/html")) {
    return res;
  }

  // Handle Google Drive large-file confirmation page or interstitial HTML
  const html = await res.text();
  const cookies = res.headers.get("set-cookie") || "";

  // Extract confirm/uuid params from Drive virus-scan warning form or links
  const actionMatch = html.match(/action="([^"]+)"/i);
  const idMatch = html.match(/name="id"\s+value="([^"]+)"/i);
  const exportMatch = html.match(/name="export"\s+value="([^"]+)"/i);
  const confirmMatch =
    html.match(/name="confirm"\s+value="([^"]+)"/i) ||
    html.match(/confirm=([a-zA-Z0-9_-]+)/i);
  const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/i);

  if (confirmMatch?.[1]) {
    const baseAction = actionMatch?.[1]?.startsWith("http")
      ? actionMatch[1]
      : "https://drive.usercontent.google.com/download";
    const params = new URLSearchParams({
      id: idMatch?.[1] || driveId,
      export: exportMatch?.[1] || "download",
      confirm: confirmMatch[1],
    });
    if (uuidMatch?.[1]) params.set("uuid", uuidMatch[1]);

    const confirmedRes = await fetch(`${baseAction}?${params.toString()}`, {
      headers: {
        "User-Agent": BROWSER_UA,
        ...(cookies ? { Cookie: cookies } : {}),
      },
      redirect: "follow",
      cache: "no-store",
    });

    const confirmedType = (confirmedRes.headers.get("content-type") || "").toLowerCase();
    if (confirmedRes.ok && !confirmedType.includes("text/html")) {
      return confirmedRes;
    }
  }

  // Image fallback via Google Drive high-res thumbnail/CDN endpoint
  if (preferredType === "image") {
    for (const imgUrl of [
      `https://lh3.googleusercontent.com/d/${driveId}=s2048`,
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`,
    ]) {
      const imgRes = await fetch(imgUrl, {
        headers: { "User-Agent": BROWSER_UA },
        redirect: "follow",
        cache: "no-store",
      });
      const imgType = (imgRes.headers.get("content-type") || "").toLowerCase();
      if (imgRes.ok && imgType.startsWith("image/")) {
        return imgRes;
      }
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get("url")?.trim() || "";
    const fileName = req.nextUrl.searchParams.get("name")?.trim() || "jobmaster-circular";
    const fileType = req.nextUrl.searchParams.get("type")?.trim() || "pdf";
    const mode = req.nextUrl.searchParams.get("mode")?.trim() || "download";

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // 1. Safe local public file support (e.g., /assets/...)
    if (rawUrl.startsWith("/")) {
      const safeRel = path.normalize(rawUrl).replace(/^(\.\.(\/|\\|$))+/, "");
      const fullPath = path.join(process.cwd(), "public", safeRel);
      const publicRoot = path.join(process.cwd(), "public");
      if (fullPath.startsWith(publicRoot) && fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        const cType =
          ext === ".pdf"
            ? "application/pdf"
            : ext === ".png"
            ? "image/png"
            : ext === ".webp"
            ? "image/webp"
            : ext === ".svg"
            ? "image/svg+xml"
            : "image/jpeg";
        const safeName = buildSafeFilename(fileName, fileType, cType);
        const asciiName = safeName.replace(/[^\x20-\x7E]/g, "_");
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": cType,
            "Content-Disposition":
              mode === "preview"
                ? "inline"
                : `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
            "Cache-Control": mode === "preview" ? "public, max-age=3600" : "no-store",
          },
        });
      }
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Validate HTTP/HTTPS URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
    }

    // 2. Google Drive or Remote URL download/preview proxy
    const driveId = extractGoogleDriveFileId(rawUrl);
    let upstreamRes: Response | null = null;

    if (driveId) {
      upstreamRes = await fetchGoogleDriveBinary(driveId, fileType);
      if (!upstreamRes) {
        if (mode === "download") {
          return NextResponse.redirect(`https://drive.google.com/uc?export=download&id=${driveId}`, 302);
        }
        return NextResponse.json(
          { error: "Google Drive ফাইলটি পাবলিক করা নেই অথবা প্রিভিউ পাওয়া যায়নি।" },
          { status: 403 }
        );
      }
    } else {
      upstreamRes = await fetch(rawUrl, {
        headers: { "User-Agent": BROWSER_UA },
        redirect: "follow",
        cache: "no-store",
      });
      if (!upstreamRes.ok) {
        return NextResponse.json(
          { error: `Failed to fetch remote file (${upstreamRes.status})` },
          { status: 502 }
        );
      }
    }

    const rawContentType = (upstreamRes.headers.get("content-type") || "").toLowerCase();
    const resolvedContentType =
      rawContentType && !rawContentType.includes("octet-stream")
        ? rawContentType
        : fileType === "image"
        ? "image/jpeg"
        : "application/pdf";

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const safeName = buildSafeFilename(fileName, fileType, resolvedContentType);
    const asciiName = safeName.replace(/[^\x20-\x7E]/g, "_");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": resolvedContentType,
        "Content-Disposition":
          mode === "preview"
            ? "inline"
            : `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        "Cache-Control": mode === "preview" ? "public, max-age=3600" : "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Circular download failed" },
      { status: 500 }
    );
  }
}
