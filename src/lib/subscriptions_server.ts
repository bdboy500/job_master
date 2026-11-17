import { getSupabase } from "./supabase";
import { DEFAULT_PACKAGES, PackageItem } from "./packages";
import {
  PaymentTransaction,
  UserSubscription,
  getPackageDurationDays,
  isSubscriptionActive,
} from "./subscriptions";

const FALLBACK_TX_KEY = "payment_transactions_fallback_v1";
const FALLBACK_SUBS_KEY = "user_subscriptions_fallback_v1";

function mapDbTransaction(row: any): PaymentTransaction {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? row.userId ?? ""),
    userEmail: String(row.user_email ?? row.userEmail ?? ""),
    packageId: String(row.package_id ?? row.packageId ?? ""),
    packageTitle: String(row.package_title ?? row.packageTitle ?? ""),
    amount: Number(row.amount || 0),
    currency: String(row.currency || "BDT"),
    merchantInvoiceNumber: String(row.merchant_invoice_number ?? row.merchantInvoiceNumber ?? ""),
    paymentId: String(row.payment_id ?? row.paymentId ?? ""),
    trxId: row.trx_id ?? row.trxId ?? null,
    payerReference: String(row.payer_reference ?? row.payerReference ?? ""),
    customerMsisdn: row.customer_msisdn ?? row.customerMsisdn ?? null,
    status: (row.status || "pending") as PaymentTransaction["status"],
    statusCode: row.status_code ?? row.statusCode ?? null,
    statusMessage: row.status_message ?? row.statusMessage ?? null,
    refundTrxId: row.refund_trx_id ?? row.refundTrxId ?? null,
    refundAmount: row.refund_amount != null ? Number(row.refund_amount) : row.refundAmount ?? null,
    refundReason: row.refund_reason ?? row.refundReason ?? null,
    refundedAt: row.refunded_at ?? row.refundedAt ?? null,
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
  };
}

function mapDbSubscription(row: any): UserSubscription {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? row.userId ?? ""),
    userEmail: String(row.user_email ?? row.userEmail ?? ""),
    packageId: String(row.package_id ?? row.packageId ?? ""),
    packageTitle: String(row.package_title ?? row.packageTitle ?? ""),
    category: row.category === "course" ? "course" : "all",
    paymentId: String(row.payment_id ?? row.paymentId ?? ""),
    trxId: String(row.trx_id ?? row.trxId ?? ""),
    amount: Number(row.amount || 0),
    status: (row.status || "active") as UserSubscription["status"],
    startsAt: String(row.starts_at ?? row.startsAt ?? new Date().toISOString()),
    expiresAt: String(row.expires_at ?? row.expiresAt ?? new Date().toISOString()),
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

async function readAppConfigArray<T>(key: string): Promise<T[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (!error && data && Array.isArray(data.value)) {
      return data.value as T[];
    }
  } catch {
    // ignore
  }
  return [];
}

async function writeAppConfigArray<T>(key: string, items: T[]): Promise<void> {
  try {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from("app_config").upsert(
      {
        key,
        value: items,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch {
    // ignore
  }
}

export async function findPackageByIdServer(packageId: string): Promise<PackageItem | null> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("id", packageId)
        .maybeSingle();
      if (!error && data) {
        return {
          id: String(data.id),
          title: String(data.title || ""),
          desc: String(data.desc || ""),
          price: String(data.price || ""),
          oldPrice: data.oldPrice ?? data.oldprice ?? null,
          badge: data.badge || null,
          category: data.category === "course" ? "course" : "all",
          bg: data.bg,
          border: data.border,
          order: Number(data.order) || 1,
          active: data.active !== false,
        };
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_PACKAGES.find((p) => p.id === packageId) || null;
}

export async function savePaymentTransactionServer(tx: PaymentTransaction): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const dbPayload = {
      id: tx.id,
      user_id: tx.userId,
      user_email: tx.userEmail,
      package_id: tx.packageId,
      package_title: tx.packageTitle,
      amount: tx.amount,
      currency: tx.currency,
      merchant_invoice_number: tx.merchantInvoiceNumber,
      payment_id: tx.paymentId,
      trx_id: tx.trxId,
      payer_reference: tx.payerReference,
      customer_msisdn: tx.customerMsisdn || null,
      status: tx.status,
      status_code: tx.statusCode || null,
      status_message: tx.statusMessage || null,
      refund_trx_id: tx.refundTrxId || null,
      refund_amount: tx.refundAmount ?? null,
      refund_reason: tx.refundReason || null,
      refunded_at: tx.refundedAt || null,
      created_at: tx.createdAt,
      updated_at: tx.updatedAt,
    };

    const { error } = await supabase
      .from("payment_transactions")
      .upsert(dbPayload, { onConflict: "id" });

    if (!error) return;
  }

  // Fallback storage in app_config
  const list = await readAppConfigArray<PaymentTransaction>(FALLBACK_TX_KEY);
  const idx = list.findIndex((item) => item.id === tx.id || item.paymentId === tx.paymentId);
  if (idx >= 0) {
    list[idx] = tx;
  } else {
    list.unshift(tx);
  }
  await writeAppConfigArray(FALLBACK_TX_KEY, list.slice(0, 500));
}

export async function findTransactionByPaymentIdServer(
  paymentId: string
): Promise<PaymentTransaction | null> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("payment_id", paymentId)
        .maybeSingle();
      if (!error && data) {
        return mapDbTransaction(data);
      }
    }
  } catch {
    // ignore
  }

  const fallback = await readAppConfigArray<PaymentTransaction>(FALLBACK_TX_KEY);
  return fallback.find((item) => item.paymentId === paymentId) || null;
}

