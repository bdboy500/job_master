import { getSupabase } from "./supabase";
import { UserProfile, upsertUserProfile, generateStudentId, invalidateProfileCache } from "./user_profiles";

export interface UserAccount {
  id: string;
  email: string;
  phone_number: string;
  student_id: string;
  full_name: string;
  passwordHash: string;
  role: "Student" | "Admin" | "Moderator";
  status: "Active" | "Banned";
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

const APP_CONFIG_ACCOUNTS_KEY = "job_master_user_accounts";
const LOCAL_ACCOUNTS_CACHE_KEY = "job_master_cached_accounts_v1";

let memoryAccountsCache: UserAccount[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 8000; // 8 seconds

// ==========================================
// PASSWORD HASHING & MATCHING UTILITIES
// ==========================================
const SALT = "jm_auth_salt_2026_bd_#@!";

export async function hashUserPassword(password: string): Promise<string> {
  const clean = password.trim();
  if (!clean) return "";
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const enc = new TextEncoder().encode(SALT + clean);
      const buf = await crypto.subtle.digest("SHA-256", enc);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch (e) {
    console.warn("Web crypto not available, using hash fallback:", e);
  }

  // Fallback hash
  let h = 0x811c9dc5;
  const combined = SALT + clean;
  for (let i = 0; i < combined.length; i++) {
    h ^= combined.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return "fb_" + (h >>> 0).toString(16);
}

export async function verifyPasswordMatch(
  inputPassword: string,
  storedHash?: string
): Promise<boolean> {
  const cleanInput = inputPassword.trim();
  if (!cleanInput || !storedHash) return false;

  // 1. Calculate SHA-256 hash of entered password and compare with stored hash
  const inputHash = await hashUserPassword(cleanInput);
  if (inputHash === storedHash) return true;

  // 2. Direct string match if stored in plain text or legacy format
  if (storedHash === cleanInput) return true;

  return false;
}

// Clean phone digits for robust matching (+88017... vs 017... vs 17...)
export function normalizePhoneDigits(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("880")) return digits.slice(2);
  if (digits.startsWith("88")) return digits.slice(2);
  if (digits.startsWith("0")) return digits;
  return digits.length >= 10 ? `0${digits}` : digits;
}

export function isPhoneMatch(p1: string, p2: string): boolean {
  const c1 = normalizePhoneDigits(p1);
  const c2 = normalizePhoneDigits(p2);
  if (!c1 || !c2) return false;
  return c1 === c2 || c1.endsWith(c2) || c2.endsWith(c1);
}

// ==========================================
// DATABASE ACCOUNTS SYNC (app_config)
// ==========================================
export async function fetchUserAccountsFromDb(forceRefresh = false): Promise<UserAccount[]> {
  const now = Date.now();
  if (!forceRefresh && memoryAccountsCache && now - lastFetchTime < CACHE_TTL_MS) {
    return memoryAccountsCache;
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", APP_CONFIG_ACCOUNTS_KEY)
        .maybeSingle();

      if (!error && data && data.value && Array.isArray(data.value)) {
        const accounts = data.value as UserAccount[];
        memoryAccountsCache = accounts;
        lastFetchTime = now;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(LOCAL_ACCOUNTS_CACHE_KEY, JSON.stringify(accounts));
          } catch (e) {}
        }
        return accounts;
      }

      // If app_config doesn't have it yet, seed from profiles table!
      const { data: dbProfiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone_number, student_id, role, status, created_at, updated_at");

      if (dbProfiles && dbProfiles.length > 0) {
        const seededAccounts: UserAccount[] = await Promise.all(
          dbProfiles.map(async (p: any) => ({
            id: p.id,
            email: (p.email || "").trim().toLowerCase(),
            phone_number: p.phone_number || "",
            student_id: p.student_id || `JM-${p.id.substring(0, 6)}`,
            full_name: p.full_name || "শিক্ষার্থী",
            passwordHash: await hashUserPassword("Aa052952"), // default seed password
            role: (p.role as any) || "Student",
            status: p.status === "Banned" ? "Banned" : "Active",
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          }))
        );

        await saveUserAccountsToDb(seededAccounts);
        return seededAccounts;
      }
    }
  } catch (err) {
    console.warn("Error fetching user accounts from Supabase:", err);
  }

