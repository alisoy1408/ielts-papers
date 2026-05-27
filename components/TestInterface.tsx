"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReadingTest, Question } from "@/lib/types";

type Props = {
  test: ReadingTest;
  userId?: string | null;
};

export default function TestInterface({ test, userId }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(test.time_minutes * 60);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function setAnswer(id: number, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function normalise(s: string): string {
    return (s || "").toString().trim().toLowerCase().replace(/[.,;:!?'"]/g, "").replace(/\s+/g, " ");
  }

  async function handleSubmit() {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    let correct = 0;
    const details: any[] = [];
    test.questions.forEach((q: Question) => {
      const userAnswer = ((answers[q.id] as string) || "").trim();
      let isCorrect = false;

      if (q.type === "gap") {
        isCorrect = q.accept.some((a: string) => normalise(a) === normalise(userAnswer));
      } else {
        isCorrect = normalise(q.answer) === normalise(userAnswer);
      }

      if (isCorrect) correct++;
      details.push({ ...q, userAnswer, isCorrect });
    });

    const total = test.questions.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const bandScore = scoreToBand(correct, total);

    setResults({ correct, total, accuracy, bandScore, details });
    setSubmitted(true);

    if (userId) {
      try {
        await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            test_id: test.id,
            test_slug: test.slug,
            answers,
            raw_score: correct,
            total_questions: total,
            band_score: bandScore,
            time_spent_seconds: timeSpent,
          }),
        });
      } catch (e) {
        console.error("Could not save attempt:", e);
      }
    }
  }

  function scoreToBand(correct: number, total: number): number {
    const ratio = correct / total;
    if (ratio >= 0.975) return 9.0;
    if (ratio >= 0.925) return 8.5;
    if (ratio >= 0.875) return 8.0;
    if (ratio >= 0.8) return 7.5;
    if (ratio >= 0.75) return 7.0;
    if (ratio >= 0.65) return 6.5;
    if (ratio >= 0.575) return 6.0;
    if (ratio >= 0.5) return 5.5;
    if (ratio >= 0.4) return 5.0;
    if (ratio >= 0.325) return 4.5;
    if (ratio >= 0.25) return 4.0;
    return 3.5;
  }

  if (submitted && results) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">Test Complete</h1>
          <p className="text-gray-600 mb-6">{test.title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Score</div>
              <div className="text-3xl font-bold">{results.correct}/{results.total}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Accuracy</div>
              <div className="text-3xl font-bold">{results.accuracy}%</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">Estimated Band</div>
              <div className="text-3xl font-bold">{results.bandScore}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-brand text-white rounded hover:bg-brand-dark">
              Try again
            </button>
            <button onClick={() => router.push("/")} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              More tests
            </button>
            <button onClick={() => router.push("/dashboard")} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              My dashboard
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Answer Review</h2>
          <div className="space-y-3">
            {results.details.map((q: any, i: number) => (
              <div key={q.id} className={`p-3 rounded border ${q.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-start gap-2">
                  <span className="font-bold">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="text-sm">{renderQuestionPreview(q)}</div>
                    <div className="text-sm mt-1">
                      <span className="font-medium">Your answer:</span>{" "}
                      <span className={q.isCorrect ? "text-green-700" : "text-red-700"}>
                        {q.userAnswer || "(blank)"}
                      </span>
                    </div>
                    {!q.isCorrect && (
                      <div className="text-sm">
                        <span className="font-medium">Correct:</span>{" "}
                        <span className="text-green-700">{q.answer}</span>
                      </div>
                    )}
                    {q.explanation && (
                      <div className="text-xs text-gray-600 mt-1">💡 {q.explanation}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 py-3 mb-4 flex justify-between items-center z-40">
        <div>
          <h1 className="font-bold text-lg">{test.title}</h1>
          <p className="text-xs text-gray-500">{test.questions.length} questions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded font-mono font-bold ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-gray-100"}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
          <button onClick={handleSubmit} className="px-4 py-2 bg-brand text-white rounded hover:bg-brand-dark font-medium">
            Submit
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passage */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:max-h-[80vh] lg:overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{test.passage_title}</h2>
          <div className="prose prose-sm max-w-none">
            {test.paragraphs.map((p, i) => (
              <p key={i} className="mb-3 text-gray-800 leading-relaxed">
                {hasParagraphLetters(test.questions) && (
                  <span className="font-bold mr-2">{String.fromCharCode(65 + i)}</span>
                )}
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:max-h-[80vh] lg:overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Questions</h2>
          <div className="space-y-6">
            {test.questions.map((q: Question) => (
              <QuestionBlock
                key={q.id}
                question={q}
                value={answers[q.id] || ""}
                onChange={(v) => setAnswer(q.id, v)}
              />
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="mt-6 w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-md font-medium"
          >
            Submit answers
          </button>
        </div>
      </div>
    </div>
  );
}

function hasParagraphLetters(questions: Question[]): boolean {
  return questions.some((q: Question) => q.type === "match_para");
}

function renderQuestionPreview(q: any): string {
  if (q.text) return q.text;
  if (q.before && q.after) return `${q.before} _____ ${q.after}`;
  if (q.before) return q.before;
  return "Question";
}

function QuestionBlock({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = question.id;

  if (question.type === "tfng") {
    return (
      <div>
        <div className="text-sm font-medium mb-2">
          <span className="font-bold mr-2">{id}.</span>
          {question.text}
        </div>
        <div className="flex flex-wrap gap-2">
          {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
            <button key={opt} onClick={() => onChange(opt)}
              className={`px-3 py-1.5 text-sm rounded border ${value === opt ? "bg-brand text-white border-brand" : "border-gray-300 hover:bg-gray-50"}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "ynng") {
    return (
      <div>
        <div className="text-sm font-medium mb-2">
          <span className="font-bold mr-2">{id}.</span>
          {question.text}
        </div>
        <div className="flex flex-wrap gap-2">
          {["YES", "NO", "NOT GIVEN"].map((opt) => (
            <button key={opt} onClick={() => onChange(opt)}
              className={`px-3 py-1.5 text-sm rounded border ${value === opt ? "bg-brand text-white border-brand" : "border-gray-300 hover:bg-gray-50"}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "mcq") {
    return (
      <div>
        <div className="text-sm font-medium mb-2">
          <span className="font-bold mr-2">{id}.</span>
          {question.text}
        </div>
        <div className="space-y-1.5">
          {question.options.map((opt: string, i: number) => {
            const letter = String.fromCharCode(65 + i);
            return (
              <button key={letter} onClick={() => onChange(letter)}
                className={`w-full text-left px-3 py-2 text-sm rounded border ${value === letter ? "bg-brand text-white border-brand" : "border-gray-300 hover:bg-gray-50"}`}>
                <span className="font-bold mr-2">{letter}.</span>{opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "gap") {
    return (
      <div>
        <div className="text-sm font-medium">
          <span className="font-bold mr-2">{id}.</span>
          {question.before}
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
            className="mx-1 px-2 py-0.5 border border-gray-300 rounded text-sm w-32 focus:border-brand-accent focus:ring-1 focus:ring-brand-light outline-none"
            placeholder="answer" />
          {question.after}
        </div>
      </div>
    );
  }

  if (question.type === "match_para") {
    const letters = question.options || ["A", "B", "C", "D", "E", "F"];
    return (
      <div>
        <div className="text-sm font-medium mb-2">
          <span className="font-bold mr-2">{id}.</span>
          {question.text}
        </div>
        <div className="flex flex-wrap gap-2">
          {letters.map((letter: string) => (
            <button key={letter} onClick={() => onChange(letter)}
              className={`w-10 h-10 text-sm font-bold rounded border ${value === letter ? "bg-brand text-white border-brand" : "border-gray-300 hover:bg-gray-50"}`}>
              {letter}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "match_list") {
    return (
      <div>
        <div className="text-sm font-medium mb-2">
          <span className="font-bold mr-2">{id}.</span>
          {question.text}
        </div>
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-brand-accent focus:ring-1 focus:ring-brand-light outline-none">
          <option value="">— Select —</option>
          {question.list.map((item: { label: string; text: string }) => (
            <option key={item.label} value={item.label}>
              {item.label}. {item.text}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return <div>Unknown question type</div>;
}
