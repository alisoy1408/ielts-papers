import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await request.json();
  const { test_id, test_slug, answers, raw_score, total_questions, band_score, time_spent_seconds } = body;

  if (!test_id || !test_slug || raw_score === undefined || !total_questions) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("attempts")
    .insert({
      user_id: user.id,
      test_id,
      test_slug,
      answers,
      raw_score,
      total_questions,
      band_score,
      time_spent_seconds,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attempt: data });
}
