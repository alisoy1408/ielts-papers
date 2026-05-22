import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: attempts } = await supabase
    .from("attempts")
    .select("*, tests(title, passage_title, test_number)")
    .order("completed_at", { ascending: false })
    .limit(20);

  const totalAttempts = attempts?.length || 0;
  const avgScore = attempts && attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.raw_score / a.total_questions) * 100, 0) / attempts.length)
    : 0;
  const bestBand = attempts && attempts.length > 0
    ? attempts.map(a => parseFloat(a.band_score || "0")).sort((a, b) => b - a)[0]
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Welcome back, {profile?.full_name || "Student"}</h1>
        <p className="text-gray-500 text-sm">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Tests taken</p>
          <p className="text-3xl font-bold mt-1">{totalAttempts}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Average accuracy</p>
          <p className="text-3xl font-bold mt-1">{avgScore}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Best band score</p>
          <p className="text-3xl font-bold mt-1 text-emerald-600">{bestBand > 0 ? bestBand : "—"}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-medium mb-4">Recent attempts</h2>
        {!attempts || attempts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-600 mb-3">You haven't taken any tests yet.</p>
            <Link href="/" className="inline-block bg-brand hover:bg-brand-dark text-white px-5 py-2 rounded-md text-sm font-medium">
              Browse tests
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Test</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Band</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a: any) => (
                  <tr key={a.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <Link href={`/tests/${a.test_slug}`} className="text-brand-accent hover:underline">
                        {a.tests?.passage_title || a.test_slug}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">{a.raw_score} / {a.total_questions}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">{a.band_score}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(a.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
