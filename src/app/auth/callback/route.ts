import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Lightweight HTML page that notifies opener / BroadcastChannel or self-exchanges in Android WebView
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
    <p>অনুগ্রহ করে কয়েক মুহূর্ত অপেক্ষা করুন। অ্যাপে ফিরে যাওয়া হচ্ছে...</p>
  </div>
  <script>
    (async function() {
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

      var hasOpener = false;
      try {
        if (window.opener && window.opener !== window && !window.opener.closed) {
          window.opener.postMessage(payload, "*");
          hasOpener = true;
        }
      } catch (e) {
        console.warn("Opener postMessage notice:", e);
      }

      // BroadcastChannel across windows/tabs
      try {
        if (typeof BroadcastChannel !== "undefined") {
          var bc = new BroadcastChannel("jobmaster_auth_channel");
          bc.postMessage(payload);
          setTimeout(function() {
            try { bc.close(); } catch (err) {}
          }, 500);
        }
      } catch (e) {}

      // Fallback: Save to localStorage signal
      try {
        localStorage.setItem("jobmaster_oauth_signal", JSON.stringify({
          time: Date.now(),
          code: code,
          hash: hash,
          error: error
        }));
      } catch (e) {}

      // Check if Android WebView or standalone navigation (no opener)
      var isAndroidWebView = Boolean(window.AndroidInterface) || !hasOpener;

      if (isAndroidWebView) {
        // Complete session in current WebView window
        try {
          if (window.supabase) {
            var sb = window.supabase.createClient(
              "https://cqwssqcpxrwkivrrmuou.supabase.co",
              "sb_publishable_LmhA6lMdI1LwZ4SnCaiPMg_0Fu5Saze"
            );

            if (code) {
              try {
                var ex = await sb.auth.exchangeCodeForSession(code);
                if (ex && ex.data && ex.data.session) {
                  var user = ex.data.session.user;
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
              } catch (exErr) {
                console.warn("Exchange code notice:", exErr);
              }
            } else if (hash && hash.includes("access_token=")) {
              try {
                var hashStr = hash.startsWith("#") ? hash.substring(1) : hash;
                var params = new URLSearchParams(hashStr);
                var at = params.get("access_token");
                var rt = params.get("refresh_token");
                if (at && rt) {
                  await sb.auth.setSession({ access_token: at, refresh_token: rt });
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
                }
              } catch (hashErr) {
                console.warn("Hash session notice:", hashErr);
              }
            }
          }
        } catch (authErr) {
          console.warn("Direct auth exchange warning:", authErr);
        }

        // Instantly navigate back to home page
        window.location.replace("/");
        return;
      }

      // If desktop popup window:
      setTimeout(function() {
        try {
          window.close();
        } catch (e) {}
        // Fallback if window.close was ignored
        setTimeout(function() {
          window.location.replace("/");
        }, 500);
      }, 700);
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
