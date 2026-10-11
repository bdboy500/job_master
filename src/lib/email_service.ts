import nodemailer from "nodemailer";
import { getSupabase } from "./supabase";

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

let cachedSmtpConfig: SmtpConfig | null = null;
let lastSmtpConfigFetch = 0;

/**
 * Retrieve SMTP configuration from env vars or Supabase app_config (key: job_master_smtp_settings)
 */
export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const now = Date.now();
  if (cachedSmtpConfig && now - lastSmtpConfigFetch < 60000) {
    return cachedSmtpConfig;
  }

  // 1. Check environment variables
  const envHost = (process.env.SMTP_HOST || "").trim();
  const envUser = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
  const envPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").trim();
  const envPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const envFromEmail = (process.env.SMTP_FROM_EMAIL || envUser || "no-reply@jobmaster.com.bd").trim();
  const envFromName = (process.env.SMTP_FROM_NAME || "Job Master BD").trim();

  if (envUser && envPass) {
    cachedSmtpConfig = {
      host: envHost || (envUser.includes("@gmail.com") ? "smtp.gmail.com" : "smtp.jobmaster.com.bd"),
      port: envPort || 465,
      secure: envPort === 465,
      user: envUser,
      pass: envPass,
      fromEmail: envFromEmail,
      fromName: envFromName,
    };
    lastSmtpConfigFetch = now;
    return cachedSmtpConfig;
  }

  // 2. Check Supabase app_config for stored admin SMTP credentials
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "job_master_smtp_settings")
        .maybeSingle();

      if (data && data.value && data.value.user && data.value.pass) {
        cachedSmtpConfig = {
          host: data.value.host || "smtp.gmail.com",
          port: Number(data.value.port) || 465,
          secure: Number(data.value.port) === 465 || Boolean(data.value.secure),
          user: data.value.user.trim(),
          pass: data.value.pass.trim(),
          fromEmail: data.value.fromEmail || data.value.user.trim(),
          fromName: data.value.fromName || "Job Master BD",
        };
        lastSmtpConfigFetch = now;
        return cachedSmtpConfig;
      }
    }
  } catch (err) {
    console.warn("Could not fetch SMTP config from Supabase:", err);
  }

  return null;
}

/**
 * Save SMTP settings to Supabase app_config
 */
export async function saveSmtpConfig(config: SmtpConfig): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("app_config").upsert(
        {
          key: "job_master_smtp_settings",
          value: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      if (!error) {
        cachedSmtpConfig = config;
        lastSmtpConfigFetch = Date.now();
        return true;
      }
    }
  } catch (err) {
    console.error("Failed to save SMTP config:", err);
  }
  return false;
}

/**
 * Send 6-digit OTP verification email for password reset
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  otpCode: string
): Promise<{ success: boolean; sentViaSmtp: boolean; error?: string }> {
  const config = await getSmtpConfig();

  if (!config) {
    console.log(
      `[EmailService] SMTP is not configured. OTP generated for ${toEmail}: ${otpCode}. Configure SMTP in .env or app_config to deliver via inbox.`
    );
    return {
      success: true,
      sentViaSmtp: false,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; padding: 24px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
          .header p { margin: 4px 0 0; font-size: 13px; color: #cbd5e1; }
          .content { padding: 30px; }
          .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
          .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .otp-card { background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
          .otp-label { font-size: 12px; font-weight: 700; color: #c2410c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #ea580c; font-family: monospace; }
          .validity { font-size: 12px; color: #9a3412; margin-top: 6px; font-weight: 500; }
          .warning { background: #f1f5f9; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 20px; }
          .footer { border-top: 1px solid #f1f5f9; padding: 20px 30px; text-align: center; font-size: 11px; color: #94a3b8; background: #f8fafc; }
          .footer a { color: #f97316; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Job Master (জব মাস্টার)</h1>
            <p>চাকরি প্রস্তুতি ও লাইভ মডেল টেস্ট প্ল্যাটফর্ম</p>
          </div>
          <div class="content">
            <div class="greeting">প্রিয় ${userName || "শিক্ষার্থী"},</div>
            <div class="message">
              আপনার Job Master অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করার জন্য একটি অনুরোধ পাওয়া গেছে। আপনার ৬ ডিজিটের গোপন ভেরিফিকেশন কোড নিচে দেওয়া হলো:
            </div>
            
            <div class="otp-card">
              <div class="otp-label">Password Reset Verification Code</div>
              <div class="otp-code">${otpCode}</div>
              <div class="validity">⏳ এই কোডটির মেয়াদ পরবর্তী ১০ মিনিট পর্যন্ত কার্যকর থাকবে।</div>
            </div>

            <div class="warning">
              ⚠️ <strong>সতর্কতা:</strong> এই কোডটি কাউকে জানাবেন না। আপনি যদি পাসওয়ার্ড রিসেটের অনুরোধ না করে থাকেন, তবে এই ইমেইলটি এড়িয়ে চলুন। আপনার পাসওয়ার্ড অপরিবর্তিত থাকবে।
            </div>
          </div>
          <div class="footer">
            <p>© 2026 Job Master • <a href="https://jobmaster.com.bd">jobmaster.com.bd</a></p>
            <p>সহায়তার জন্য ভিজিট করুন: <a href="https://jobmaster.com.bd/privacy-policy">Privacy Policy</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: toEmail,
      subject: `[Job Master] আপনার পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড: ${otpCode}`,
      text: `প্রিয় ${userName || "শিক্ষার্থী"},\n\nআপনার Job Master পাসওয়ার্ড রিসেটের ৬ ডিজিটের কোড হলো: ${otpCode}\nকোডটির মেয়াদ ১০ মিনিট।\n\nআপনি এই অনুরোধ না করে থাকলে ইমেইলটি উপেক্ষা করুন।`,
      html: htmlBody,
    });

    console.log(`[EmailService] Successfully sent OTP email to ${toEmail}`);
    return { success: true, sentViaSmtp: true };
  } catch (err: any) {
    console.error(`[EmailService] Failed to send email via SMTP to ${toEmail}:`, err?.message);
    return { success: false, sentViaSmtp: false, error: err?.message };
  }
}
