import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export default async function AdminTestsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: tests } = await supabase
    .from("tests")
    .select("id, slug, title, passage_title, test_number, difficulty, total_questions, is_published, created_at")
    .order("test_number", { ascending: true });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-accent font-medium mb-1">Admin</p>
          <h1 className="text-3xl font-bold">Tests</h1>
        </div>
        <Link href="/admin/tests/new" className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-md text-sm font-medium">
          + New test
        </Link>
      </div>

      {!tests || tests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">No tests yet. Create your first one!</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(test => (
                <tr key={test.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-gray-500">{test.test_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{test.passage_title}</div>
                    <div className="text-xs text-gray-500">{test.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{test.difficulty}</td>
                  <td className="px-4 py-3 text-gray-600">{test.total_questions}</td>
                  <td className="px-4 py-3">
                    {test.is_published ? (
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">Published</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link href={`/tests/${test.slug}`} className="text-gray-500 hover:text-brand-accent text-xs" target="_blank">View</Link>
                    <Link href={`/admin/tests/edit/${test.id}`} className="text-brand-accent hover:underline text-xs font-medium">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
