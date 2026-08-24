import { getSupabase } from "./supabase";

export type AdminRole = "admin" | "supervisor" | "editor";
export type AdminAccountStatus = "active" | "pending" | "suspended";

export interface AdminStaffUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string; // Plain/hashed password for matching
  password?: string;
  role: AdminRole;
  status: AdminAccountStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  lastLoginAt?: string;
  isPrimaryMaster?: boolean;
}

const ADMIN_STAFF_STORAGE_KEY = "job_master_admin_staff_v1";
const ADMIN_SESSION_STORAGE_KEY = "job_master_current_admin_session_v1";
const APP_CONFIG_STAFF_KEY = "job_master_admin_staff_accounts";

// Default Master Admin account
export const MASTER_ADMIN_EMAIL = "mobileseba247@gmail.com";

const INITIAL_DEFAULT_STAFF: AdminStaffUser[] = [
  {
    id: "admin-master-001",
    name: "Main Admin",
    email: MASTER_ADMIN_EMAIL,
    phone: "01581483273",
    passwordHash: "Aa052952",
    password: "Aa052952",
    role: "admin",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
    approvedAt: "2026-08-01T00:00:00.000Z",
    approvedBy: "System",
    isPrimaryMaster: true,
  }
];

let staffMemoryCache: AdminStaffUser[] | null = null;

// ==========================================
// ROLE PERMISSION CHECK HELPERS
// ==========================================
function resolveRole(userOrRole?: AdminStaffUser | AdminRole | string | null): AdminRole {
  if (!userOrRole) return "admin";
  if (typeof userOrRole === "object" && userOrRole.role) {
    return userOrRole.role;
  }
  if (typeof userOrRole === "string") {
    if (userOrRole === "supervisor" || userOrRole === "editor") return userOrRole;
    return "admin";
  }
  return "admin";
}

export function canManageStaff(userOrRole?: AdminStaffUser | AdminRole | string | null): boolean {
  return resolveRole(userOrRole) === "admin";
}

export function canManageSettings(userOrRole?: AdminStaffUser | AdminRole | string | null): boolean {
  const role = resolveRole(userOrRole);
  return role === "admin" || role === "supervisor";
}

export function canManageUsers(userOrRole?: AdminStaffUser | AdminRole | string | null): boolean {
  const role = resolveRole(userOrRole);
  return role === "admin" || role === "supervisor";
}

export function canManageExams(userOrRole?: AdminStaffUser | AdminRole | string | null): boolean {
  const role = resolveRole(userOrRole);
  return role === "admin" || role === "supervisor";
}

export function canManagePackages(userOrRole?: AdminStaffUser | AdminRole | string | null): boolean {
  const role = resolveRole(userOrRole);
  return role === "admin" || role === "supervisor";
}

export function canManageCourses(userOrRole?: AdminStaffUser | AdminRole | string | null): boolean {
  const role = resolveRole(userOrRole);
  return role === "admin" || role === "supervisor";
}

export function canManageOffers(userOrRole?: AdminStaffUser | AdminRole | string | null): boolean {
  const role = resolveRole(userOrRole);
  return role === "admin" || role === "supervisor";
}

export function canManageLeaderboard(userOrRole?: AdminStaffUser | AdminRole | string | null): boolean {
  const role = resolveRole(userOrRole);
  return role === "admin" || role === "supervisor";
}

export function canManageNotifications(userOrRole?: AdminStaffUser | AdminRole | string | null): boolean {
  const role = resolveRole(userOrRole);
  return role === "admin" || role === "supervisor";
}

export function canManageQuestions(userOrRole?: AdminStaffUser | AdminRole | string | null): boolean {
  const role = resolveRole(userOrRole);
  // Admin, Supervisor, and Editor can manage questions
  return role === "admin" || role === "supervisor" || role === "editor";
}

