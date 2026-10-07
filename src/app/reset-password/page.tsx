"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (active) setReady(!!data.session);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Password updated successfully. You can now login with your new password.");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => router.push("/"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--milk-sage)] px-4 py-16">
      <div className="mx-auto max-w-lg rounded-[28px] border border-[var(--line)] bg-white p-7 shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--warm-gold)]">Humor Luxury</p>
        <h1 className="mt-2 font-display text-3xl text-[var(--deep-wine)]">Reset your password</h1>
        <p className="mt-2 text-sm leading-5 text-[var(--muted)]">
          Create a new password for your customer account.
        </p>

        {!ready ? (
          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--milk-sage)] p-4 text-sm text-[var(--muted)]">
            This reset link is invalid, expired, or has already been used. Please request a new reset link from Login → Forgot password.
          </div>
        ) : (
          <form onSubmit={updatePassword} className="mt-6">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none"
            />
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              type="password"
              autoComplete="new-password"
              className="mt-3 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none"
            />
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            {message && <p className="mt-3 text-xs text-green-700">{message}</p>}
            <button
              type="submit"
              disabled={saving || !!message}
              className="mt-4 w-full rounded-full bg-[var(--deep-wine)] px-5 py-3.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
