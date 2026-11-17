import { getSupabase } from "./supabase";
import {
  findTransactionByPaymentIdServer,
  findTransactionByTrxIdServer,
} from "./subscriptions_server";

/**
 * Official bKash PGW Tokenized Checkout & Refund Server Library
 * Implements strict UAT Technical Acceptance criteria:
 * - 30-second API timeout on every bKash HTTP request
 * - Persistent id_token caching (valid 1 hour, reused across all users & Refund API)
 * - Persistent refresh_token management (valid 28 days from initial Grant Token issue)
 * - Automatic Refresh Token call when id_token expires; Grant Token only when refresh_token expires/invalid
 * - Query Payment called strictly in catch/no-response block of Execute Payment
 * - Built-in Test Sandbox Simulator when BKASH_* env vars are not set yet (automatically switches
 *   to live/sandbox bKash PGW as soon as BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD are configured)
 */

const BKASH_API_TIMEOUT_MS = 30_000;
const ID_TOKEN_SAFETY_TTL_MS = 55 * 60 * 1000; // 55 minutes (under 1-hour limit)
const REFRESH_TOKEN_TTL_MS = 28 * 24 * 60 * 60 * 1000; // 28 days
const TOKEN_ROW_ID = "bkash_primary_token_v1";
const APP_CONFIG_TOKEN_KEY = "bkash_gateway_token_cache_v1";

interface BkashCredentials {
  baseUrl: string;
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
}

interface StoredBkashToken {
  idToken: string;
  refreshToken: string;
  idTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

let memoryTokenCache: StoredBkashToken | null = null;
let inFlightTokenPromise: Promise<string> | null = null;

function getBkashCredentials(): BkashCredentials {
  const rawBaseUrl = (process.env.BKASH_BASE_URL || "").trim().replace(/\/+$/, "");
  const baseUrl = rawBaseUrl || "https://tokenized.sandbox.bka.sh/v1.2.0-beta";

  return {
    baseUrl,
    appKey: (process.env.BKASH_APP_KEY || "").trim(),
    appSecret: (process.env.BKASH_APP_SECRET || "").trim(),
    username: (process.env.BKASH_USERNAME || "").trim(),
    password: (process.env.BKASH_PASSWORD || "").trim(),
  };
}

export function isBkashConfigured(): boolean {
  const creds = getBkashCredentials();
  return Boolean(creds.appKey && creds.appSecret && creds.username && creds.password);
}

/**
 * Performs HTTP POST to bKash PGW with strict 30-second timeout.
 */
async function bkashFetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = BKASH_API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readStoredToken(): Promise<StoredBkashToken | null> {
  if (memoryTokenCache) {
    return memoryTokenCache;
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("bkash_tokens")
        .select("id_token, refresh_token, id_token_expires_at, refresh_token_expires_at")
        .eq("id", TOKEN_ROW_ID)
        .maybeSingle();

      if (!error && data?.id_token && data?.refresh_token) {
        const parsed: StoredBkashToken = {
          idToken: String(data.id_token),
          refreshToken: String(data.refresh_token),
          idTokenExpiresAt: Date.parse(String(data.id_token_expires_at)) || 0,
          refreshTokenExpiresAt: Date.parse(String(data.refresh_token_expires_at)) || 0,
        };
        memoryTokenCache = parsed;
        return parsed;
      }

      const { data: cfgData, error: cfgErr } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", APP_CONFIG_TOKEN_KEY)
        .maybeSingle();

      if (!cfgErr && cfgData?.value?.idToken && cfgData?.value?.refreshToken) {
        const val = cfgData.value as StoredBkashToken;
        memoryTokenCache = val;
        return val;
      }
    }
  } catch (err) {
    console.warn("Unable to read stored bKash token:", err);
  }

  return null;
}