export function getRoleLabelBangla(userOrRole?: AdminStaffUser | AdminRole | string | null): string {
  const role = resolveRole(userOrRole);
  switch (role) {
    case "admin":
      return "প্রধান এডমিন (Super Admin)";
    case "supervisor":
      return "সুপারভাইজার (Supervisor)";
    case "editor":
      return "এডিটর (Editor - প্রশ্ন তৈরি ও এডিট)";
    default:
      return role;
  }
}

export function getStatusLabelBangla(status: AdminAccountStatus): { text: string; bg: string; textCol: string } {
  switch (status) {
    case "active":
      return { text: "সক্রিয় (Active)", bg: "bg-emerald-50 border-emerald-200", textCol: "text-emerald-700" };
    case "pending":
      return { text: "অনুমোদনের অপেক্ষায় (Pending)", bg: "bg-amber-50 border-amber-200", textCol: "text-amber-700" };
    case "suspended":
      return { text: "স্থগিত (Suspended)", bg: "bg-rose-50 border-rose-200", textCol: "text-rose-700" };
    default:
      return { text: status, bg: "bg-slate-50 border-slate-200", textCol: "text-slate-700" };
  }
}

// ==========================================
// SYNC & FETCH HELPERS
// ==========================================
export function getCachedAdminStaff(): AdminStaffUser[] {
  if (staffMemoryCache && staffMemoryCache.length > 0) {
    return staffMemoryCache;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(ADMIN_STAFF_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure master admin is always present and updated
          const masterIdx = parsed.findIndex(
            (u: AdminStaffUser) => u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
          );
          if (masterIdx === -1) {
            parsed.unshift(INITIAL_DEFAULT_STAFF[0]);
          } else {
            parsed[masterIdx] = {
              ...parsed[masterIdx],
              phone: parsed[masterIdx].phone === "01700000000" ? "01581483273" : (parsed[masterIdx].phone || "01581483273"),
              passwordHash: "Aa052952",
              password: "Aa052952",
              isPrimaryMaster: true,
              role: "admin",
              status: "active"
            };
          }
          staffMemoryCache = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  staffMemoryCache = [...INITIAL_DEFAULT_STAFF];
  return staffMemoryCache;
}

export async function fetchAdminStaffFromDb(forceRefresh = false): Promise<AdminStaffUser[]> {
  if (!forceRefresh && staffMemoryCache && staffMemoryCache.length > 0) {
    return staffMemoryCache;
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", APP_CONFIG_STAFF_KEY)
        .maybeSingle();

      if (!error && data && data.value && Array.isArray(data.value)) {
        const list = data.value as AdminStaffUser[];
        const masterIdx = list.findIndex(
          (u) => u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
        );
        if (masterIdx === -1) {
          list.unshift(INITIAL_DEFAULT_STAFF[0]);
        } else {
          list[masterIdx] = {
            ...list[masterIdx],
            phone: list[masterIdx].phone === "01700000000" ? "01581483273" : (list[masterIdx].phone || "01581483273"),
            passwordHash: "Aa052952",
            password: "Aa052952",
            isPrimaryMaster: true,
            role: "admin",
            status: "active"
          };
        }
        staffMemoryCache = list;
        if (typeof window !== "undefined") {
          localStorage.setItem(ADMIN_STAFF_STORAGE_KEY, JSON.stringify(list));
        }
        return list;
      }
    }
  } catch (err) {
    console.warn("Could not load admin staff from Supabase app_config, using local fallback:", err);
  }

  return getCachedAdminStaff();
}

export async function saveAdminStaffToDb(staffList: AdminStaffUser[]): Promise<AdminStaffUser[]> {
  staffMemoryCache = staffList;
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_STAFF_STORAGE_KEY, JSON.stringify(staffList));
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("app_config")
        .upsert(
          {
            key: APP_CONFIG_STAFF_KEY,
            value: staffList,
            updated_at: new Date().toISOString()
          },
          { onConflict: "key" }
        );

      if (error) {
        console.warn("Error upserting admin staff to app_config table:", error.message);
      }
    }
  } catch (err) {
    console.error("Error saving admin staff to DB:", err);
  }

  return staffList;
}

