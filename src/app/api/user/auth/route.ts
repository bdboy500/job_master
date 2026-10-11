import { NextRequest, NextResponse } from "next/server";
import {
  registerUserAccount,
  loginUserAccount,
  updateUsernameOnServer,
  changeUserPasswordOnServer,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
} from "@/src/lib/user_auth";
import { sendPasswordResetEmail } from "@/src/lib/email_service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "signup") {
      const { fullName, phoneNumber, email, password } = body;
      const res = await registerUserAccount({ fullName, phoneNumber, email, password });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, user: res.user });
    }

    if (action === "signin") {
      const { identifier, password } = body;
      const res = await loginUserAccount(identifier, password);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 401 });
      }
      return NextResponse.json({ success: true, user: res.user });
    }

    if (action === "update-profile") {
      const { userId, newFullName, phoneNumber, avatarUrl, newEmail } = body;
      const res = await updateUsernameOnServer(userId, newFullName, phoneNumber, avatarUrl, newEmail);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, user: res.user });
    }

    if (action === "change-password") {
      const { userId, userEmail, currentPassword, newPassword } = body;
      const res = await changeUserPasswordOnServer(userId, userEmail, currentPassword, newPassword);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message });
    }

    // OTP-based secure password reset actions
    if (action === "send-reset-otp") {
      const { identifier } = body;
      const res = await sendPasswordResetOtp(identifier);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      // Send 6-digit OTP to user email via SMTP server
      if (res.targetEmail && res.code) {
        try {
          await sendPasswordResetEmail(res.targetEmail, res.studentName || "শিক্ষার্থী", res.code);
        } catch (mailErr) {
          console.error("Failed to send OTP email:", mailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: res.message,
        emailMasked: res.emailMasked,
      });
    }

    if (action === "verify-reset-otp") {
      const { identifier, code } = body;
      const res = await verifyPasswordResetOtp(identifier, code);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message });
    }

    if (action === "reset-password-otp" || action === "reset-password") {
      const { identifier, code, newPassword } = body;
      const res = await resetPasswordWithOtp(identifier, code, newPassword);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Server error" }, { status: 500 });
  }
}
