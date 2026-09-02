import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Lightweight HTML page that notifies opener / BroadcastChannel and self-closes
  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>লগইন সম্পন্ন হচ্ছে - Job Master</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      text-align: center;
      padding: 24px;
    }
    .card {
      background: white;
      padding: 32px 24px;
      border-radius: 20px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08);
      max-width: 360px;
      width: 100%;
      border: 1px solid #e2e8f0;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3.5px solid #ffedd5;
      border-top-color: #f97316;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 18px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { margin: 0 0 8px; font-size: 18px; font-weight: 800; color: #1e293b; }
    p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>লগইন সম্পন্ন হচ্ছে...</h2>
    <p>অনুগ্রহ করে কয়েক মুহূর্ত অপেক্ষা করুন। এই উইন্ডোটি স্বয়ংক্রিয়ভাবে বন্ধ হয়ে যাবে।</p>
  </div>
  <script>
    (function() {
      var code = ${JSON.stringify(code)};
      var error = ${JSON.stringify(error)};
      var errorDescription = ${JSON.stringify(errorDescription)};
      var hash = window.location.hash || "";
      var search = window.location.search || "";

      var payload = {
        type: "SUPABASE_AUTH_CALLBACK",
        code: code,
        hash: hash,
        search: search,
        error: error,
        errorDescription: errorDescription
      };

      // 1. PostMessage to opener window if accessible
      try {
        if (window.opener && window.opener !== window) {
          window.opener.postMessage(payload, "*");
        }
      } catch (e) {
        console.warn("Opener postMessage error:", e);
      }

      // 2. Broadcast via BroadcastChannel (works even if opener is severed by cross-origin redirect)
      try {
        if (typeof BroadcastChannel !== "undefined") {
          var bc = new BroadcastChannel("jobmaster_auth_channel");
          bc.postMessage(payload);
          setTimeout(function() {
            try { bc.close(); } catch (err) {}
          }, 500);
        }
      } catch (e) {
        console.warn("BroadcastChannel error:", e);
      }

      // 3. Fallback: Save to localStorage signal
      try {
        localStorage.setItem("jobmaster_oauth_signal", JSON.stringify({
          time: Date.now(),
          code: code,
          hash: hash,
          error: error
        }));
      } catch (e) {}

      // Auto-close popup after short delay
      setTimeout(function() {
        try {
          window.close();
        } catch (e) {}
      }, 750);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
