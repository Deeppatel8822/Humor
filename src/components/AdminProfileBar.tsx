"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Profile {
  email: string;
  mobile: string;
  sessionHours: number;
  otpLogin: boolean;
}

export default function AdminProfileBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (pathname !== "/admin") return;
    fetch("/api/admin/profile", { cache: "no-store" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, [pathname]);

  if (pathname !== "/admin" || !profile) return null;

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
    window.location.href = "/admin";
  }

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--deep-wine)] shadow-sm"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--deep-wine)] text-xs text-white">A</span>
        <span className="hidden sm:inline">Admin Profile</span>
        <span className="text-xs">⌄</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xl">
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--warm-gold)]">Administrator</p>
            <h2 className="mt-1 font-display text-xl text-[var(--deep-wine)]">Profile & Security</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-[var(--milk-sage)] p-3">
              <p className="text-[11px] text-[var(--muted)]">Registered Email</p>
              <p className="mt-1 break-all font-medium text-[var(--ink)]">{profile.email}</p>
            </div>
            <div className="rounded-xl bg-[var(--milk-sage)] p-3">
              <p className="text-[11px] text-[var(--muted)]">Registered Mobile</p>
              <p className="mt-1 font-medium text-[var(--ink)]">{profile.mobile}</p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-3">
              <span>Login security</span>
              <span className="text-xs font-medium text-green-700">OTP Enabled</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-3">
              <span>Session duration</span>
              <span className="text-xs font-medium">{profile.sessionHours} hours</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="mt-5 w-full rounded-full bg-[var(--deep-wine)] py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
