"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Profile {
  email: string;
  mobile: string;
  sessionHours: number;
  otpLogin: boolean;
}

export default function AdminProfileWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (pathname !== "/admin" || !profile) return null;

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
    window.location.reload();
  }

  return (
    <div ref={ref} className="fixed top-5 right-5 z-[100]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-xs font-medium text-[var(--deep-wine)] shadow-sm hover:shadow-md transition"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--deep-wine)] text-white text-[11px]">A</span>
        <span>Admin Profile</span>
        <span className="text-[10px]">⌄</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--deep-wine)] text-white font-semibold">A</span>
            <div>
              <p className="font-medium text-[var(--deep-wine)]">Administrator</p>
              <p className="text-xs text-[var(--muted)]">Humor Luxury Admin</p>
            </div>
          </div>
          <div className="space-y-3 py-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Registered Email</p>
              <p className="mt-1 text-[var(--ink)] break-all">{profile.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Registered Mobile</p>
              <p className="mt-1 text-[var(--ink)]">{profile.mobile || "Not configured"}</p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[var(--milk-sage)] px-3 py-2.5">
              <span>OTP Login</span>
              <span className="text-xs font-medium text-green-700">Enabled</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Session duration</span>
              <span>{profile.sessionHours} hours</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="w-full rounded-full border border-red-200 bg-white py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