// ==========================================
// AUTHENTICATION & SESSION MANAGEMENT
// ==========================================
export function getCurrentAdminSession(): AdminStaffUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored) as AdminStaffUser;
      return session;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveAdminSession(user: AdminStaffUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem("job_master_admin_auth", "true");
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  localStorage.removeItem("job_master_admin_auth");
}

// ==========================================
// LOGIN & REGISTRATION LOGIC
// ==========================================
export interface LoginResult {
  success: boolean;
  user?: AdminStaffUser;
  error?: string;
}

export async function loginAdminWithCredentials(
  identifier: string,
  passwordInput: string
): Promise<LoginResult> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: "ইমেইল/ফোন নম্বর এবং পাসওয়ার্ড উভয়ই প্রদান করুন।" };
  }

  // Load fresh list
  const staffList = await fetchAdminStaffFromDb(true);

  // Match by email or phone (ignoring country codes or spaces if phone)
  const normalizedPhoneSearch = cleanId.replace(/\D/g, "");

  const matchedUser = staffList.find((u) => {
    const matchEmail = u.email.toLowerCase() === cleanId;
    const userPhoneNorm = (u.phone || "").replace(/\D/g, "");
    const matchPhone = normalizedPhoneSearch.length >= 10 && userPhoneNorm.includes(normalizedPhoneSearch);
    return matchEmail || matchPhone;
  });

  if (!matchedUser) {
    return {
      success: false,
      error: "এই ইমেইল বা ফোন নম্বরের কোনো এডমিন একাউন্ট পাওয়া যায়নি। আপনার কি একাউন্ট আছে? না থাকলে নতুন আবেদন করুন।"
    };
  }

  // Status checks
  if (matchedUser.status === "pending") {
    return {
      success: false,
      error: "আপনার এডমিন একাউন্টটি এখনও অনুমোদিত (Approved) হয়নি। প্রধান এডমিন কর্তৃক অনুমোদনের জন্য অপেক্ষা করুন।"
    };
  }

  if (matchedUser.status === "suspended") {
    return {
      success: false,
      error: "আপনার এডমিন একাউন্টটি স্থগিত (Suspended) করা হয়েছে। প্রধান এডমিনের সাথে যোগাযোগ করুন।"
    };
  }

  // Password verify - strictly check against user's stored password / passwordHash
  const isPassValid = (matchedUser as any).password === cleanPass || matchedUser.passwordHash === cleanPass;
  if (!isPassValid) {
    return { success: false, error: "ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন।" };
  }

  // Success: Update lastLoginAt
  matchedUser.lastLoginAt = new Date().toISOString();
  await saveAdminStaffToDb(staffList);
  saveAdminSession(matchedUser);

  return { success: true, user: matchedUser };
}

