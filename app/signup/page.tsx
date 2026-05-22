"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <p className="text-emerald-800 font-medium">✓ Account created! Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-2">Create your free account</h1>
        <p className="text-sm text-gray-500 mb-6">Save your results and track your IELTS progress</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-brand-accent focus:ring-2 focus:ring-brand-light outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-brand-accent focus:ring-2 focus:ring-brand-light outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-brand-accent focus:ring-2 focus:ring-brand-light outline-none" />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">{error}</p>}

          <button type="submit" disabled={loading}
                  className="w-full bg-brand hover:bg-brand-dark text-white font-medium py-2.5 rounded-md transition disabled:opacity-50">
            {loading ? "Creating account..." : "Create free account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Have an account? <Link href="/login" className="text-brand-accent font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