async function persistStoredToken(token: StoredBkashToken): Promise<void> {
  memoryTokenCache = token;

  try {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase.from("bkash_tokens").upsert(
      {
        id: TOKEN_ROW_ID,
        id_token: token.idToken,
        refresh_token: token.refreshToken,
        id_token_expires_at: new Date(token.idTokenExpiresAt).toISOString(),
        refresh_token_expires_at: new Date(token.refreshTokenExpiresAt).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      await supabase.from("app_config").upsert(
        {
          key: APP_CONFIG_TOKEN_KEY,
          value: token,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    }
  } catch (err) {
    console.warn("Unable to persist bKash token:", err);
  }
}

async function callGrantToken(creds: BkashCredentials): Promise<StoredBkashToken> {
  const res = await bkashFetchWithTimeout(`${creds.baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username: creds.username,
      password: creds.password,
    },
    body: JSON.stringify({
      app_key: creds.appKey,
      app_secret: creds.appSecret,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.id_token) {
    throw new Error(data?.statusMessage || data?.msg || "bKash Grant Token failed");
  }

  const now = Date.now();
  const expiresInSec = Number(data.expires_in);
  const idTokenTtl =
    Number.isFinite(expiresInSec) && expiresInSec > 120
      ? (expiresInSec - 120) * 1000
      : ID_TOKEN_SAFETY_TTL_MS;

  const tokenRecord: StoredBkashToken = {
    idToken: String(data.id_token),
    refreshToken: String(data.refresh_token || ""),
    idTokenExpiresAt: now + idTokenTtl,
    refreshTokenExpiresAt: now + REFRESH_TOKEN_TTL_MS,
  };

  await persistStoredToken(tokenRecord);
  return tokenRecord;
}

async function callRefreshToken(
  creds: BkashCredentials,
  existing: StoredBkashToken
): Promise<StoredBkashToken> {
  const res = await bkashFetchWithTimeout(`${creds.baseUrl}/tokenized/checkout/token/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username: creds.username,
      password: creds.password,
    },
    body: JSON.stringify({
      app_key: creds.appKey,
      app_secret: creds.appSecret,
      refresh_token: existing.refreshToken,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.id_token) {
    throw new Error(data?.statusMessage || data?.msg || "bKash Refresh Token failed");
  }

  const now = Date.now();
  const expiresInSec = Number(data.expires_in);
  const idTokenTtl =
    Number.isFinite(expiresInSec) && expiresInSec > 120
      ? (expiresInSec - 120) * 1000
      : ID_TOKEN_SAFETY_TTL_MS;

  const updatedRecord: StoredBkashToken = {
    idToken: String(data.id_token),
    refreshToken: String(data.refresh_token || existing.refreshToken),
    idTokenExpiresAt: now + idTokenTtl,
    refreshTokenExpiresAt: existing.refreshTokenExpiresAt,
  };

  await persistStoredToken(updatedRecord);
  return updatedRecord;
}

/**
 * Retrieves a valid bKash id_token for ALL PGW endpoints (Create, Execute, Query, Search, Refund).
 * Reuses stored id_token across all users for 1 hour; refreshes via refresh_token for up to 28 days.
 */
export async function getBkashIdToken(forceRefresh = false): Promise<string> {
  const creds = getBkashCredentials();
  if (!creds.appKey || !creds.appSecret || !creds.username || !creds.password) {
    throw new Error("bKash merchant credentials are missing in server environment variables.");
  }

  if (!forceRefresh) {
    const stored = await readStoredToken();
    const now = Date.now();
    if (stored && stored.idToken && stored.idTokenExpiresAt > now) {
      return stored.idToken;
    }
  }

  if (inFlightTokenPromise) {
    return inFlightTokenPromise;
  }

  inFlightTokenPromise = (async () => {
    try {
      const stored = await readStoredToken();
      const now = Date.now();

      if (!forceRefresh && stored && stored.idToken && stored.idTokenExpiresAt > now) {
        return stored.idToken;
      }

      if (stored && stored.refreshToken && stored.refreshTokenExpiresAt > now) {
        try {
          const refreshed = await callRefreshToken(creds, stored);
          return refreshed.idToken;
        } catch (refreshErr) {
          console.warn("bKash refresh token failed, falling back to grant token:", refreshErr);
        }
      }

      const granted = await callGrantToken(creds);
      return granted.idToken;
    } finally {
      inFlightTokenPromise = null;
    }
  })();

  return inFlightTokenPromise;
}

export interface BkashCreatePaymentParams {
  amount: number;
  merchantInvoiceNumber: string;
  callbackURL: string;
  payerReference: string;
  packageTitle?: string;
}

export interface BkashCreatePaymentResult {
  paymentID: string;
  bkashURL: string;
  statusCode?: string;
  statusMessage?: string;
  isSandboxSimulator?: boolean;
  raw: Record<string, unknown>;
}

export async function bkashCreatePayment(
  params: BkashCreatePaymentParams
): Promise<BkashCreatePaymentResult> {
  // Built-in Test Simulator Mode when real bKash credentials are not set yet
  if (!isBkashConfigured()) {
    const paymentID = `SANDBOX_PAY_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    let origin = "";
    try {
      origin = new URL(params.callbackURL).origin;
    } catch {
      origin = "";
    }
    const qs = new URLSearchParams({
      paymentID,
      amount: params.amount.toFixed(2).replace(/\.00$/, ""),
      invoice: params.merchantInvoiceNumber,
      pkg: params.packageTitle || "JobMaster Package",
    });
    return {
      paymentID,
      bkashURL: `${origin}/bkash-sandbox?${qs.toString()}`,
      statusCode: "0000",
      statusMessage: "Sandbox Simulator Ready",
      isSandboxSimulator: true,
      raw: { mode: "sandbox_test", paymentID },
    };
  }

  const creds = getBkashCredentials();
  const idToken = await getBkashIdToken();

  const res = await bkashFetchWithTimeout(`${creds.baseUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: idToken,
      "X-APP-Key": creds.appKey,
    },
    body: JSON.stringify({
      mode: "0011",
      payerReference: params.payerReference,
      callbackURL: params.callbackURL,
      amount: params.amount.toFixed(2).replace(/\.00$/, ""),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: params.merchantInvoiceNumber,
    }),
  });

  const data = await res.json();
  if (!res.ok || (data?.statusCode && data.statusCode !== "0000") || !data?.bkashURL) {
    throw new Error(data?.statusMessage || data?.msg || "Failed to initialize bKash checkout.");
  }

  return {
    paymentID: String(data.paymentID),
    bkashURL: String(data.bkashURL),
    statusCode: data.statusCode,
    statusMessage: data.statusMessage,
    isSandboxSimulator: false,
    raw: data,
  };
}

export interface BkashExecuteOrQueryResult {
  paymentID: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  customerMsisdn?: string;
  merchantInvoiceNumber?: string;
  statusCode: string;
  statusMessage: string;
  viaQueryFallback?: boolean;
  raw: Record<string, unknown>;
}

/**
 * Query Payment API — strictly reserved ONLY for the no-response/timeout fallback
 * inside bkashExecutePayment().
 */
async function bkashQueryPayment(paymentID: string): Promise<BkashExecuteOrQueryResult> {
  const creds = getBkashCredentials();
  const idToken = await getBkashIdToken();

  const res = await bkashFetchWithTimeout(`${creds.baseUrl}/tokenized/checkout/payment/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: idToken,
      "X-APP-Key": creds.appKey,
    },
    body: JSON.stringify({ paymentID }),
  });

  const data = await res.json();
  return {
    paymentID: String(data?.paymentID || paymentID),
    trxID: data?.trxID ? String(data.trxID) : undefined,
    transactionStatus: data?.transactionStatus ? String(data.transactionStatus) : undefined,
    amount: data?.amount ? String(data.amount) : undefined,
    currency: data?.currency ? String(data.currency) : undefined,
    customerMsisdn: data?.customerMsisdn ? String(data.customerMsisdn) : undefined,
    merchantInvoiceNumber: data?.merchantInvoiceNumber ? String(data.merchantInvoiceNumber) : undefined,
    statusCode: String(data?.statusCode || ""),
    statusMessage: String(data?.statusMessage || data?.msg || "payment failed"),
    viaQueryFallback: true,
    raw: data || {},
  };
}

/**
 * Execute Payment API — MUST ONLY be called when callback status === "success".
 * If Execute Payment fails to return a response (timeout / network error), calls
 * Query Payment inside the catch block per UAT acceptance requirement #4.
 */
export async function bkashExecutePayment(paymentID: string): Promise<BkashExecuteOrQueryResult> {
  // Handle Test Simulator Execute cleanly when BKASH_* env vars aren't configured yet
  if (!isBkashConfigured() && paymentID.startsWith("SANDBOX_PAY_")) {
    const existingTx = await findTransactionByPaymentIdServer(paymentID);
    const wallet = (existingTx?.customerMsisdn || "01770618575").trim();
    const scenario = existingTx?.statusMessage || "";

    if (scenario === "SANDBOX_INSUFFICIENT_BALANCE" || wallet === "01823074817") {
      return {
        paymentID,
        statusCode: "2023",
        statusMessage: "Insufficient Balance",
        customerMsisdn: wallet,
        amount: existingTx ? String(existingTx.amount) : undefined,
        currency: "BDT",
        raw: { mode: "sandbox_test", statusCode: "2023", statusMessage: "Insufficient Balance" },
      };
    }

    if (scenario === "SANDBOX_DEBIT_BLOCK" || wallet === "01823074818") {
      return {
        paymentID,
        statusCode: "2029",
        statusMessage: "Debit Block",
        customerMsisdn: wallet,
        amount: existingTx ? String(existingTx.amount) : undefined,
        currency: "BDT",
        raw: { mode: "sandbox_test", statusCode: "2029", statusMessage: "Debit Block" },
      };
    }

    const trxID = `SBX${Date.now().toString(36).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
    return {
      paymentID,
      trxID,
      transactionStatus: "Completed",
      amount: existingTx ? String(existingTx.amount) : undefined,
      currency: "BDT",
      customerMsisdn: wallet,
      merchantInvoiceNumber: existingTx?.merchantInvoiceNumber,
      statusCode: "0000",
      statusMessage: "Successful",
      raw: { mode: "sandbox_test", statusCode: "0000", trxID, transactionStatus: "Completed" },
    };
  }

  const creds = getBkashCredentials();
  const idToken = await getBkashIdToken();

  try {
    const res = await bkashFetchWithTimeout(`${creds.baseUrl}/tokenized/checkout/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: idToken,
        "X-APP-Key": creds.appKey,
      },
      body: JSON.stringify({ paymentID }),
    });

    const text = await res.text();
    if (!text) {
      throw new Error("Empty response from bKash Execute Payment API");
    }

    const data = JSON.parse(text);
    return {
      paymentID: String(data?.paymentID || paymentID),
      trxID: data?.trxID ? String(data.trxID) : undefined,
      transactionStatus: data?.transactionStatus ? String(data.transactionStatus) : undefined,
      amount: data?.amount ? String(data.amount) : undefined,
      currency: data?.currency ? String(data.currency) : undefined,
      customerMsisdn: data?.customerMsisdn ? String(data.customerMsisdn) : undefined,
      merchantInvoiceNumber: data?.merchantInvoiceNumber ? String(data.merchantInvoiceNumber) : undefined,
      statusCode: String(data?.statusCode || ""),
      statusMessage: String(data?.statusMessage || data?.msg || "payment failed"),
      viaQueryFallback: false,
      raw: data || {},
    };
  } catch (noResponseErr) {
    // Requirement 4: Query payment should ONLY be called if there is no response from execute API and inside this block
    console.warn("bKash Execute API had no response/timed out. Querying payment status:", noResponseErr);
    return await bkashQueryPayment(paymentID);
  }
}

export async function bkashSearchTransaction(trxID: string): Promise<Record<string, unknown>> {
  if (!isBkashConfigured()) {
    const tx = await findTransactionByTrxIdServer(trxID);
    if (!tx) {
      throw new Error("টেস্ট মোডে এই TrxID পাওয়া যায়নি।");
    }
    return {
      mode: "sandbox_test",
      statusCode: "0000",
      statusMessage: "Successful",
      trxID: tx.trxId,
      paymentID: tx.paymentId,
      amount: String(tx.amount),
      currency: tx.currency,
      customerMsisdn: tx.customerMsisdn || "01770618575",
      transactionStatus: tx.status === "refunded" ? "Refunded" : tx.status === "completed" ? "Completed" : tx.status,
      merchantInvoiceNumber: tx.merchantInvoiceNumber,
      initiationTime: tx.createdAt,
      completedTime: tx.updatedAt,
    };
  }

  const creds = getBkashCredentials();
  const idToken = await getBkashIdToken();

  const res = await bkashFetchWithTimeout(`${creds.baseUrl}/tokenized/checkout/general/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: idToken,
      "X-APP-Key": creds.appKey,
    },
    body: JSON.stringify({ trxID }),
  });

  const data = await res.json();
  if (!res.ok || (data?.statusCode && data.statusCode !== "0000")) {
    throw new Error(data?.statusMessage || data?.msg || "Transaction search failed");
  }
  return data;
}

export interface BkashRefundParams {
  paymentID: string;
  amount: number | string;
  trxID: string;
  sku?: string;
  reason?: string;
}

/**
 * Refund Transaction API — reuses the SAME cached id_token via getBkashIdToken() per UAT Requirement #5.
 */
export async function bkashRefundTransaction(params: BkashRefundParams): Promise<Record<string, unknown>> {
  if (!isBkashConfigured()) {
    const refundTrxID = `RFD${Date.now().toString(36).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
    return {
      mode: "sandbox_test",
      statusCode: "0000",
      statusMessage: "Completed",
      originalTrxID: params.trxID,
      refundTrxID,
      transactionStatus: "Completed",
      amount: String(params.amount),
      currency: "BDT",
      completedTime: new Date().toISOString(),
    };
  }

  const creds = getBkashCredentials();
  const idToken = await getBkashIdToken();

  const res = await bkashFetchWithTimeout(`${creds.baseUrl}/tokenized/checkout/payment/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: idToken,
      "X-APP-Key": creds.appKey,
    },
    body: JSON.stringify({
      paymentID: params.paymentID,
      amount: String(params.amount),
      trxID: params.trxID,
      sku: params.sku || "JobMaster-Package",
      reason: params.reason || "Customer refund request",
    }),
  });

  const data = await res.json();
  if (!res.ok || (data?.statusCode && data.statusCode !== "0000")) {
    throw new Error(data?.statusMessage || data?.msg || "Refund transaction failed");
  }
  return data;
}
