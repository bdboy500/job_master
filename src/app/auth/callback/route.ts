import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const handoff = requestUrl.searchParams.get("handoff");
  const source = requestUrl.searchParams.get("source");

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>লগইন সম্পন্ন হচ্ছে - Job Master</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
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
      box-sizing: border-box;
    }
    .card {
      background: white;
      padding: 32px 24px;
      border-radius: 24px;
      box-shadow: 0 12px 32px -6px rgba(15, 23, 42, 0.1);
      max-width: 370px;
      width: 100%;
      border: 1px solid #e2e8f0;
      box-sizing: border-box;
    }
    .spinner {
      width: 42px;
      height: 42px;
      border: 3.5px solid #ffedd5;
      border-top-color: #f97316;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 18px;
    }
    .check-badge {
      width: 54px;
      height: 54px;
      border-radius: 18px;
      background: #ecfdf5;
      color: #059669;
      border: 1.5px solid #a7f3d0;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 900;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { margin: 0 0 8px; font-size: 19px; font-weight: 800; color: #0f172a; line-height: 1.35; }
    p { margin: 0; font-size: 13.5px; color: #475569; line-height: 1.6; font-weight: 500; }
    .actions {
      display: none;
      flex-direction: column;
      gap: 10px;
      margin-top: 22px;
    }
    .btn-primary {
      background: #ff6a00;
      color: #ffffff;
      border: none;
      border-radius: 14px;
      padding: 13px 18px;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      width: 100%;
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 12.5px;
      font-weight: 700;
      text-decoration: none;
      display: block;
    }
    .hint {
      margin-top: 10px;
      font-size: 11.5px;
      color: #64748b;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div id="spinner" class="spinner"></div>
    <div id="checkBadge" class="check-badge">✓</div>
    <h2 id="title">লগইন সম্পন্ন হচ্ছে...</h2>
    <p id="subtitle">অনুগ্রহ করে কয়েক মুহূর্ত অপেক্ষা করুন। আপনার অ্যাকাউন্টে সংযুক্ত করা হচ্ছে...</p>
    <div id="actions" class="actions">
      <button id="closeBtn" type="button" class="btn-primary">অ্যাপে ফিরে যান (✕)</button>
      <a href="/" class="btn-secondary">ব্রাউজারেই ওপেন করুন</a>
      <div id="hintText" class="hint">উপরের বাম কোণার ✕ বা মোবাইলের Back বাটনে চাপ দিলেই অ্যাপে ফিরে যাবেন।</div>
    </div>
  </div>
  <script>
    (async function() {
      var code = ${JSON.stringify(code)};
      var error = ${JSON.stringify(error)};
      var errorDescription = ${JSON.stringify(errorDescription)};
      var handoff = ${JSON.stringify(handoff)};
      var source = ${JSON.stringify(source)};
      var hash = window.location.hash || "";
      var search = window.location.search || "";

      var accessToken = null;
      var refreshToken = null;
      if (hash && hash.indexOf("access_token=") !== -1) {
        try {
          var hashStr = hash.charAt(0) === "#" ? hash.substring(1) : hash;
          var hashParams = new URLSearchParams(hashStr);
          accessToken = hashParams.get("access_token");
          refreshToken = hashParams.get("refresh_token");
        } catch (e) {}
      }

      var payload = {
        type: "SUPABASE_AUTH_CALLBACK",
        code: code,
        hash: hash,
        search: search,
        error: error,
        errorDescription: errorDescription
      };

      var hasOpener = false;
      try {
        if (window.opener && window.opener !== window && !window.opener.closed) {
          window.opener.postMessage(payload, "*");
          hasOpener = true;
        }
      } catch (e) {}

      // BroadcastChannel across tabs on same origin
      try {
        if (typeof BroadcastChannel !== "undefined") {
          var bc = new BroadcastChannel("jobmaster_auth_channel");
          bc.postMessage(payload);
          setTimeout(function() {
            try { bc.close(); } catch (err) {}
          }, 500);
        }
      } catch (e) {}

      // Fallback localStorage signal
      try {
        localStorage.setItem("jobmaster_oauth_signal", JSON.stringify({
          time: Date.now(),
          code: code,
          hash: hash,
          error: error,
          errorDescription: errorDescription
        }));
      } catch (e) {}

      // Send session credentials to server handoff relay so an underlying Kotlin WebView receives login
      if (handoff) {
        try {
          await fetch("/api/auth/handoff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: handoff,
              code: code,
              access_token: accessToken,
              refresh_token: refreshToken,
              error: error,
              errorDescription: errorDescription
            })
          });
        } catch (handoffErr) {}
      }

      function showReturnToAppUI() {
        var spinner = document.getElementById("spinner");
        var checkBadge = document.getElementById("checkBadge");
        var title = document.getElementById("title");
        var subtitle = document.getElementById("subtitle");
        var actions = document.getElementById("actions");
        var closeBtn = document.getElementById("closeBtn");
        var hintText = document.getElementById("hintText");

        if (spinner) spinner.style.display = "none";
        if (checkBadge) checkBadge.style.display = "flex";
        if (title) title.textContent = error ? "লগইন সম্পন্ন হয়নি" : "অ্যাপে লগইন সম্পন্ন হয়েছে!";
        if (subtitle) {
          subtitle.textContent = error
            ? (errorDescription || error)
            : "আপনার Job Master অ্যাপের ভেতরে লগইন সফলভাবে যুক্ত হয়েছে। অনুগ্রহ করে উপরের ক্রস (✕) বা মোবাইলের Back বাটনে চাপ দিয়ে অ্যাপে ফিরে যান।";
        }
        if (actions) actions.style.display = "flex";
        if (closeBtn) {
          closeBtn.onclick = function() {
            try { window.close(); } catch (e) {}
            try { window.history.go(-3); } catch (e) {}
            if (hintText) {
              hintText.textContent = "ব্রাউজার ট্যাবটি বন্ধ করতে উপরের বাম কোণার (✕) বা মোবাইলের Back বাটনে চাপ দিন।";
            }
          };
        }
      }

      async function completeLocalSessionAndRedirect() {
        try {
          if (window.supabase) {
            var sb = window.supabase.createClient(
              "https://cqwssqcpxrwkivrrmuou.supabase.co",
              "sb_publishable_LmhA6lMdI1LwZ4SnCaiPMg_0Fu5Saze"
            );

            if (accessToken && refreshToken) {
              await sb.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              var uRes = await sb.auth.getUser();
              if (uRes && uRes.data && uRes.data.user) {
                var user = uRes.data.user;
                var profRes = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
                var prof = profRes.data || {
                  id: user.id,
                  email: user.email || "",
                  full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "শিক্ষার্থী",
                  phone_number: user.user_metadata?.phone_number || "",
                  student_id: "JM-" + Math.floor(100000 + Math.random() * 900000),
                  role: "Student",
                  status: "Active"
                };
                localStorage.setItem("job_master_current_user", JSON.stringify(prof));
              }
            } else if (code) {
              var ex = await sb.auth.exchangeCodeForSession(code);
              if (ex && ex.data && ex.data.session) {
                var user2 = ex.data.session.user;
                var profRes2 = await sb.from("profiles").select("*").eq("id", user2.id).maybeSingle();
                var prof2 = profRes2.data || {
                  id: user2.id,
                  email: user2.email || "",
                  full_name: user2.user_metadata?.full_name || user2.user_metadata?.name || user2.email?.split("@")[0] || "শিক্ষার্থী",
                  phone_number: user2.user_metadata?.phone_number || "",
                  student_id: "JM-" + Math.floor(100000 + Math.random() * 900000),
                  role: "Student",
                  status: "Active"
                };
                localStorage.setItem("job_master_current_user", JSON.stringify(prof2));
              }
            }
          }
        } catch (authErr) {}

        window.location.replace("/");
      }

      // Detect whether we are truly running inside an Android WebView (NOT Chrome Custom Tab!)
      var ua = navigator.userAgent || "";
      var isRealWebView =
        Boolean(window.AndroidInterface) ||
        Boolean(window.AndroidBridge) ||
        Boolean(window.Android) ||
        Boolean(window.isNativeApp) ||
        /;\\s*wv\\)/i.test(ua) ||
        (/Android/i.test(ua) && /Version\\/[0-9.]+/i.test(ua) && !/Chrome\\/[0-9.]+\\s+Mobile/i.test(ua));

      if (isRealWebView) {
        await completeLocalSessionAndRedirect();
        return;
      }

      // Desktop / standard popup with opener
      if (hasOpener) {
        setTimeout(function() {
          try { window.close(); } catch (e) {}
          setTimeout(function() {
            showReturnToAppUI();
          }, 600);
        }, 500);
        return;
      }

      // If initiated from Kotlin WebView (now inside Chrome Custom Tab), check if app claimed session
      if (handoff) {
        var claimed = false;
        var checks = source === "app" ? 2 : 3;
        for (var i = 0; i < checks; i++) {
          await new Promise(function(r) { setTimeout(r, 550); });
          try {
            var stRes = await fetch("/api/auth/handoff?status=1&id=" + encodeURIComponent(handoff));
            if (stRes.ok) {
              var stData = await stRes.json();
              if (stData && stData.claimed) {
                claimed = true;
                break;
              }
            }
          } catch (e) {}
        }

        if (claimed || source === "app") {
          try { window.close(); } catch (e) {}
          showReturnToAppUI();
          return;
        }
      }

      // Standalone browser login (not inside app overlay): complete session & go home
      await completeLocalSessionAndRedirect();
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
