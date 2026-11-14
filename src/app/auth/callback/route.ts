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
      padding: 20px;
      box-sizing: border-box;
    }
    body.is-app-done {
      justify-content: flex-start;
      align-items: stretch;
      padding: 10px 18px 24px;
    }
    .arrow-row {
      display: none;
      width: 100%;
      justify-content: flex-start;
      align-items: flex-start;
      padding: 8px 0 8px 14px;
      box-sizing: border-box;
    }
    .arrow-bounce {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      animation: pointCross 1.05s ease-in-out infinite;
    }
    .arrow-icon {
      display: block;
      width: 48px;
      height: 48px;
      object-fit: contain;
      transform: rotate(-122deg);
      mix-blend-mode: multiply;
      user-select: none;
      -webkit-user-drag: none;
    }
    @keyframes pointCross {
      0%, 100% {
        transform: translate(0px, 0px) scale(1);
      }
      50% {
        transform: translate(-6px, -9px) scale(1.08);
      }
    }
    .card {
      background: white;
      padding: 28px 20px;
      border-radius: 22px;
      box-shadow: 0 12px 32px -6px rgba(15, 23, 42, 0.1);
      max-width: 390px;
      width: 100%;
      margin: 0 auto;
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
      width: 56px;
      height: 56px;
      border-radius: 18px;
      background: #ecfdf5;
      color: #059669;
      border: 1.5px solid #a7f3d0;
      display: none;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .check-badge svg {
      width: 28px;
      height: 28px;
      display: block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { margin: 0 0 10px; font-size: 21px; font-weight: 800; color: #0f172a; line-height: 1.35; }
    p { margin: 0; font-size: 14px; color: #475569; line-height: 1.55; font-weight: 600; }
  </style>
</head>
<body>
  <div id="arrowRow" class="arrow-row" aria-hidden="true">
    <div class="arrow-bounce">
      <img src="/assets/aistudio/icons8-arrow-240_40f90c81.png" alt="" class="arrow-icon" />
    </div>
  </div>
  <div class="card">
    <div id="spinner" class="spinner"></div>
    <div id="checkBadge" class="check-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    <h2 id="title">লগইন সম্পন্ন হচ্ছে...</h2>
    <p id="subtitle">অনুগ্রহ করে কয়েক মুহূর্ত অপেক্ষা করুন। আপনার অ্যাকাউন্টে সংযুক্ত করা হচ্ছে...</p>
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
        var arrowRow = document.getElementById("arrowRow");
        var spinner = document.getElementById("spinner");
        var checkBadge = document.getElementById("checkBadge");
        var title = document.getElementById("title");
        var subtitle = document.getElementById("subtitle");

        document.body.classList.add("is-app-done");
        document.title = error ? "লগইন সম্পন্ন হয়নি - Job Master" : "এপে লগ ইন সম্পন্ন হয়েছে - Job Master";

        if (arrowRow) arrowRow.style.display = "flex";
        if (spinner) spinner.style.display = "none";
        if (checkBadge) checkBadge.style.display = "flex";
        if (title) title.textContent = error ? "লগইন সম্পন্ন হয়নি" : "এপে লগ ইন সম্পন্ন হয়েছে";
        if (subtitle) {
          subtitle.textContent = error
            ? (errorDescription || error)
            : "উপরের বামে ক্রস (X) ক্লিক করে এপে যান";
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
