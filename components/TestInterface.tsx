"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import type { ReadingTest, GapQuestion, TfngQuestion } from "@/lib/types";
import { getBandScore, checkGapAnswer } from "@/lib/types";

type Answers = Record<number, string>;
type View = "intro" | "test" | "results";
type FontSize = "s" | "m" | "l";

export default function TestInterface({ test, userId }: { test: ReadingTest; userId: string | null }) {
  const [view, setView] = useState<View>("intro");
  const [answers, setAnswers] = useState<Answers>({});
  const [timeLeft, setTimeLeft] = useState(test.time_minutes * 60);
  const [fontSize, setFontSize] = useState<FontSize>("m");
  const [leftWidthPct, setLeftWidthPct] = useState(50);
  const [floatToolbar, setFloatToolbar] = useState<{ x: number; y: number; markEl?: HTMLElement } | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [savedAttempt, setSavedAttempt] = useState(false);

  const passageRef = useRef<HTMLDivElement>(null);
  const splitWrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Timer
  useEffect(() => {
    if (view !== "test") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Selection toolbar for highlighting
  useEffect(() => {
    if (view !== "test") return;
    function handleMouseUp(e: MouseEvent) {
      if ((e.target as HTMLElement).closest(".float-toolbar")) return;
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.toString().trim() === "") { setFloatToolbar(null); return; }
        const range = sel.getRangeAt(0);
        if (!passageRef.current?.contains(range.commonAncestorContainer)) { setFloatToolbar(null); return; }
        const rect = range.getBoundingClientRect();
        setFloatToolbar({ x: rect.left + rect.width / 2, y: rect.top - 8 });
      }, 10);
    }
    function handlePassageClick(e: MouseEvent) {
      const mark = (e.target as HTMLElement).closest("mark.hl-yellow") as HTMLElement | null;
      if (mark) {
        const rect = mark.getBoundingClientRect();
        setFloatToolbar({ x: rect.left + rect.width / 2, y: rect.top - 8, markEl: mark });
      }
    }
    function handleScroll() { setFloatToolbar(null); }
    document.addEventListener("mouseup", handleMouseUp);
    passageRef.current?.addEventListener("click", handlePassageClick);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      passageRef.current?.removeEventListener("click", handlePassageClick);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [view]);

  // Divider drag
  const handleDividerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const wrap = splitWrapRef.current;
    if (!wrap) return;
    const startRect = wrap.getBoundingClientRect();
    const startPct = leftWidthPct;
    function onMove(ev: MouseEvent | TouchEvent) {
      const clientX = "touches" in ev ? ev.touches[0].clientX : ev.clientX;
      const deltaPx = clientX - startX;
      const deltaPct = (deltaPx / startRect.width) * 100;
      let newPct = startPct + deltaPct;
      const minPct = (200 / startRect.width) * 100;
      const maxPct = 100 - minPct;
      newPct = Math.max(minPct, Math.min(maxPct, newPct));
      setLeftWidthPct(newPct);
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }, [leftWidthPct]);

  function startTest() {
    setView("test");
    setAnswers({});
    setTimeLeft(test.time_minutes * 60);
    setStartedAt(Date.now());
    setSavedAttempt(false);
  }

  function restart() {
    setView("intro");
    setAnswers({});
    setTimeLeft(test.time_minutes * 60);
    setSavedAttempt(false);
  }

  function selectTfng(id: number, value: string) {
    setAnswers(a => ({ ...a, [id]: value }));
  }

  function setGap(id: number, value: string) {
    setAnswers(a => {
      const copy = { ...a };
      if (value.trim() === "") delete copy[id]; else copy[id] = value;
      return copy;
    });
  }

  function scrollToQuestion(id: number) {
    const el = document.getElementById(`q-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const gap = document.getElementById(`gap-${id}`) as HTMLInputElement | null;
      if (gap) setTimeout(() => gap.focus(), 300);
    }
  }

  function highlightSelection() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.toString().trim() === "") return;
    const range = sel.getRangeAt(0);
    if (!passageRef.current?.contains(range.commonAncestorContainer)) return;
    try {
      const mark = document.createElement("mark");
      mark.className = "hl-yellow";
      try { range.surroundContents(mark); }
      catch { const c = range.extractContents(); mark.appendChild(c); range.insertNode(mark); }
      sel.removeAllRanges();
    } catch (e) { console.error(e); }
    setFloatToolbar(null);
  }

  function removeHighlight(markEl: HTMLElement) {
    const parent = markEl.parentNode;
    if (!parent) return;
    while (markEl.firstChild) parent.insertBefore(markEl.firstChild, markEl);
    parent.removeChild(markEl);
    parent.normalize();
    setFloatToolbar(null);
  }

  function clearAllHighlights() {
    passageRef.current?.querySelectorAll("mark.hl-yellow").forEach(el => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize();
    });
    setFloatToolbar(null);
  }

  async function handleSubmit() {
    if (timerRef.current) clearInterval(timerRef.current);
    setView("results");

    // Calculate score
    let correct = 0;
    test.questions.forEach(q => {
      const u = answers[q.id];
      if (!u) return;
      let isCorrect = false;
      if (q.type === "tfng") isCorrect = u === q.answer;
      else isCorrect = checkGapAnswer(q as GapQuestion, u);
      if (isCorrect) correct++;
    });

    // Save to database if logged in
    if (userId && !savedAttempt) {
      setSavedAttempt(true);
      const rawEquiv = Math.round((correct * 40) / test.total_questions);
      const band = getBandScore(rawEquiv);
      const timeSpent = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;

      try {
        await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            test_id: test.id,
            test_slug: test.slug,
            answers,
            raw_score: correct,
            total_questions: test.total_questions,
            band_score: band,
            time_spent_seconds: timeSpent,
          }),
        });
      } catch (e) {
        console.error("Failed to save attempt", e);
      }
    }
  }

  const fontSizeClass = fontSize === "s" ? "text-[12px]" : fontSize === "l" ? "text-[17px]" : "text-[14px]";
  const answeredCount = Object.keys(answers).filter(k => answers[Number(k)] !== "").length;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const tfngQs = test.questions.filter(q => q.type === "tfng") as TfngQuestion[];
  const gapQs = test.questions.filter(q => q.type === "gap") as GapQuestion[];

  // INTRO
  if (view === "intro") {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl p-8 text-center">
        <h1 className="text-2xl font-medium mb-2">{test.title}</h1>
        <p className="text-sm text-gray-500 mb-4">IELTS Academic Reading · Test {test.test_number}</p>
        <div className="flex justify-center gap-6 text-sm text-gray-600 mb-4 flex-wrap">
          <span>⏱ {test.time_minutes} min</span>
          <span>📝 {test.total_questions} questions</span>
          <span>📊 {test.difficulty}</span>
        </div>
        <div className="bg-brand-light border-l-4 border-brand-accent p-4 rounded-r mb-6 text-left text-sm text-brand-dark max-w-md mx-auto">
          <p className="font-medium mb-2">How to use:</p>
          <ul className="space-y-1">
            <li>• Drag the centre line to resize panels</li>
            <li>• Use <b>A · A · A</b> at top right to change font size</li>
            <li>• <b>Highlight:</b> select text in passage → toolbar appears → click highlighter</li>
          </ul>
        </div>
        {!userId && (
          <p className="text-xs text-gray-500 mb-4">
            💡 <a href="/login" className="text-brand-accent hover:underline">Log in</a> to save your results and track progress.
          </p>
        )}
        <button onClick={startTest} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-md transition">Start test</button>
      </div>
    );
  }

  // RESULTS
  if (view === "results") {
    let correct = 0;
    const review = test.questions.map(q => {
      const u = answers[q.id];
      const has = u !== undefined && u !== "";
      let isCorrect = false;
      if (has) {
        if (q.type === "tfng") isCorrect = u === q.answer;
        else isCorrect = checkGapAnswer(q as GapQuestion, u);
      }
      if (isCorrect) correct++;
      return { q, u, has, isCorrect };
    });
    const rawEquiv = Math.round((correct * 40) / test.total_questions);
    const band = getBandScore(rawEquiv);
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-2">Your score</p>
          <p className="text-5xl font-medium">{correct} / {test.total_questions}</p>
          <p className="text-sm text-gray-500 mt-2">Equivalent on full 40-question test: {rawEquiv} / 40</p>
          <p className="mt-3"><span className="inline-block px-4 py-1 bg-emerald-100 text-emerald-800 rounded-full font-medium text-sm">Estimated Band {band}</span></p>
          {userId && savedAttempt && <p className="text-xs text-gray-500 mt-2">✓ Result saved to your dashboard</p>}
          <div className="mt-4 flex gap-2 justify-center">
            <button onClick={restart} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">Try again</button>
            {userId && <a href="/dashboard" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">My dashboard</a>}
            <a href="/" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">All tests</a>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-medium mb-3">Answer review</h3>
          {review.map(({ q, u, has, isCorrect }) => {
            const cls = !has ? "bg-gray-100" : isCorrect ? "bg-emerald-50" : "bg-red-50";
            return (
              <div key={q.id} className={`${cls} rounded p-3 mb-2 text-sm`}>
                <div className="mb-1"><b>Q{q.id}.</b> {q.type === "tfng" ? q.text : `${q.before} ___ ${q.after}`}</div>
                <div className="text-xs text-gray-600">Your answer: <b>{has ? u : "(no answer)"}</b> · Correct: <b>{q.answer}</b></div>
                <div className="text-xs text-gray-600 italic mt-1">{q.explanation}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // TEST
  return (
    <div className="test-interface max-w-5xl mx-auto">
      <div className="bg-brand text-white px-4 py-2 rounded-t-xl flex justify-between items-center text-sm gap-3">
        <div className="flex gap-4 items-center">
          <span className="font-medium">IELTS Academic Reading</span>
          <span className="opacity-70">Test {test.test_number}</span>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex gap-0.5 bg-white/10 border border-white/25 rounded-md p-0.5">
            {(["s", "m", "l"] as FontSize[]).map(s => (
              <button key={s} onClick={() => setFontSize(s)}
                className={`px-2.5 py-1 rounded transition ${fontSize === s ? "bg-white text-brand font-medium" : "text-white/70 hover:bg-white/15"}`}
                style={{ fontSize: s === "s" ? "11px" : s === "l" ? "15px" : "13px", lineHeight: 1 }}
              >A</button>
            ))}
          </div>
          <span className={`tabular-nums font-medium ${timeLeft <= 60 ? "text-red-200" : ""}`}>⏱ {timeStr}</span>
        </div>
      </div>

      <div ref={splitWrapRef} className="bg-white border border-gray-200 border-t-0 border-b-0 flex overflow-hidden" style={{ height: "560px" }}>
        <div className="flex flex-col h-full border-r border-gray-200 min-w-0" style={{ width: `${leftWidthPct}%` }}>
          <div ref={passageRef} className={`overflow-y-auto p-4 flex-1 ${fontSizeClass}`}>
            <h3 className="text-sm text-gray-500 mb-1">Reading Passage</h3>
            <h2 className="text-lg font-medium mb-3">{test.passage_title}</h2>
            {test.paragraphs.map((p, i) => (
              <p key={i} className="leading-relaxed mb-3"><span className="para-num">{i + 1}.</span>{p}</p>
            ))}
          </div>
        </div>
        <div onMouseDown={handleDividerDown} onTouchStart={handleDividerDown}
             className="w-1.5 cursor-col-resize flex-shrink-0 relative hover:bg-blue-100 transition" title="Drag to resize">
          <div className="absolute top-1/2 left-0.5 w-1 h-8 bg-gray-300 rounded -translate-y-1/2"></div>
        </div>
        <div className="flex-1 flex flex-col h-full min-w-0">
          <div className={`overflow-y-auto p-4 flex-1 ${fontSizeClass}`}>
            {tfngQs.length > 0 && (
              <div className="mb-6">
                <div className="bg-blue-50 border-l-4 border-brand-accent p-3 mb-4 rounded-r">
                  <p className="font-medium">Questions 1 – {tfngQs.length}</p>
                  <p className="text-gray-700 leading-relaxed text-sm mt-1">
                    Do the following statements agree with the information in the passage? Write <b>TRUE</b>, <b>FALSE</b>, or <b>NOT GIVEN</b>.
                  </p>
                </div>
                {tfngQs.map(q => (
                  <div key={q.id} id={`q-${q.id}`} className="mb-5 leading-relaxed">
                    <span className="font-medium mr-2">{q.id}.</span>{q.text}
                    <div className="flex gap-6 mt-2 ml-5">
                      {(["TRUE", "FALSE", "NOT GIVEN"] as const).map(opt => {
                        const isSel = answers[q.id] === opt;
                        return (
                          <span key={opt} onClick={() => selectTfng(q.id, opt)}
                                className={`cursor-pointer inline-flex items-center gap-1.5 select-none ${isSel ? "text-brand-accent" : ""}`}>
                            <span className={`inline-block w-3.5 h-3.5 rounded-full border-[1.5px] relative ${isSel ? "border-brand-accent bg-brand-accent" : "border-gray-500"}`}>
                              {isSel && <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white"></span>}
                            </span>
                            {opt}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {gapQs.length > 0 && (
              <div className="mb-6">
                <div className="bg-blue-50 border-l-4 border-brand-accent p-3 mb-4 rounded-r">
                  <p className="font-medium">Questions {tfngQs.length + 1} – {test.total_questions}</p>
                  <p className="text-gray-700 leading-relaxed text-sm mt-1">
                    Complete the sentences below. Use <b>NO MORE THAN THREE WORDS</b> from the passage for each answer.
                  </p>
                </div>
                {gapQs.map(q => (
                  <div key={q.id} id={`q-${q.id}`} className="mb-5 leading-relaxed">
                    {q.before}{" "}
                    <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 border border-gray-500 bg-white font-medium text-xs mx-1 align-middle">{q.id}</span>
                    <input id={`gap-${q.id}`} type="text" autoComplete="off" value={answers[q.id] || ""}
                      onChange={e => setGap(q.id, e.target.value)}
                      className="border border-gray-500 rounded-sm px-2 py-0.5 min-w-[110px] h-[26px] align-middle focus:border-brand-accent focus:ring-2 focus:ring-brand-light outline-none" />
                    {" "}{q.after}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 border-t-0 rounded-b-xl p-2 flex items-center gap-1.5 flex-wrap">
        <button onClick={clearAllHighlights} className="px-2.5 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100">
          🧹 Clear highlights
        </button>
        <span className="text-xs text-gray-500 ml-2 mr-1">Questions:</span>
        {test.questions.map(q => {
          const answered = answers[q.id] !== undefined && answers[q.id] !== "";
          return (
            <span key={q.id} onClick={() => scrollToQuestion(q.id)}
                  className={`inline-flex items-center justify-center w-6 h-6 border rounded cursor-pointer text-xs ${answered ? "bg-brand-accent text-white border-brand-accent" : "bg-white border-gray-300"}`}>
              {q.id}
            </span>
          );
        })}
        <span className="ml-auto text-xs text-gray-500">{answeredCount} / {test.total_questions}</span>
        <button onClick={handleSubmit} className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium">
          Submit
        </button>
      </div>

      {floatToolbar && (
        <div className="float-toolbar" style={{ left: floatToolbar.x - 20, top: floatToolbar.y - 30 }}>
          <button type="button" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (floatToolbar.markEl) removeHighlight(floatToolbar.markEl);
            else highlightSelection();
          }} title={floatToolbar.markEl ? "Remove highlight" : "Highlight"}>
            <span style={{ fontSize: 16, color: floatToolbar.markEl ? "#444" : "#E0A800" }}>
              {floatToolbar.markEl ? "🧹" : "🖍"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
