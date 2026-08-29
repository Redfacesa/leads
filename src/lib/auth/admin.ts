import { createClient } from "@/lib/supabase/server";

export async function requireAdminSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("connect_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const adminEmails = (process.env.CONNECT_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin =
    profile?.role === "admin" ||
    profile?.role === "connect_staff" ||
    (user.email && adminEmails.includes(user.email.toLowerCase()));

  if (!isAdmin) return { ok: false as const, error: "Forbidden", status: 403 };

  return { ok: true as const, supabase, user };
}
