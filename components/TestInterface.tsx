"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ReadingTest, Question } from "@/lib/types";

type Props = {
  test: ReadingTest;
  userId?: string | null;
};

type FontSize = "sm" | "md" | "lg";

const FONT_CLASS: Record<FontSize, string> = {
  sm: "text-sm leading-relaxed",
  md: "text-base leading-relaxed",
  lg: "text-lg leading-loose",
};

export default function TestInterface({ test, userId }: Props) {
  const router = useRouter();

  // ============ STATE ============
  const [showIntro, setShowIntro] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(test.time_minutes * 60);
  const [startTime, setStartTime] = useState(Date.now());
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [splitPct, setSplitPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const passageRef = useRef<HTMLDivElement | null>(null);

  // ============ TIMER ============
  useEffect(() => {
    if (submitted || showIntro) return;
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
  }, [submitted, showIntro]);

  // ============ DRAGGING SPLITTER ============
  useEffect(() => {
    if (!isDragging) return;

    function onMove(e: MouseEvent) {
      const container = document.getElementById("split-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      // Constrain between 25% and 75%
      const constrained = Math.max(25, Math.min(75, pct));
      setSplitPct(constrained);
    }

    function onUp() {
      setIsDragging(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  // ============ HIGHLIGHT ON DOUBLE-CLICK / SELECTION ============
  function handlePassageMouseUp() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!passageRef.current || !passageRef.current.contains(range.commonAncestorContainer)) return;

    try {
      const span = document.createElement("span");
      span.className = "bg-yellow-200 cursor-pointer";
      span.dataset.highlight = "1";
      span.title = "Click to remove highlight";
      span.onclick = function () {
        const parent = span.parentNode;
        if (!parent) return;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
        parent.normalize();
      };
      range.surroundContents(span);
      selection.removeAllRanges();
    } catch (e) {
      // surroundContents fails on partial-element selections — ignore
    }
  }

  function clearHighlights() {
    if (!passageRef.current) return;
    const spans = passageRef.current.querySelectorAll('span[data-highlight="1"]');
    spans.forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    });
    passageRef.current.normalize();
  }

  // ============ HELPERS ============
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

  function startTest() {
    setShowIntro(false);
    setStartTime(Date.now());
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

  function answeredCount(): number {
    return Object.values(answers).filter((v) => v && v.toString().trim() !== "").length;
  }

  // ============ INTRO MODAL ============
  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">IELTS Academic Reading</div>
            <h1 className="text-2xl font-bold mb-2">{test.title}</h1>
            <div className="text-sm text-gray-600">{test.difficulty || ""}</div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
              <div className="text-xs text-gray-600">Questions</div>
              <div className="text-xl font-bold text-blue-900">{test.questions.length}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
              <div className="text-xs text-gray-600">Time</div>
              <div className="text-xl font-bold text-green-900">{test.time_minutes} min</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-3 text-center">
              <div className="text-xs text-gray-600">Passage</div>
              <div className="text-xl font-bold text-purple-900">{test.paragraphs.length} ¶</div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6 text-sm text-gray-700">
            <div className="font-bold mb-2">Before you start:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>The test starts when you click <strong>Begin test</strong>.</li>
              <li>The timer will count down — your answers auto-submit when time runs out.</li>
              <li>Select text in the passage to <strong>highlight</strong> it. Click a highlight to remove.</li>
              <li>Use the <strong>A A A</strong> buttons to change passage text size.</li>
              <li>Drag the centre divider to resize the passage and questions panels.</li>
              <li>You can return to any question before submitting.</li>
            </ul>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back to tests
            </button>
            <button
              onClick={startTest}
              className="px-6 py-3 bg-brand text-white font-bold rounded-md hover:bg-brand-dark"
            >
              Begin test →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ RESULTS PAGE ============
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
          <div className="flex gap-3 flex-wrap">
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

  // ============ MAIN TEST UI ============
  return (
    <div className="max-w-[1400px] mx-auto px-2 lg:px-4 py-3">
      {/* Top toolbar */}
      <div className="bg-white border border-gray-200 rounded-t-lg px-4 py-2 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">IELTS Reading</div>
            <div className="font-bold text-sm">{test.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Font size controls */}
          <div className="flex items-center border border-gray-300 rounded overflow-hidden text-xs">
            <button
              onClick={() => setFontSize("sm")}
              className={`px-2 py-1 ${fontSize === "sm" ? "bg-brand text-white" : "bg-white hover:bg-gray-50"}`}
              title="Small text"
            >
              A
            </button>
            <button
              onClick={() => setFontSize("md")}
              className={`px-2 py-1 text-sm ${fontSize === "md" ? "bg-brand text-white" : "bg-white hover:bg-gray-50"}`}
              title="Medium text"
            >
              A
            </button>
            <button
              onClick={() => setFontSize("lg")}
              className={`px-2 py-1 text-base ${fontSize === "lg" ? "bg-brand text-white" : "bg-white hover:bg-gray-50"}`}
              title="Large text"
            >
              A
            </button>
          </div>

          {/* Clear highlights */}
          <button
            onClick={clearHighlights}
            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            title="Remove all highlights"
          >
            ✎ Clear highlights
          </button>

          {/* Timer */}
          <div className={`px-3 py-1 rounded font-mono font-bold text-sm ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-gray-100"}`}>
            ⏱ {formatTime(timeLeft)}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 bg-brand text-white rounded hover:bg-brand-dark font-medium text-sm"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Split-view container */}
      <div
        id="split-container"
        className="relative flex border border-gray-200 border-t-0 rounded-b-lg bg-white overflow-hidden"
        style={{ height: "calc(100vh - 180px)", minHeight: "500px" }}
      >
        {/* Passage panel */}
        <div
          ref={passageRef}
          onMouseUp={handlePassageMouseUp}
          className="overflow-y-auto p-5 border-r border-gray-200"
          style={{ width: `${splitPct}%` }}
        >
          <h2 className="text-xl font-bold mb-3">{test.passage_title}</h2>
          <div className={FONT_CLASS[fontSize]}>
            {test.paragraphs.map((p, i) => (
              <p key={i} className="mb-3 text-gray-800">
                {hasParagraphLetters(test.questions) && (
                  <span className="font-bold mr-2">{String.fromCharCode(65 + i)}</span>
                )}
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Splitter handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          className="w-1 bg-gray-200 hover:bg-brand cursor-col-resize flex-shrink-0 relative group"
          title="Drag to resize"
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-brand/20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 rounded-full group-hover:bg-brand"></div>
        </div>

        {/* Questions panel */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Questions</h2>
            <div className="text-xs text-gray-500">{answeredCount()} / {test.questions.length} answered</div>
          </div>
          <div className="space-y-5">
            {test.questions.map((q: Question) => {
              const heading = (q as any).section_heading;
              return (
                <div key={q.id}>
                  {heading && <SectionHeading data={heading} />}
                  <QuestionBlock
                    question={q}
                    value={answers[q.id] || ""}
                    onChange={(v) => setAnswer(q.id, v)}
                  />
                </div>
              );
            })}
          </div>
          <button
            onClick={handleSubmit}
            className="mt-6 w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-md font-medium"
          >
            Submit answers
          </button>
        </div>
      </div>

      {/* Question navigation (bottom) */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg px-4 py-2 mt-2 flex items-center gap-2 overflow-x-auto">
        <div className="text-xs text-gray-500 flex-shrink-0">Questions:</div>
        {test.questions.map((q) => {
          const isAnswered = answers[q.id] && answers[q.id].toString().trim() !== "";
          return (
            <a
              key={q.id}
              href={`#q-${q.id}`}
              className={`flex-shrink-0 w-7 h-7 text-xs flex items-center justify-center rounded border ${
                isAnswered
                  ? "bg-brand text-white border-brand"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              }`}
            >
              {q.id}
            </a>
          );
        })}
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

// ============ SECTION HEADING ============
type SectionHeadingData = {
  title?: string;
  instruction?: string;
  legend?: string[];
  list?: string[];
  summary?: string;
};

function SectionHeading({ data }: { data: SectionHeadingData }) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 mb-3 rounded-r">
      {data.title && (
        <div className="font-bold text-sm text-blue-900 mb-1">{data.title}</div>
      )}
      {data.instruction && (
        <div className="text-sm text-gray-800 whitespace-pre-line">{data.instruction}</div>
      )}
      {data.legend && data.legend.length > 0 && (
        <div className="mt-2 text-xs text-gray-700 space-y-0.5">
          {data.legend.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
      {data.list && data.list.length > 0 && (
        <div className="mt-2 bg-white border border-gray-200 rounded p-2 text-xs">
          <div className="font-bold mb-1">List of People and Groups</div>
          {data.list.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
      {data.summary && (
        <div className="mt-2 text-sm text-gray-800 italic">{data.summary}</div>
      )}
    </div>
  );
}

// ============ QUESTION BLOCK ============
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
      <div id={`q-${id}`} className="scroll-mt-4">
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
      <div id={`q-${id}`} className="scroll-mt-4">
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
      <div id={`q-${id}`} className="scroll-mt-4">
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
      <div id={`q-${id}`} className="scroll-mt-4">
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
      <div id={`q-${id}`} className="scroll-mt-4">
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
      <div id={`q-${id}`} className="scroll-mt-4">
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
