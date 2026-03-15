"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code === "GivensSports2026") {
      // In production, you would probably want to verify this against an env var
      // using a server action, but a simple client-side check is fine for a basic family code
      setCookie("family_auth", "true", { maxAge: 60 * 60 * 24 * 30 }); // 30 days
      router.push("/");
      router.refresh(); // Force a refresh so middleware re-evaluates
    } else {
      setError("Incorrect code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-[#4F6F52]/20 p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-[#4F6F52]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🏠</span>
        </div>
        <h1 className="text-2xl font-bold text-[#2C3333] mb-2">Welcome Home</h1>
        <p className="text-[#4F6F52] text-sm mb-8 font-medium">Please enter the family code to access GivensOS.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter Code"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4F6F52] focus:border-transparent text-center font-medium bg-gray-50 placeholder-gray-400 mb-1"
              required
            />
            {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-[#4F6F52] hover:bg-[#3A533D] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            Unlock <span className="text-xl leading-none">🔓</span>
          </button>
        </form>
      </div>
    </div>
  );
}
