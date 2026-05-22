import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Access denied</h1>
        <p className="text-gray-600">You don't have admin access to this page.</p>
        <Link href="/dashboard" className="inline-block mt-4 text-brand-accent hover:underline">Go to dashboard</Link>
      </div>
    );
  }

  const { count: testCount } = await supabase.from("tests").select("*", { count: "exact", head: true });
  const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: attemptCount } = await supabase.from("attempts").select("*", { count: "exact", head: true });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-brand-accent font-medium mb-1">Admin</p>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Tests</p>
          <p className="text-3xl font-bold mt-1">{testCount || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-3xl font-bold mt-1">{userCount || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Total attempts</p>
          <p className="text-3xl font-bold mt-1">{attemptCount || 0}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/admin/tests" className="bg-white border border-gray-200 rounded-xl p-6 hover:border-brand-accent hover:shadow-md transition">
          <div className="text-2xl mb-2">📝</div>
          <h2 className="font-medium mb-1">Manage tests</h2>
          <p className="text-sm text-gray-500">View, edit, delete reading tests</p>
        </Link>
        <Link href="/admin/tests/new" className="bg-white border border-gray-200 rounded-xl p-6 hover:border-brand-accent hover:shadow-md transition">
          <div className="text-2xl mb-2">➕</div>
          <h2 className="font-medium mb-1">New test</h2>
          <p className="text-sm text-gray-500">Create a new reading test from scratch</p>
        </Link>
      </div>
    </div>
  );
}
