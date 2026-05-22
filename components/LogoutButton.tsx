"use client";

import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm">
      Logout
    </button>
  );
}
