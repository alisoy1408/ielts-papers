"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Log in to track your progress</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-brand-accent focus:ring-2 focus:ring-brand-light outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-brand-accent focus:ring-2 focus:ring-brand-light outline-none" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">{error}</p>}

          <button type="submit" disabled={loading}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-medium py-2.5 rounded-md transition disabled:opacity-50">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          No account? <Link href="/signup" className="text-brand-accent font-medium hover:underline">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
