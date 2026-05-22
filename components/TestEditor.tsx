"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import type { Question } from "@/lib/types";

type Props = {
  initial?: {
    id?: string;
    slug: string;
    title: string;
    test_number: number;
    difficulty: string;
    time_minutes: number;
    passage_title: string;
    paragraphs: string[];
    questions: Question[];
    is_published: boolean;
  };
};

export default function TestEditor({ initial }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [slug, setSlug] = useState(initial?.slug || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [testNumber, setTestNumber] = useState(initial?.test_number || 1);
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "Band 6 – 7");
  const [timeMinutes, setTimeMinutes] = useState(initial?.time_minutes || 20);
  const [passageTitle, setPassageTitle] = useState(initial?.passage_title || "");
  const [paragraphsText, setParagraphsText] = useState((initial?.paragraphs || []).join("\n\n"));
  const [questionsJson, setQuestionsJson] = useState(JSON.stringify(initial?.questions || defaultQuestions(), null, 2));
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function defaultQuestions(): Question[] {
    return [
      { id: 1, type: "tfng", text: "Statement here.", answer: "TRUE", explanation: "Paragraph 1: ..." },
      { id: 2, type: "tfng", text: "Statement here.", answer: "FALSE", explanation: "Paragraph 2: ..." },
      { id: 3, type: "tfng", text: "Statement here.", answer: "NOT GIVEN", explanation: "Paragraph 3: ..." },
      { id: 4, type: "tfng", text: "Statement here.", answer: "TRUE", explanation: "Paragraph 3: ..." },
      { id: 5, type: "tfng", text: "Statement here.", answer: "FALSE", explanation: "Paragraph 4: ..." },
      { id: 6, type: "tfng", text: "Statement here.", answer: "TRUE", explanation: "Paragraph 5: ..." },
      { id: 7, type: "tfng", text: "Statement here.", answer: "FALSE", explanation: "Paragraph 6: ..." },
      { id: 8, type: "gap", before: "Before the gap", after: "after the gap.", answer: "word", accept: ["word"], explanation: "Paragraph 1." },
      { id: 9, type: "gap", before: "Before the gap", after: "after the gap.", answer: "word", accept: ["word"], explanation: "Paragraph 2." },
      { id: 10, type: "gap", before: "Before the gap", after: "after the gap.", answer: "word", accept: ["word"], explanation: "Paragraph 3." },
      { id: 11, type: "gap", before: "Before the gap", after: "after the gap.", answer: "word", accept: ["word"], explanation: "Paragraph 4." },
      { id: 12, type: "gap", before: "Before the gap", after: "after the gap.", answer: "word", accept: ["word"], explanation: "Paragraph 5." },
      { id: 13, type: "gap", before: "Before the gap", after: "after the gap.", answer: "word", accept: ["word"], explanation: "Paragraph 6." },
    ];
  }

  async function handleSave() {
    setError("");
    setSaving(true);

    let questions: Question[];
    try {
      questions = JSON.parse(questionsJson);
      if (!Array.isArray(questions)) throw new Error("Questions must be an array");
    } catch (e: any) {
      setError("Invalid questions JSON: " + e.message);
      setSaving(false);
      return;
    }

    const paragraphs = paragraphsText.split("\n\n").map(p => p.trim()).filter(p => p.length > 0);
    if (paragraphs.length === 0) {
      setError("At least one paragraph required");
      setSaving(false);
      return;
    }

    const payload = {
      slug,
      title,
      test_number: testNumber,
      difficulty,
      time_minutes: timeMinutes,
      passage_title: passageTitle,
      paragraphs,
      questions,
      total_questions: questions.length,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (initial?.id) {
      result = await supabase.from("tests").update(payload).eq("id", initial.id);
    } else {
      result = await supabase.from("tests").insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
    } else {
      router.push("/admin/tests");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm("Delete this test? This cannot be undone.")) return;
    setSaving(true);
    const { error } = await supabase.from("tests").delete().eq("id", initial.id);
    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      router.push("/admin/tests");
      router.refresh();
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-brand-accent font-medium mb-1">Admin</p>
        <h1 className="text-3xl font-bold">{initial?.id ? "Edit test" : "New test"}</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Slug (URL)</label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                   placeholder="mini-test-05-topic" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            <p className="text-xs text-gray-500 mt-1">URL will be /tests/{slug || "your-slug"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Test number</label>
            <input type="number" value={testNumber} onChange={e => setTestNumber(parseInt(e.target.value) || 1)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title (internal)</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                 placeholder="The Surprising Intelligence of the Octopus" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Passage title (shown to students)</label>
          <input type="text" value={passageTitle} onChange={e => setPassageTitle(e.target.value)}
                 placeholder="The Surprising Intelligence of the Octopus" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>Band 5 – 6</option>
              <option>Band 6 – 7</option>
              <option>Band 7 – 8</option>
              <option>Band 8 – 9</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time (minutes)</label>
            <input type="number" value={timeMinutes} onChange={e => setTimeMinutes(parseInt(e.target.value) || 20)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)}
                     className="w-4 h-4" />
              <span className="text-sm font-medium">Published (visible to users)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Passage paragraphs</label>
          <textarea value={paragraphsText} onChange={e => setParagraphsText(e.target.value)}
                    rows={12} placeholder="Paragraph 1...&#10;&#10;Paragraph 2...&#10;&#10;Paragraph 3..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm" />
          <p className="text-xs text-gray-500 mt-1">Separate paragraphs with a blank line</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Questions (JSON)</label>
          <textarea value={questionsJson} onChange={e => setQuestionsJson(e.target.value)}
                    rows={20} className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs" />
          <p className="text-xs text-gray-500 mt-1">
            Edit questions as JSON. Types: <code>tfng</code> (True/False/Not Given) or <code>gap</code> (sentence completion).
          </p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>}

        <div className="flex gap-3 justify-between pt-3 border-t border-gray-200">
          <div>
            {initial?.id && (
              <button onClick={handleDelete} disabled={saving}
                      className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded text-sm">
                Delete test
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push("/admin/tests")} className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded text-sm">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
                    className="px-5 py-2 bg-brand hover:bg-brand-dark text-white rounded text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : initial?.id ? "Save changes" : "Create test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
