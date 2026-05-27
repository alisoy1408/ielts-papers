import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Auth error: " + authError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Not logged in (no user in session)" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Received body:", JSON.stringify(body));

    const { test_id, test_slug, answers, raw_score, total_questions, band_score, time_spent_seconds } = body;

    if (!test_id || !test_slug || raw_score === undefined || !total_questions) {
      return NextResponse.json({
        error: "Missing required fields",
        received: { test_id, test_slug, raw_score, total_questions }
      }, { status: 400 });
    }

    const insertData = {
      user_id: user.id,
      test_id,
      test_slug,
      answers,
      raw_score,
      total_questions,
      band_score,
      time_spent_seconds,
    };

    console.log("Inserting:", JSON.stringify(insertData));

    const { data, error } = await supabase
      .from("attempts")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("DB insert error:", error);
      return NextResponse.json({
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ attempt: data });

  } catch (err: any) {
    console.error("Unexpected error in POST /api/attempts:", err);
    return NextResponse.json({
      error: "Unexpected error: " + (err?.message || String(err)),
      stack: err?.stack
    }, { status: 500 });
  }
}
