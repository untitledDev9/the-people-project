"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getErrorMessage } from "@/lib/api";
import * as admin from "@/services/admin";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true);
    try {
      await admin.login(email.trim(), password);
      router.replace("/sharp");
    } catch (err) {
      setError(getErrorMessage(err, "Could not sign in."));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5 text-paper">
      <form onSubmit={onSubmit} className="w-full max-w-sm animate-rise" noValidate>
        <p className="text-[13px] font-semibold uppercase tracking-[0.22em]">The 5,000 People</p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.34em] text-paper/50">Admin sign in</p>
        <h1 className="display mt-10 text-4xl">Welcome back.</h1>

        <label htmlFor="email" className="label mt-8 !text-paper/60">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field !border-paper/25 !bg-paper/5 !text-paper"
        />
        <label htmlFor="password" className="label mt-5 !text-paper/60">Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field !border-paper/25 !bg-paper/5 !pr-12 !text-paper"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-paper/60 transition hover:text-paper"
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-light mt-8 w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
