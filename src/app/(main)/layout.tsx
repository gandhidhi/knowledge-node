import { redirect } from "next/navigation";

import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
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
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header
        email={user.email ?? ""}
        displayName={profile?.display_name ?? user.email ?? ""}
        isAdmin={profile?.role === "admin"}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
