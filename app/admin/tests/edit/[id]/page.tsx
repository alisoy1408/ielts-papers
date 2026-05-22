import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import TestEditor from "@/components/TestEditor";

export default async function EditTestPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: test } = await supabase
    .from("tests").select("*").eq("id", params.id).single();

  if (!test) notFound();

  return <TestEditor initial={test} />;
}
