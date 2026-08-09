import { getSupabase } from "./supabase";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  student_id: string;
  role: "Student" | "Admin" | "Moderator";
  status: "Active" | "Banned";
  created_at?: string;
  avatar_url?: string;
}

export function generateStudentId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `JM-${randomNum}`;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email || "",
      full_name: data.full_name || data.name || "শিক্ষার্থী",
      phone_number: data.phone_number || data.phone || "",
      student_id: data.student_id || data.studentId || `JM-${data.id.substring(0, 6)}`,
      role: data.role || "Student",
      status: data.status === "Banned" || data.status === "banned" ? "Banned" : "Active",
      created_at: data.created_at || new Date().toISOString(),
      avatar_url: data.avatar_url || "",
    };
  } catch (err) {
    console.error("Error fetching user profile from Supabase:", err);
    return null;
  }
}

export async function upsertUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const payload = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      student_id: profile.student_id,
      role: profile.role || "Student",
      status: profile.status || "Active",
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      console.warn("Supabase profile upsert warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error upserting user profile:", err);
    return false;
  }
}

export async function fetchAllProfilesFromDb(): Promise<UserProfile[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("Unable to fetch profiles from Supabase:", error?.message);
      return [];
    }

    return data.map((item: any) => ({
      id: String(item.id),
      email: String(item.email || ""),
      full_name: String(item.full_name || item.name || "অজ্ঞাত শিক্ষার্থী"),
      phone_number: String(item.phone_number || item.phone || "—"),
      student_id: String(item.student_id || item.studentId || `JM-${String(item.id).substring(0, 6)}`),
      role: (item.role as any) || "Student",
      status: item.status === "Banned" || item.status === "banned" ? "Banned" : "Active",
      created_at: item.created_at ? new Date(item.created_at).toLocaleDateString("bn-BD") : "সাম্প্রতিক",
      avatar_url: item.avatar_url || "",
    }));
  } catch (err) {
    console.error("Error fetching all profiles:", err);
    return [];
  }
}

export async function updateUserStatusInDb(userId: string, newStatus: "Active" | "Banned"): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      console.warn("Supabase update user status warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error updating user status in DB:", err);
    return false;
  }
}

export async function deleteUserProfileFromDb(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      console.warn("Supabase delete profile warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error deleting user profile from DB:", err);
    return false;
  }
}
