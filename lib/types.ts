export type TfngQuestion = {
  id: number;
  type: "tfng";
  text: string;
  answer: "TRUE" | "FALSE" | "NOT GIVEN";
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

export type Question = TfngQuestion | GapQuestion;

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

export function normaliseAnswer(s: string): string {
  return (s || "").toString().trim().toLowerCase().replace(/[.,;:!?'"]/g, "").replace(/\s+/g, " ");
}

export function checkGapAnswer(question: GapQuestion, userAnswer: string): boolean {
  const norm = normaliseAnswer(userAnswer);
  return question.accept.some(a => normaliseAnswer(a) === norm);
}
