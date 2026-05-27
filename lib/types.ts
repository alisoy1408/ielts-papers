// ============ QUESTION TYPES ============

export type TfngQuestion = {
  id: number;
  type: "tfng";
  text: string;
  answer: "TRUE" | "FALSE" | "NOT GIVEN";
  explanation: string;
};

export type YnngQuestion = {
  id: number;
  type: "ynng";
  text: string;
  answer: "YES" | "NO" | "NOT GIVEN";
  explanation: string;
};

export type GapQuestion = {
  id: number;
  type: "gap";
  before: string;
  after: string;
  answer: string;
  accept: string[];
  explanation: string;
};

export type McqQuestion = {
  id: number;
  type: "mcq";
  text: string;
  options: string[];           // ["option A text","option B text",...]
  answer: string;              // "A" | "B" | "C" | "D"
  explanation: string;
};

export type MatchParaQuestion = {
  id: number;
  type: "match_para";
  text: string;
  options?: string[];          // optional list of paragraph letters available
  answer: string;              // "A" | "B" | ...
  explanation: string;
};

export type MatchListQuestion = {
  id: number;
  type: "match_list";
  text: string;
  list: { label: string; text: string }[];
  answer: string;              // "A" | "B" | ...
  explanation: string;
};

export type Question =
  | TfngQuestion
  | YnngQuestion
  | GapQuestion
  | McqQuestion
  | MatchParaQuestion
  | MatchListQuestion;

// ============ TEST ============

export type ReadingTest = {
  id: string;
  slug: string;
  title: string;
  test_number: number;
  test_type: string;
  difficulty: string;
  time_minutes: number;
  total_questions: number;
  passage_title: string;
  paragraphs: string[];
  questions: Question[];
  is_published: boolean;
  is_premium: boolean;
};

// ============ BAND SCORE ============

export function getBandScore(rawScore: number): string {
  if (rawScore >= 39) return "9.0";
  if (rawScore >= 37) return "8.5";
  if (rawScore >= 35) return "8.0";
  if (rawScore >= 33) return "7.5";
  if (rawScore >= 30) return "7.0";
  if (rawScore >= 27) return "6.5";
  if (rawScore >= 23) return "6.0";
  if (rawScore >= 19) return "5.5";
  if (rawScore >= 15) return "5.0";
  if (rawScore >= 13) return "4.5";
  if (rawScore >= 10) return "4.0";
  if (rawScore >= 8) return "3.5";
  if (rawScore >= 6) return "3.0";
  return "2.5 or below";
}

// ============ ANSWER CHECKING ============

export function normaliseAnswer(s: string): string {
  return (s || "").toString().trim().toLowerCase().replace(/[.,;:!?'"]/g, "").replace(/\s+/g, " ");
}

export function checkGapAnswer(question: GapQuestion, userAnswer: string): boolean {
  const norm = normaliseAnswer(userAnswer);
  return question.accept.some(a => normaliseAnswer(a) === norm);
}

// Universal checker that handles all question types
export function checkAnswer(question: Question, userAnswer: string): boolean {
  const norm = normaliseAnswer(userAnswer);
  switch (question.type) {
    case "tfng":
    case "ynng":
    case "mcq":
    case "match_para":
    case "match_list":
      return normaliseAnswer(question.answer) === norm;
    case "gap":
      return question.accept.some(a => normaliseAnswer(a) === norm);
    default:
      return false;
  }
}
