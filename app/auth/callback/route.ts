import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("[auth/callback] hit", { 
    hasCode: !!code, 
    origin, 
    url: request.url 
  });

  if (code) {
    const cookieStore = cookies();
    
    // Log what cookies we have
    const allCookies = cookieStore.getAll();
    console.log("[auth/callback] cookies present:", 
      allCookies.map(c => c.name)
    );

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[auth/callback] exchange FAILED:", {
        message: error.message,
        status: error.status,
        name: error.name,
        code: error.code,
      });
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    console.log("[auth/callback] exchange SUCCESS:", { 
      userId: data.user?.id, 
      email: data.user?.email 
    });
    return NextResponse.redirect(`${origin}${next}`);
  }
  
  console.error("[auth/callback] no code parameter");
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
