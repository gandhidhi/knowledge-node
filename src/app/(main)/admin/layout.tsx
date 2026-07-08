import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { createClient } from "@/lib/supabase/server";

/** 管理者専用レイアウト。role チェックを行い、非管理者はリダイレクトする。 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/projects");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-3 text-2xl font-semibold">管理画面</h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