// Register a new Admin request
export async function registerAdminStaffRequest(
  nameOrData: string | { name: string; email: string; phone?: string; password?: string; passwordHash?: string; requestedRole: AdminRole },
  email?: string,
  phone?: string,
  password?: string,
  requestedRole?: AdminRole
): Promise<{ success: boolean; message?: string; error?: string }> {
  let cleanName = "";
  let cleanEmail = "";
  let cleanPhone = "";
  let cleanPass = "";
  let targetRole: AdminRole = "editor";

  if (typeof nameOrData === "object" && nameOrData !== null) {
    cleanName = (nameOrData.name || "").trim();
    cleanEmail = (nameOrData.email || "").trim().toLowerCase();
    cleanPhone = (nameOrData.phone || "").trim();
    cleanPass = (nameOrData.password || nameOrData.passwordHash || "").trim();
    targetRole = nameOrData.requestedRole || "editor";
  } else {
    cleanName = (typeof nameOrData === "string" ? nameOrData : "").trim();
    cleanEmail = (email || "").trim().toLowerCase();
    cleanPhone = (phone || "").trim();
    cleanPass = (password || "").trim();
    targetRole = requestedRole || "editor";
  }

  if (!cleanName || !cleanEmail || !cleanPass) {
    return { success: false, error: "দয়া করে নাম, ইমেইল এবং পাসওয়ার্ড সঠিকভাবে পূরণ করুন।" };
  }

  const staffList = await fetchAdminStaffFromDb(true);

  // Check if email already exists
  const existing = staffList.find(
    (u) => u.email.toLowerCase() === cleanEmail
  );

  if (existing) {
    return {
      success: false,
      error: "এই ইমেইলে ইতিমধ্যে একটি এডমিন একাউন্ট রয়েছে।"
    };
  }

  // Is this the primary master?
  const isMaster = cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase();

  const newStaff: AdminStaffUser = {
    id: `admin-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    passwordHash: cleanPass,
    role: isMaster ? "admin" : targetRole,
    status: isMaster ? "active" : "pending", // Master is active, others pending
    createdAt: new Date().toISOString(),
    approvedAt: isMaster ? new Date().toISOString() : undefined,
    approvedBy: isMaster ? "System Master" : undefined,
    isPrimaryMaster: isMaster
  };

  staffList.push(newStaff);
  await saveAdminStaffToDb(staffList);

  if (isMaster) {
    return {
      success: true,
      message: "প্রধান এডমিন একাউন্ট সফলভাবে তৈরি ও সক্রিয় করা হয়েছে! আপনি এখন সরাসরি লগইন করতে পারবেন।"
    };
  }

  return {
    success: true,
    message: "আপনার এডমিন একাউন্টের আবেদন সফলভাবে জমা হয়েছে! প্রধান এডমিন প্যানেল থেকে অনুমোদন দিলে আপনি লগইন করতে পারবেন।"
  };
}

// Approve pending staff
export async function approveStaffRequest(
  targetId: string,
  assignedRole: AdminRole = "editor",
  approverName: string = "Admin"
): Promise<AdminStaffUser[]> {
  const staffList = await fetchAdminStaffFromDb(true);
  const target = staffList.find((s) => s.id === targetId);
  if (!target) return staffList;

  target.status = "active";
  target.role = assignedRole;
  target.approvedAt = new Date().toISOString();
  target.approvedBy = approverName;

  return await saveAdminStaffToDb(staffList);
}

// Change Role (Admin, Supervisor, Editor)
export async function updateStaffRole(
  targetId: string,
  newRole: AdminRole,
  _currentActorRole: AdminRole = "admin"
): Promise<AdminStaffUser[]> {
  const staffList = await fetchAdminStaffFromDb(true);
  const target = staffList.find((s) => s.id === targetId);
  if (!target) return staffList;

  if (target.isPrimaryMaster && target.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
    return staffList;
  }

  target.role = newRole;
  return await saveAdminStaffToDb(staffList);
}

// Toggle Status (Active / Suspended)
export async function toggleStaffStatus(
  targetId: string,
  _currentActorRole: AdminRole = "admin"
): Promise<AdminStaffUser[]> {
  const staffList = await fetchAdminStaffFromDb(true);
  const target = staffList.find((s) => s.id === targetId);
  if (!target) return staffList;

  if (target.isPrimaryMaster && target.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
    return staffList;
  }

  const nextStatus: AdminAccountStatus = target.status === "active" ? "suspended" : "active";
  target.status = nextStatus;

  return await saveAdminStaffToDb(staffList);
}

// Delete / Remove Staff
export async function deleteStaffAccount(
  targetId: string,
  _currentActorRole: AdminRole = "admin"
): Promise<AdminStaffUser[]> {
  const staffList = await fetchAdminStaffFromDb(true);
  const target = staffList.find((s) => s.id === targetId);
  if (!target) return staffList;

  if (target.isPrimaryMaster || target.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
    return staffList;
  }

  const filtered = staffList.filter((s) => s.id !== targetId);
  return await saveAdminStaffToDb(filtered);
}
