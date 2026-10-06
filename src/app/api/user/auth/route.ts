import { NextRequest, NextResponse } from "next/server";
import {
  registerUserAccount,
  loginUserAccount,
  updateUsernameOnServer,
  changeUserPasswordOnServer,
} from "@/src/lib/user_auth";

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
      const { userId, newFullName, phoneNumber, avatarUrl } = body;
      const res = await updateUsernameOnServer(userId, newFullName, phoneNumber, avatarUrl);
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

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Server error" }, { status: 500 });
  }
}