export async function findTransactionByTrxIdServer(
  trxId: string
): Promise<PaymentTransaction | null> {
  const cleanTrx = trxId.trim();
  if (!cleanTrx) return null;

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("trx_id", cleanTrx)
        .maybeSingle();
      if (!error && data) {
        return mapDbTransaction(data);
      }
    }
  } catch {
    // ignore
  }

  const fallback = await readAppConfigArray<PaymentTransaction>(FALLBACK_TX_KEY);
  return fallback.find((item) => (item.trxId || "").toLowerCase() === cleanTrx.toLowerCase()) || null;
}

export async function activateSubscriptionForTransaction(
  tx: PaymentTransaction
): Promise<UserSubscription> {
  const pkg = await findPackageByIdServer(tx.packageId);
  const days = getPackageDurationDays({
    id: tx.packageId,
    title: tx.packageTitle || pkg?.title,
    desc: pkg?.desc,
  });

  const now = Date.now();
  const expiresAt = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
  const startsAt = new Date(now).toISOString();

  const sub: UserSubscription = {
    id: `sub_${tx.paymentId || Date.now()}`,
    userId: tx.userId,
    userEmail: tx.userEmail,
    packageId: tx.packageId,
    packageTitle: tx.packageTitle,
    category: pkg?.category === "course" ? "course" : "all",
    paymentId: tx.paymentId,
    trxId: tx.trxId || "",
    amount: tx.amount,
    status: "active",
    startsAt,
    expiresAt,
    createdAt: startsAt,
    updatedAt: startsAt,
  };

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("user_subscriptions").upsert(
      {
        id: sub.id,
        user_id: sub.userId,
        user_email: sub.userEmail,
        package_id: sub.packageId,
        package_title: sub.packageTitle,
        category: sub.category,
        payment_id: sub.paymentId,
        trx_id: sub.trxId,
        amount: sub.amount,
        status: sub.status,
        starts_at: sub.startsAt,
        expires_at: sub.expiresAt,
        created_at: sub.createdAt,
        updated_at: sub.updatedAt,
      },
      { onConflict: "id" }
    );
    if (!error) return sub;
  }

  const list = await readAppConfigArray<UserSubscription>(FALLBACK_SUBS_KEY);
  const idx = list.findIndex((s) => s.id === sub.id || s.paymentId === sub.paymentId);
  if (idx >= 0) {
    list[idx] = sub;
  } else {
    list.unshift(sub);
  }
  await writeAppConfigArray(FALLBACK_SUBS_KEY, list.slice(0, 500));
  return sub;
}

export async function markSubscriptionRefundedByPaymentId(paymentId: string): Promise<void> {
  const nowIso = new Date().toISOString();
  const supabase = getSupabase();
  if (supabase) {
    await supabase
      .from("user_subscriptions")
      .update({ status: "refunded", updated_at: nowIso })
      .eq("payment_id", paymentId);
  }

  const list = await readAppConfigArray<UserSubscription>(FALLBACK_SUBS_KEY);
  let changed = false;
  const updated = list.map((s) => {
    if (s.paymentId === paymentId) {
      changed = true;
      return { ...s, status: "refunded" as const, updatedAt: nowIso };
    }
    return s;
  });
  if (changed) {
    await writeAppConfigArray(FALLBACK_SUBS_KEY, updated);
  }
}

