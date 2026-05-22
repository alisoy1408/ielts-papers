import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import LogoutButton from "./LogoutButton";

export default async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.is_admin || false;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand">ielts-papers.com</span>
        </Link>
        <nav className="flex gap-1 sm:gap-2 text-sm items-center">
          <Link href="/" className="px-3 py-1.5 hover:bg-gray-100 rounded">Tests</Link>
          <Link href="/about" className="px-3 py-1.5 hover:bg-gray-100 rounded hidden sm:inline">About</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="px-3 py-1.5 hover:bg-gray-100 rounded">Dashboard</Link>
              {isAdmin && (
                <Link href="/admin" className="px-3 py-1.5 text-brand-accent hover:bg-blue-50 rounded font-medium">Admin</Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 hover:bg-gray-100 rounded">Login</Link>
              <Link href="/signup" className="px-3 py-1.5 bg-brand text-white rounded hover:bg-brand-dark">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
