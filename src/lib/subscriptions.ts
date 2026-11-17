export interface UserSubscription {
  id: string;
  userId: string;
  userEmail: string;
  packageId: string;
  packageTitle: string;
  category: "all" | "course";
  paymentId: string;
  trxId: string;
  amount: number;
  status: "active" | "expired" | "refunded" | "cancelled";
  startsAt: string;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userEmail: string;
  packageId: string;
  packageTitle: string;
  amount: number;
  currency: string;
  merchantInvoiceNumber: string;
  paymentId: string;
  trxId: string | null;
  payerReference: string;
  customerMsisdn?: string | null;
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  statusCode?: string | null;
  statusMessage?: string | null;
  refundTrxId?: string | null;
  refundAmount?: number | null;
  refundReason?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const SUBSCRIPTION_STORAGE_PREFIX = "jobmaster_active_sub_v1_";

const BN_DIGITS_MAP: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

export function toEnglishDigits(input: string): string {
  return String(input || "").replace(/[০-৯]/g, (d) => BN_DIGITS_MAP[d] ?? d);
}

/**
 * Extracts numeric BDT amount from package price strings like "৳৪৯৯", "৳149", "499.00".
 */
export function parsePackageAmountBDT(priceStr: string): number {
  const normalized = toEnglishDigits(priceStr).replace(/,/g, "");
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const val = Number(match[1]);
  return Number.isFinite(val) && val > 0 ? Math.round(val * 100) / 100 : 0;
}

/**
 * Infers subscription validity period (in days) from a package id/title/description.
 */
export function getPackageDurationDays(pkg: { id?: string; title?: string; desc?: string }): number {
  const id = (pkg.id || "").toLowerCase();
  const combined = toEnglishDigits(`${pkg.id || ""} ${pkg.title || ""} ${pkg.desc || ""}`).toLowerCase();

  if (id === "pkg-2y" || /2\s*(বছর|year|yr)/.test(combined)) return 730;
  if (id === "pkg-1y" || id === "pkg-undergrad" || /1\s*(বছর|year|yr)/.test(combined)) return 365;
  if (id === "pkg-6m" || /6\s*(মাস|month|mo)/.test(combined)) return 180;
  if (id === "pkg-3m" || /3\s*(মাস|month|mo)/.test(combined)) return 90;
  if (id === "pkg-1m" || /1\s*(মাস|month|mo)/.test(combined)) return 30;

  const daysMatch = combined.match(/(\d+)\s*(দিন|day|days)/);
  if (daysMatch) {
    const parsedDays = Number(daysMatch[1]);
    if (Number.isFinite(parsedDays) && parsedDays > 0) return parsedDays;
  }

  const monthsMatch = combined.match(/(\d+)\s*(মাস|month|months)/);
  if (monthsMatch) {
    const parsedMonths = Number(monthsMatch[1]);
    if (Number.isFinite(parsedMonths) && parsedMonths > 0) return parsedMonths * 30;
  }

  return 30;
}

/**
 * Strict email validation for package purchases.
 * Rejects guest placeholders or malformed emails.
 */
export function isValidRegisteredEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || trimmed === "guest@jobmaster.com") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

/**
 * Returns true when subscription status is active and expiresAt is in the future.
 */
export function isSubscriptionActive(sub: UserSubscription | null | undefined): boolean {
  if (!sub || sub.status !== "active") return false;
  const expMs = Date.parse(sub.expiresAt);
  if (!Number.isFinite(expMs)) return false;
  return expMs > Date.now();
}

export function formatSubscriptionDateBn(isoDate?: string | null): string {
  if (!isoDate) return "—";
  const ts = Date.parse(isoDate);
  if (!Number.isFinite(ts)) return "—";
  return new Date(ts).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });
}

export function getCachedUserSubscription(userId: string): UserSubscription | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(`${SUBSCRIPTION_STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSubscription;
    return isSubscriptionActive(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCachedUserSubscription(userId: string, sub: UserSubscription | null): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    if (sub && isSubscriptionActive(sub)) {
      window.localStorage.setItem(`${SUBSCRIPTION_STORAGE_PREFIX}${userId}`, JSON.stringify(sub));
    } else {
      window.localStorage.removeItem(`${SUBSCRIPTION_STORAGE_PREFIX}${userId}`);
    }
  } catch {
    // Ignore storage write errors
  }
}

export async function fetchActiveUserSubscription(
  userId?: string | null,
  email?: string | null
): Promise<{ activeSubscription: UserSubscription | null; transactions: PaymentTransaction[] }> {
  if (!userId && !email) {
    return { activeSubscription: null, transactions: [] };
  }

  try {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (email) params.set("email", email);

    const res = await fetch(`/api/packages/subscription?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        activeSubscription: userId ? getCachedUserSubscription(userId) : null,
        transactions: [],
      };
    }

    const data = await res.json();
    const active = data?.activeSubscription && isSubscriptionActive(data.activeSubscription)
      ? (data.activeSubscription as UserSubscription)
      : null;

    if (userId) {
      saveCachedUserSubscription(userId, active);
    }

    return {
      activeSubscription: active,
      transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    };
  } catch {
    return {
      activeSubscription: userId ? getCachedUserSubscription(userId) : null,
      transactions: [],
    };
  }
}

export const SUBSCRIPTIONS_BKASH_SUPABASE_SQL = `-- JobMaster bKash Payment Gateway & Ad-Free Subscriptions Schema (Non-Destructive)
-- Runs safely without deleting any existing tables or records.

CREATE TABLE IF NOT EXISTS public.bkash_tokens (
  id text PRIMARY KEY,
  id_token text NOT NULL,
  refresh_token text NOT NULL,
  id_token_expires_at timestamptz NOT NULL,
  refresh_token_expires_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  user_email text NOT NULL,
  package_id text NOT NULL,
  package_title text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'BDT',
  merchant_invoice_number text NOT NULL,
  payment_id text UNIQUE,
  trx_id text,
  payer_reference text,
  customer_msisdn text,
  status text NOT NULL DEFAULT 'pending',
  status_code text,
  status_message text,
  refund_trx_id text,
  refund_amount numeric,
  refund_reason text,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_trx_id ON public.payment_transactions(trx_id);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  user_email text NOT NULL,
  package_id text NOT NULL,
  package_title text NOT NULL,
  category text NOT NULL DEFAULT 'all',
  payment_id text,
  trx_id text,
  amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_subs_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_email ON public.user_subscriptions(user_email);

ALTER TABLE public.bkash_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bkash_tokens' AND policyname = 'Allow all bkash_tokens'
  ) THEN
    CREATE POLICY "Allow all bkash_tokens" ON public.bkash_tokens FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'Allow all payment_transactions'
  ) THEN
    CREATE POLICY "Allow all payment_transactions" ON public.payment_transactions FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'Allow all user_subscriptions'
  ) THEN
    CREATE POLICY "Allow all user_subscriptions" ON public.user_subscriptions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;`;
