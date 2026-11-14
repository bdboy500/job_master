import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface HandoffEntry {
  code?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  error?: string | null;
  errorDescription?: string | null;
  createdAt: number;
  claimed: boolean;
}

const HANDOFF_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLAIMED_STATUS_TTL_MS = 45 * 1000; // 45 seconds after claim

const globalStore = globalThis as unknown as {
  __jobmasterOAuthHandoffs?: Map<string, HandoffEntry>;
};

function getStore(): Map<string, HandoffEntry> {
  if (!globalStore.__jobmasterOAuthHandoffs) {
    globalStore.__jobmasterOAuthHandoffs = new Map<string, HandoffEntry>();
  }
  const now = Date.now();
  for (const [key, entry] of globalStore.__jobmasterOAuthHandoffs.entries()) {
    if (now - entry.createdAt > HANDOFF_TTL_MS) {
      globalStore.__jobmasterOAuthHandoffs.delete(key);
    }
  }
  return globalStore.__jobmasterOAuthHandoffs;
}

function isValidId(id: string | null | undefined): id is string {
  return Boolean(id && /^[a-zA-Z0-9_-]{8,120}$/.test(id));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";

    if (!isValidId(id)) {
      return NextResponse.json({ ok: false, error: "Invalid handoff id" }, { status: 400 });
    }

    const store = getStore();
    store.set(id, {
      code: typeof body.code === "string" ? body.code : null,
      access_token: typeof body.access_token === "string" ? body.access_token : null,
      refresh_token: typeof body.refresh_token === "string" ? body.refresh_token : null,
      error: typeof body.error === "string" ? body.error : null,
      errorDescription: typeof body.errorDescription === "string" ? body.errorDescription : null,
      createdAt: Date.now(),
      claimed: false,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Malformed request" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  const statusOnly = searchParams.get("status") === "1";

  if (!isValidId(id)) {
    return NextResponse.json({ ready: false, claimed: false }, { status: 400 });
  }

  const store = getStore();
  const entry = store.get(id);

  if (!entry) {
    return NextResponse.json(
      { ready: false, claimed: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  if (statusOnly) {
    return NextResponse.json(
      {
        ready: Boolean(entry.access_token || entry.code || entry.error || entry.claimed),
        claimed: entry.claimed,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  if (entry.claimed) {
    return NextResponse.json(
      { ready: false, claimed: true },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const hasPayload = Boolean(
    (entry.access_token && entry.refresh_token) || entry.code || entry.error
  );

  if (!hasPayload) {
    return NextResponse.json(
      { ready: false, claimed: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const responsePayload = {
    ready: true,
    claimed: true,
    code: entry.code || null,
    access_token: entry.access_token || null,
    refresh_token: entry.refresh_token || null,
    error: entry.error || null,
    errorDescription: entry.errorDescription || null,
  };

  // Wipe sensitive credentials immediately on first claim while retaining claimed status briefly
  entry.code = null;
  entry.access_token = null;
  entry.refresh_token = null;
  entry.claimed = true;
  entry.createdAt = Date.now() - (HANDOFF_TTL_MS - CLAIMED_STATUS_TTL_MS);

  return NextResponse.json(responsePayload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