export async function getUserSubscriptionDataServer(
  userId?: string | null,
  email?: string | null
): Promise<{ activeSubscription: UserSubscription | null; transactions: PaymentTransaction[] }> {
  const normalizedEmail = email ? email.trim().toLowerCase() : "";
  const subs: UserSubscription[] = [];
  const txs: PaymentTransaction[] = [];

  try {
    const supabase = getSupabase();
    if (supabase) {
      if (userId) {
        const { data: subRows } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .order("expires_at", { ascending: false });
        if (Array.isArray(subRows)) {
          subs.push(...subRows.map(mapDbSubscription));
        }

        const { data: txRows } = await supabase
          .from("payment_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(30);
        if (Array.isArray(txRows)) {
          txs.push(...txRows.map(mapDbTransaction));
        }
      }

      if (subs.length === 0 && normalizedEmail) {
        const { data: subRowsByEmail } = await supabase
          .from("user_subscriptions")
          .select("*")
          .ilike("user_email", normalizedEmail)
          .order("expires_at", { ascending: false });
        if (Array.isArray(subRowsByEmail)) {
          subs.push(...subRowsByEmail.map(mapDbSubscription));
        }
      }

      if (txs.length === 0 && normalizedEmail) {
        const { data: txRowsByEmail } = await supabase
          .from("payment_transactions")
          .select("*")
          .ilike("user_email", normalizedEmail)
          .order("created_at", { ascending: false })
          .limit(30);
        if (Array.isArray(txRowsByEmail)) {
          txs.push(...txRowsByEmail.map(mapDbTransaction));
        }
      }
    }
  } catch {
    // fallback below
  }

  // Merge fallback store if needed
  const fbSubs = await readAppConfigArray<UserSubscription>(FALLBACK_SUBS_KEY);
  for (const s of fbSubs) {
    if (
      (userId && s.userId === userId) ||
      (normalizedEmail && s.userEmail.toLowerCase() === normalizedEmail)
    ) {
      if (!subs.some((existing) => existing.id === s.id)) {
        subs.push(s);
      }
    }
  }

  const fbTxs = await readAppConfigArray<PaymentTransaction>(FALLBACK_TX_KEY);
  for (const t of fbTxs) {
    if (
      (userId && t.userId === userId) ||
      (normalizedEmail && t.userEmail.toLowerCase() === normalizedEmail)
    ) {
      if (!txs.some((existing) => existing.id === t.id)) {
        txs.push(t);
      }
    }
  }

  const activeSubscription =
    subs
      .filter((s) => isSubscriptionActive(s))
      .sort((a, b) => Date.parse(b.expiresAt) - Date.parse(a.expiresAt))[0] || null;

  txs.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return { activeSubscription, transactions: txs };
}

export async function getAllPaymentsAdminServer(): Promise<{
  transactions: PaymentTransaction[];
  subscriptions: UserSubscription[];
}> {
  const transactions: PaymentTransaction[] = [];
  const subscriptions: UserSubscription[] = [];

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: txRows } = await supabase
        .from("payment_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (Array.isArray(txRows)) {
        transactions.push(...txRows.map(mapDbTransaction));
      }

      const { data: subRows } = await supabase
        .from("user_subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (Array.isArray(subRows)) {
        subscriptions.push(...subRows.map(mapDbSubscription));
      }
    }
  } catch {
    // ignore
  }

  const fbTxs = await readAppConfigArray<PaymentTransaction>(FALLBACK_TX_KEY);
  for (const t of fbTxs) {
    if (!transactions.some((x) => x.id === t.id)) {
      transactions.push(t);
    }
  }

  const fbSubs = await readAppConfigArray<UserSubscription>(FALLBACK_SUBS_KEY);
  for (const s of fbSubs) {
    if (!subscriptions.some((x) => x.id === s.id)) {
      subscriptions.push(s);
    }
  }

  transactions.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  subscriptions.sort((a, b) => Date.parse(b.createdAt || b.startsAt) - Date.parse(a.createdAt || a.startsAt));

  return { transactions, subscriptions };
}
