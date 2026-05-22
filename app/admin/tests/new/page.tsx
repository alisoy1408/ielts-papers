import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import TestEditor from "@/components/TestEditor";

export default async function NewTestPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  return <TestEditor />;
}