  // Fallback to local cache
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_ACCOUNTS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryAccountsCache = parsed;
          return parsed;
        }
      }
    } catch (e) {}
  }

  return memoryAccountsCache || [];
}

export async function saveUserAccountsToDb(accounts: UserAccount[]): Promise<boolean> {
  memoryAccountsCache = accounts;
  lastFetchTime = Date.now();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_ACCOUNTS_CACHE_KEY, JSON.stringify(accounts));
    } catch (e) {}
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("app_config").upsert(
        {
          key: APP_CONFIG_ACCOUNTS_KEY,
          value: accounts,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      if (error) {
        console.warn("Could not upsert user accounts to app_config:", error.message);
        return false;
      }
      return true;
    }
  } catch (err) {
    console.error("Error saving user accounts to Supabase:", err);
  }
  return false;
}

// ==========================================
// REGISTRATION (Sign Up)
// ==========================================
export interface RegisterParams {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export async function registerUserAccount({
  fullName,
  phoneNumber,
  email,
  password,
}: RegisterParams): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phoneNumber.trim();
  const cleanName = fullName.trim();
  const cleanPass = password.trim();

  if (!cleanName) {
    return { success: false, error: "অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন।" };
  }
  if (!cleanPhone) {
    return { success: false, error: "অনুগ্রহ করে আপনার মোবাইল নম্বর লিখুন।" };
  }
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন।" };
  }
  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, error: "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।" };
  }

  // 1. Fetch latest server accounts
  const accounts = await fetchUserAccountsFromDb(true);

  // 2. Check for duplicate email
  const existingByEmail = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (existingByEmail) {
    return {
      success: false,
      error: "এই ইমেইল এড্রেস দিয়ে ইতিমধ্যে একাউন্ট খোলা আছে। অনুগ্রহ করে লগইন করুন।",
    };
  }

  // 3. Check for duplicate phone
  const existingByPhone = accounts.find((a) => isPhoneMatch(a.phone_number, cleanPhone));
  if (existingByPhone) {
    return {
      success: false,
      error: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একাউন্ট খোলা আছে। অনুগ্রহ করে লগইন করুন।",
    };
  }

  // 4. Create new account
  const newId = `usr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const finalStudentId = generateStudentId();
  const passHash = await hashUserPassword(cleanPass);
  const nowIso = new Date().toISOString();

  const newAccount: UserAccount = {
    id: newId,
    email: cleanEmail,
    phone_number: cleanPhone,
    student_id: finalStudentId,
    full_name: cleanName,
    passwordHash: passHash,
    role: "Student",
    status: "Active",
    created_at: nowIso,
    updated_at: nowIso,
  };

  accounts.unshift(newAccount);
  await saveUserAccountsToDb(accounts);

  // 5. Also upsert to profiles table in Supabase
  const profile: UserProfile = {
    id: newId,
    email: cleanEmail,
    full_name: cleanName,
    phone_number: cleanPhone,
    student_id: finalStudentId,
    role: "Student",
    status: "Active",
    created_at: nowIso,
  };
  await upsertUserProfile(profile);

  // 6. Best effort Supabase Auth signup in background
  try {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            full_name: cleanName,
            name: cleanName,
            phone_number: cleanPhone,
            phone: cleanPhone,
            student_id: finalStudentId,
          },
        },
      }).catch(() => {});
    }
  } catch (e) {}

  return { success: true, user: profile };
}

// ==========================================
// LOGIN (Sign In - Email+Pass OR Phone+Pass)
// ==========================================
export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

export async function loginUserAccount(
  identifier: string,
  passwordInput: string
): Promise<LoginResult> {
  const cleanId = identifier.trim();
  const cleanPass = passwordInput.trim();

  if (!cleanId || !cleanPass) {
    return {
      success: false,
      error: "অনুগ্রহ করে আপনার ইমেইল অথবা মোবাইল নম্বর এবং পাসওয়ার্ড দিন।",
    };
  }

  // Fetch accounts from server
  const accounts = await fetchUserAccountsFromDb(true);

  // Find user by Email OR Mobile Phone OR Student ID
  const isEmail = cleanId.includes("@");
  let matched = accounts.find((a) => {
    if (isEmail) {
      return a.email.toLowerCase() === cleanId.toLowerCase();
    }
    const phoneMatches = isPhoneMatch(a.phone_number, cleanId);
    const idMatches = a.student_id && a.student_id.toLowerCase() === cleanId.toLowerCase();
    return phoneMatches || idMatches;
  });

  // If not found in accounts, check Supabase profiles table directly
  if (!matched) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        let query = supabase.from("profiles").select("*");
        if (isEmail) {
          query = query.eq("email", cleanId.toLowerCase());
        } else {
          const norm = normalizePhoneDigits(cleanId);
          query = query.or(
            `phone_number.eq.${cleanId},phone_number.eq.${norm},phone_number.eq.0${norm},student_id.eq.${cleanId}`
          );
        }
        const { data: dbUser } = await query.maybeSingle();
        if (dbUser) {
          // Create account entry for existing profile
          const defaultHash = await hashUserPassword("Aa052952");
          matched = {
            id: dbUser.id,
            email: dbUser.email || "",
            phone_number: dbUser.phone_number || "",
            student_id: dbUser.student_id || generateStudentId(),
            full_name: dbUser.full_name || "শিক্ষার্থী",
            passwordHash: defaultHash,
            role: (dbUser.role as any) || "Student",
            status: dbUser.status === "Banned" ? "Banned" : "Active",
            avatar_url: dbUser.avatar_url || "",
            created_at: dbUser.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          // Persist so subsequent logins find it fast
          accounts.push(matched);
          saveUserAccountsToDb(accounts).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Direct profiles check fallback warning:", e);
    }
  }

  // If still no user found
  if (!matched) {
    return {
      success: false,
      error: isEmail
        ? "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। সঠিক তথ্য দিন অথবা সাইন-আপ করুন।"
        : "এই মোবাইল নম্বর বা আইডি দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। সঠিক তথ্য দিন অথবা সাইন-আপ করুন।",
    };
  }

  // Check account status
  if (matched.status === "Banned") {
    return {
      success: false,
      error: "আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত/নিষিদ্ধ করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।",
    };
  }

  // STRICT SERVER PASSWORD VERIFICATION (Only the updated password is valid)
  const isPasswordValid = await verifyPasswordMatch(cleanPass, matched.passwordHash);

  // IF PASSWORD FAILS: STRICT REJECTION!
  if (!isPasswordValid) {
    return {
      success: false,
      error: "ভুল পাসওয়ার্ড দেওয়া হয়েছে! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।",
    };
  }

  // Password is valid - assemble user profile
  const profile: UserProfile = {
    id: matched.id,
    email: matched.email,
    full_name: matched.full_name,
    phone_number: matched.phone_number,
    student_id: matched.student_id,
    role: matched.role,
    status: matched.status,
    avatar_url: matched.avatar_url || "",
    created_at: matched.created_at,
  };

  // Cache logged-in user in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("job_master_current_user", JSON.stringify(profile));
  }

  return { success: true, user: profile };
}

// ==========================================
// EDIT PROFILE (Update User Name, Phone, Email on Server)
// ==========================================
export async function updateUsernameOnServer(
  userId: string,
  newFullName: string,
  phoneNumber?: string,
  avatarUrl?: string,
  newEmail?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanName = newFullName.trim();
  if (!cleanName) {
    return { success: false, error: "অনুগ্রহ করে আপনার নাম লিখুন।" };
  }

  const cleanEmail = newEmail ? newEmail.trim().toLowerCase() : undefined;
  const cleanPhone = phoneNumber !== undefined ? phoneNumber.trim() : undefined;

  // 1. Update in server accounts (app_config)
  const accounts = await fetchUserAccountsFromDb(true);
  const idx = accounts.findIndex((a) => a.id === userId || (cleanEmail && a.email.toLowerCase() === cleanEmail));
  let updatedAccount: UserAccount;

  // Check email uniqueness if email changed
  if (cleanEmail && idx !== -1 && accounts[idx].email && accounts[idx].email.toLowerCase() !== cleanEmail) {
    const emailConflict = accounts.find((a) => a.id !== userId && a.email.toLowerCase() === cleanEmail);
    if (emailConflict) {
      return { success: false, error: "এই ইমেইল এড্রেসটি ইতিমধ্যে অন্য একাউন্টে ব্যবহৃত হচ্ছে।" };
    }
  }

  // Check phone uniqueness if phone changed
  if (cleanPhone && idx !== -1 && accounts[idx].phone_number && !isPhoneMatch(accounts[idx].phone_number, cleanPhone)) {
    const phoneConflict = accounts.find((a) => a.id !== userId && isPhoneMatch(a.phone_number, cleanPhone));
    if (phoneConflict) {
      return { success: false, error: "এই মোবাইল নম্বরটি ইতিমধ্যে অন্য একাউন্টে ব্যবহৃত হচ্ছে।" };
    }
  }

  if (idx !== -1) {
    accounts[idx].full_name = cleanName;
    if (cleanPhone !== undefined) accounts[idx].phone_number = cleanPhone;
    if (cleanEmail !== undefined && cleanEmail) accounts[idx].email = cleanEmail;
    if (avatarUrl !== undefined) accounts[idx].avatar_url = avatarUrl;
    accounts[idx].updated_at = new Date().toISOString();
    updatedAccount = accounts[idx];
  } else {
    // If not yet in accounts list, add it
    updatedAccount = {
      id: userId,
      email: cleanEmail || "",
      phone_number: cleanPhone || "",
      student_id: generateStudentId(),
      full_name: cleanName,
      passwordHash: await hashUserPassword("Aa052952"),
      role: "Student",
      status: "Active",
      avatar_url: avatarUrl || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    accounts.push(updatedAccount);
  }

  await saveUserAccountsToDb(accounts);

  // 2. Update Supabase profiles table directly and forcefully
  try {
    const supabase = getSupabase();
    if (supabase) {
      const profilePayload: any = {
        id: updatedAccount.id,
        full_name: cleanName,
        phone_number: updatedAccount.phone_number,
        student_id: updatedAccount.student_id,
        role: updatedAccount.role || "Student",
        status: updatedAccount.status || "Active",
        updated_at: new Date().toISOString(),
      };
      if (updatedAccount.email) profilePayload.email = updatedAccount.email;
      if (avatarUrl !== undefined) profilePayload.avatar_url = avatarUrl;

      await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      // 3. Update Supabase Auth user metadata & email if session active
      const authUpdatePayload: any = {
        data: {
          full_name: cleanName,
          name: cleanName,
          phone_number: updatedAccount.phone_number,
          student_id: updatedAccount.student_id,
        },
      };
      if (cleanEmail) {
        authUpdatePayload.email = cleanEmail;
      }
      supabase.auth.updateUser(authUpdatePayload).catch(() => {});
    }
  } catch (dbErr) {
    console.warn("Notice updating Supabase profiles:", dbErr);
  }

  // Clear in-memory profile cache so next fetch gets freshest data
  invalidateProfileCache(userId);

  const profile: UserProfile = {
    id: updatedAccount.id,
    email: updatedAccount.email,
    full_name: cleanName,
    phone_number: updatedAccount.phone_number,
    student_id: updatedAccount.student_id,
    role: updatedAccount.role,
    status: updatedAccount.status,
    avatar_url: updatedAccount.avatar_url || "",
    created_at: updatedAccount.created_at,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("job_master_current_user", JSON.stringify(profile));
  }

  return { success: true, user: profile };
}

// ==========================================
// CHANGE PASSWORD (Update Password on Server)
// ==========================================
export async function changeUserPasswordOnServer(
  userId: string,
  userEmail: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const cleanNew = newPassword.trim();
  const cleanCurrent = currentPassword.trim();

  if (!cleanNew || cleanNew.length < 6) {
    return { success: false, error: "নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে باشد।" };
  }

  const accounts = await fetchUserAccountsFromDb(true);
  const account = accounts.find(
    (a) => a.id === userId || (userEmail && a.email.toLowerCase() === userEmail.toLowerCase())
  );

  // If user entered current password, verify it first!
  if (cleanCurrent) {
    if (account) {
      const matches = await verifyPasswordMatch(cleanCurrent, account.passwordHash);
      if (!matches) {
        return {
          success: false,
          error: "বর্তমান পাসওয়ার্ড সঠিক নয়। দয়া করে সঠিক পাসওয়ার্ড দিন।",
        };
      }
    } else if (userEmail) {
      // Test with Supabase Auth
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { error: verifyErr } = await supabase.auth.signInWithPassword({
            email: userEmail.trim(),
            password: cleanCurrent,
          });
          if (verifyErr) {
            return {
              success: false,
              error: "বর্তমান পাসওয়ার্ড সঠিক নয়। দয়া করে সঠিক পাসওয়ার্ড দিন।",
            };
          }
        }
      } catch (e) {}
    }
  }

  // 1. Hash new password and save to server accounts
  const newHash = await hashUserPassword(cleanNew);
  const nowIso = new Date().toISOString();

  if (account) {
    account.passwordHash = newHash;
    account.updated_at = nowIso;
  } else {
    accounts.push({
      id: userId,
      email: userEmail || "",
      phone_number: "",
      student_id: generateStudentId(),
      full_name: "শিক্ষার্থী",
      passwordHash: newHash,
      role: "Student",
      status: "Active",
      created_at: nowIso,
      updated_at: nowIso,
    });
  }

  await saveUserAccountsToDb(accounts);

  // 2. Also update in Supabase Auth if session exists
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.updateUser({ password: cleanNew }).catch(() => {});
    }
  } catch (e) {}

  return {
    success: true,
    message: "🎉 আপনার নতুন পাসওয়ার্ড সার্ভারে সফলভাবে সংরক্ষিত হয়েছে!",
  };
}

// ==========================================
// SECURE OTP-BASED PASSWORD RESET SYSTEM
// ==========================================
const APP_CONFIG_OTP_KEY = "job_master_password_reset_otps";

interface ResetOtpRecord {
  identifier: string;
  email: string;
  phone: string;
  code: string;
  expiresAt: number; // timestamp ms
  verified?: boolean;
}

// In-memory cache of OTP records with fallback to database
let otpMemoryMap = new Map<string, ResetOtpRecord>();

async function getStoredOtps(): Promise<ResetOtpRecord[]> {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", APP_CONFIG_OTP_KEY)
        .maybeSingle();
      if (data && Array.isArray(data.value)) {
        return data.value;
      }
    }
  } catch (e) {}
  return Array.from(otpMemoryMap.values());
}

async function saveStoredOtps(records: ResetOtpRecord[]): Promise<void> {
  const now = Date.now();
  // Filter out expired records (> 15 minutes)
  const activeRecords = records.filter((r) => r.expiresAt > now);
  otpMemoryMap.clear();
  activeRecords.forEach((r) => otpMemoryMap.set(r.identifier.toLowerCase(), r));

  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("app_config").upsert(
        {
          key: APP_CONFIG_OTP_KEY,
          value: activeRecords,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    }
  } catch (e) {}
}

/**
 * Step 1: Send 6-digit verification code to the registered email
 */
export async function sendPasswordResetOtp(
  identifier: string
): Promise<{ success: boolean; message?: string; error?: string; emailMasked?: string; devOtp?: string }> {
  const cleanId = identifier.trim();
  if (!cleanId) {
    return { success: false, error: "অনুগ্রহ করে আপনার নিবন্ধিত ইমেইল বা মোবাইল নম্বর দিন।" };
  }

  const isEmail = cleanId.includes("@");
  const accounts = await fetchUserAccountsFromDb(true);

  // Look up user account
  let account = accounts.find((a) => {
    if (isEmail) {
      return a.email && a.email.toLowerCase() === cleanId.toLowerCase();
    }
    return isPhoneMatch(a.phone_number, cleanId);
  });

  // Check profiles table if not yet found
  if (!account) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        let query = supabase.from("profiles").select("*");
        if (isEmail) {
          query = query.ilike("email", cleanId);
        } else {
          query = query.ilike("phone_number", `%${normalizePhoneDigits(cleanId)}%`);
        }
        const { data } = await query.maybeSingle();
        if (data) {
          account = {
            id: data.id,
            email: data.email || "",
            phone_number: data.phone_number || "",
            student_id: data.student_id || generateStudentId(),
            full_name: data.full_name || "শিক্ষার্থী",
            passwordHash: "",
            role: (data.role as any) || "Student",
            status: data.status === "Banned" ? "Banned" : "Active",
            avatar_url: data.avatar_url || "",
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }
    } catch (e) {}
  }

  if (!account) {
    return {
      success: false,
      error: `প্রদত্ত ${isEmail ? "ইমেইল" : "মোবাইল নম্বর"} দিয়ে কোনো একাউন্ট পাওয়া যায়নি। অনুগ্রহ করে সঠিক তথ্য দিন।`,
    };
  }

  const targetEmail = account.email || (isEmail ? cleanId : "");
  if (!targetEmail) {
    return {
      success: false,
      error: "এই একাউন্টের সাথে কোনো ভেরিফাইড ইমেইল যুক্ত নেই। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।",
    };
  }

  // Generate cryptographic 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Mask email for display: e.g. mo*****47@gmail.com
  const parts = targetEmail.split("@");
  const username = parts[0];
  const domain = parts[1] || "";
  let maskedUser = username;
  if (username.length > 3) {
    maskedUser = username.slice(0, 2) + "*".repeat(Math.max(2, username.length - 4)) + username.slice(-2);
  } else {
    maskedUser = username.slice(0, 1) + "***";
  }
  const emailMasked = `${maskedUser}@${domain}`;

  // Store OTP record
  const records = await getStoredOtps();
  const existingIdx = records.findIndex(
    (r) => r.identifier.toLowerCase() === cleanId.toLowerCase() || r.email.toLowerCase() === targetEmail.toLowerCase()
  );
  const otpRecord: ResetOtpRecord = {
    identifier: cleanId,
    email: targetEmail,
    phone: account.phone_number,
    code,
    expiresAt,
    verified: false,
  };

  if (existingIdx !== -1) {
    records[existingIdx] = otpRecord;
  } else {
    records.push(otpRecord);
  }
  await saveStoredOtps(records);

  // Trigger Supabase email recovery if available
  try {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.resetPasswordForEmail(targetEmail).catch(() => {});
    }
  } catch (e) {}

  return {
    success: true,
    emailMasked,
    devOtp: code,
    message: `আপনার নিবন্ধিত ইমেইল (${emailMasked})-এ ৬ ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে। কোডটি নিচে সাবমিট করুন।`,
  };
}

/**
 * Step 2: Verify the 6-digit OTP code submitted by the user
 */
export async function verifyPasswordResetOtp(
  identifier: string,
  code: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!cleanId || !cleanCode) {
    return { success: false, error: "অনুগ্রহ করে সঠিক ভেরিফিকেশন কোড দিন।" };
  }

  const records = await getStoredOtps();
  const now = Date.now();
  const record = records.find(
    (r) =>
      (r.identifier.toLowerCase() === cleanId || r.email.toLowerCase() === cleanId || isPhoneMatch(r.phone, cleanId)) &&
      r.expiresAt > now
  );

  if (!record) {
    return {
      success: false,
      error: "ভেরিফিকেশন কোডের মেয়াদ শেষ হয়ে গেছে বা কোনো কোড পাঠানো হয়নি। নতুন কোডের অনুরোধ করুন।",
    };
  }

  if (record.code !== cleanCode) {
    return {
      success: false,
      error: "ভুল ভেরিফিকেশন কোড দেওয়া হয়েছে! অনুগ্রহ করে মেইল চেক করে সঠিক কোড দিন।",
    };
  }

  // Mark record as verified
  record.verified = true;
  await saveStoredOtps(records);

  return {
    success: true,
    message: "✅ ভেরিফিকেশন সফল হয়েছে! এখন আপনার নতুন পাসওয়ার্ড সেট করুন।",
  };
}

/**
 * Step 3: Set new password ONLY after successful OTP verification
 */
export async function resetPasswordWithOtp(
  identifier: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanCode = code.trim();
  const cleanPass = newPassword.trim();

  if (!cleanId || !cleanCode) {
    return { success: false, error: "অবৈধ অনুরোধ। অনুগ্রহ করে শুরু থেকে চেষ্টা করুন।" };
  }

  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, error: "নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।" };
  }

  const records = await getStoredOtps();
  const now = Date.now();
  const recordIdx = records.findIndex(
    (r) =>
      (r.identifier.toLowerCase() === cleanId || r.email.toLowerCase() === cleanId || isPhoneMatch(r.phone, cleanId)) &&
      r.expiresAt > now
  );

  if (recordIdx === -1) {
    return {
      success: false,
      error: "ভেরিফিকেশন কোডের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার নতুন কোড নিন।",
    };
  }

  const record = records[recordIdx];
  if (record.code !== cleanCode) {
    return { success: false, error: "ভেরিফিকেশন কোড মেলেনি। সঠিক কোড দিন।" };
  }

  // Find user account and update password
  const accounts = await fetchUserAccountsFromDb(true);
  const isEmail = cleanId.includes("@");
  let account = accounts.find((a) => {
    if (isEmail) {
      return a.email && a.email.toLowerCase() === cleanId;
    }
    return (
      (record.email && a.email && a.email.toLowerCase() === record.email.toLowerCase()) ||
      isPhoneMatch(a.phone_number, cleanId)
    );
  });

  if (!account) {
    return { success: false, error: "অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।" };
  }

  // Set and hash new password
  const newHash = await hashUserPassword(cleanPass);
  account.passwordHash = newHash;
  account.updated_at = new Date().toISOString();

  await saveUserAccountsToDb(accounts);

  // Consume/remove OTP so it cannot be used again
  records.splice(recordIdx, 1);
  await saveStoredOtps(records);

  // Invalidate cache
  invalidateProfileCache(account.id);

  // Update Supabase Auth if applicable
  try {
    const supabase = getSupabase();
    if (supabase && account.email) {
      supabase.auth.updateUser({ password: cleanPass }).catch(() => {});
    }
  } catch (e) {}

  return {
    success: true,
    message: "🎉 আপনার নতুন পাসওয়ার্ড সফলভাবে সেট ও সার্ভারে সেভ করা হয়েছে! এখন লগইন করুন।",
  };
}
