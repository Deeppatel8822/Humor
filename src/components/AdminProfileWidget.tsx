"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Profile { email: string; mobile: string; sessionHours: number; otpLogin: boolean; }

type Panel = "none" | "password" | "forgot";

export default function AdminProfileWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("none");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname !== "/admin") return;
    fetch("/api/admin/profile", { cache: "no-store" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => data && setProfile(data))
      .catch(() => undefined);
  }, [pathname]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) { setOpen(false); setPanel("none"); }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (pathname !== "/admin" || !profile) return null;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
    window.location.reload();
  }

  function openPanel(next: Panel) {
    setPanel(next); setMessage(""); setError(""); setNewPassword(""); setConfirmPassword("");
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    if (newPassword.length < 10) { setError("Password must be at least 10 characters."); setLoading(false); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); setLoading(false); return; }
    const res = await fetch("/api/admin/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not change password."); else { setMessage(data.message || "Password changed successfully."); setNewPassword(""); setConfirmPassword(""); }
    setLoading(false);
  }

  async function forgotPassword(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    const res = await fetch("/api/admin/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: profile.email }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not send reset email."); else setMessage(data.message || "Password reset email sent.");
    setLoading(false);
  }

  return (
    <div ref={ref} className="fixed top-5 right-5 z-[100]">
      <button type="button" onClick={() => { setOpen((value) => !value); setPanel("none"); }} className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-xs font-medium text-[var(--deep-wine)] shadow-sm hover:shadow-md transition" aria-expanded={open}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--deep-wine)] text-white text-[11px]">A</span><span>Admin Profile</span><span className="text-[10px]">⌄</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--deep-wine)] text-white font-semibold">A</span><div><p className="font-medium text-[var(--deep-wine)]">Administrator</p><p className="text-xs text-[var(--muted)]">Profile & Security</p></div></div>
          {panel === "none" ? <>
            <div className="space-y-3 py-4 text-sm">
              <div><p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Registered Email</p><p className="mt-1 text-[var(--ink)] break-all">{profile.email}</p></div>
              <div><p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Registered Mobile</p><p className="mt-1 text-[var(--ink)]">{profile.mobile || "Not configured"}</p></div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--milk-sage)] px-3 py-2.5"><span>OTP Login</span><span className="text-xs font-medium text-green-700">Enabled</span></div>
              <div className="flex items-center justify-between text-xs text-[var(--muted)]"><span>Session duration</span><span>{profile.sessionHours} hours</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-4">
              <button type="button" onClick={() => openPanel("password")} className="rounded-xl border border-[var(--line)] px-3 py-2.5 text-xs font-medium text-[var(--deep-wine)] hover:bg-[var(--milk-sage)]">🔐 Change Password</button>
              <button type="button" onClick={() => openPanel("forgot")} className="rounded-xl border border-[var(--line)] px-3 py-2.5 text-xs font-medium text-[var(--deep-wine)] hover:bg-[var(--milk-sage)]">🔑 Forgot Password</button>
            </div>
            <button type="button" onClick={logout} className="mt-3 w-full rounded-full border border-red-200 bg-white py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">Logout</button>
          </> : <>
            <button type="button" onClick={() => openPanel("none")} className="mt-4 text-xs text-[var(--muted)]">← Back to profile</button>
            {panel === "password" ? <form onSubmit={changePassword} className="mt-4 space-y-3"><h3 className="font-display text-xl text-[var(--deep-wine)]">Change Password</h3><p className="text-xs text-[var(--muted)]">Use at least 10 characters.</p><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={10} required placeholder="New password" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={10} required placeholder="Confirm new password" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />{error && <p className="text-xs text-red-600">{error}</p>}{message && <p className="text-xs text-green-700">{message}</p>}<button disabled={loading} className="w-full rounded-full bg-[var(--deep-wine)] py-3 text-sm font-medium text-white disabled:opacity-50">{loading ? "Saving…" : "Change Password"}</button></form> : <form onSubmit={forgotPassword} className="mt-4 space-y-3"><h3 className="font-display text-xl text-[var(--deep-wine)]">Forgot Password</h3><p className="text-sm text-[var(--muted)]">We will send a secure reset link to your registered admin email.</p><div className="rounded-xl bg-[var(--milk-sage)] px-4 py-3 text-sm break-all">{profile.email}</div>{error && <p className="text-xs text-red-600">{error}</p>}{message && <p className="text-xs text-green-700">{message}</p>}<button disabled={loading} className="w-full rounded-full bg-[var(--deep-wine)] py-3 text-sm font-medium text-white disabled:opacity-50">{loading ? "Sending…" : "Send Reset Email"}</button></form>}
          </>}
        </div>
      )}
    </div>
  );
}
