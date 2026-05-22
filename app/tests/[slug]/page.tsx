import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import TestInterface from "@/components/TestInterface";
import type { ReadingTest } from "@/lib/types";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: test } = await supabase
    .from("tests")
    .select("title, passage_title, test_number, total_questions, time_minutes")
    .eq("slug", params.slug)
    .single();

  if (!test) return { title: "Test not found" };

  return {
    title: `${test.passage_title} — IELTS Reading Test ${test.test_number}`,
    description: `Free IELTS Academic Reading practice test: ${test.passage_title}. ${test.total_questions} questions, ${test.time_minutes} minutes, real exam format.`,
  };
}

export default async function TestPage({ params }: Props) {
  const supabase = createClient();

  const { data: test, error } = await supabase
    .from("tests")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (error || !test) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="px-4 py-6">
      <TestInterface test={test as ReadingTest} userId={user?.id || null} />
    </div>
  );
}
