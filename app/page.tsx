import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export const revalidate = 60; // Refresh test list every 60 seconds

export default async function HomePage() {
  const supabase = createClient();
  const { data: tests, error } = await supabase
    .from("tests")
    .select("id, slug, title, test_number, difficulty, time_minutes, total_questions, passage_title, test_type")
    .eq("is_published", true)
    .order("test_number", { ascending: true });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <section className="text-center py-10 mb-10 bg-gradient-to-b from-brand-light to-white rounded-xl">
        <h1 className="text-4xl md:text-5xl font-bold text-brand mb-3">Free IELTS Reading Practice</h1>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Original IELTS Academic Reading tests in the real computer-based exam format. Timed, scored, and free.
        </p>
        <div className="flex justify-center gap-3 flex-wrap text-sm text-gray-500">
          <span className="bg-white px-3 py-1 rounded-full border">✓ Free practice</span>
          <span className="bg-white px-3 py-1 rounded-full border">✓ Real exam interface</span>
          <span className="bg-white px-3 py-1 rounded-full border">✓ Save your progress</span>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-medium mb-6">Available tests {tests && `(${tests.length})`}</h2>
        {error && <p className="text-red-600 text-sm mb-4">Error loading tests. Please refresh.</p>}
        {!tests || tests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No tests available yet.</p>
            <p className="text-sm mt-2">Check back soon for new content.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {tests.map(test => (
              <Link key={test.id} href={`/tests/${test.slug}`}
                    className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-brand-accent hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-brand-accent bg-brand-light px-2 py-1 rounded">
                    Test {test.test_number}
                  </span>
                  <span className="text-xs text-gray-500">{test.difficulty}</span>
                </div>
                <h3 className="text-lg font-medium mb-2">{test.passage_title}</h3>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>⏱ {test.time_minutes} min</span>
                  <span>📝 {test.total_questions} questions</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16 py-10 border-t border-gray-100">
        <h2 className="text-2xl font-medium text-center mb-8">Why ielts-papers.com</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">🎓</div>
            <h3 className="font-medium mb-1">Created by educators</h3>
            <p className="text-sm text-gray-600">Tests written by qualified English language lecturers with academic backgrounds.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💻</div>
            <h3 className="font-medium mb-1">Real exam interface</h3>
            <p className="text-sm text-gray-600">Computer-based format with split screen, timer, highlighting, and font size controls.</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-medium mb-1">Track your progress</h3>
            <p className="text-sm text-gray-600">Create a free account to save attempts, see your history, and monitor band score improvement.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
