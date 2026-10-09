"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Partner = {
  status: "pending" | "approved" | "rejected";
  code?: string;
  expiresAt?: string;
  usageCount?: number;
  usageLimit?: number;
  walletBalance?: number;
  totalRewards?: number;
  totalSales?: number;
  referredCustomers?: number;
};

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({ email: "", fullName: "", mobile: "", address: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [orderStatus, setOrderStatus] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { getSupabase } = await import("@/lib/supabase");
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }
      setLoggedIn(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (user) {
        setProfile({
          email: user.email || "",
          fullName: String(user.user_metadata?.full_name || user.user_metadata?.name || ""),
          mobile: String(user.user_metadata?.phone || user.phone || ""),
          address: String(user.user_metadata?.address || ""),
        });
      }
      const response = await fetch("/api/marketing-partner/application", {
        headers: { Authorization: "Bearer " + data.session.access_token },
        cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        setPartner(result.partner);
        setApplication(result.application);
      } else {
        setError(result.error || "Could not load account.");
      }
    } catch {
      setError("Could not load your account.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <main className="max-w-5xl mx-auto px-5 md:px-8 py-20"><p className="text-sm text-[var(--muted)]">Loading your account…</p></main>;

  if (!loggedIn) {
    return (
      <main className="max-w-xl mx-auto px-5 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)]">Humor Luxury</p>
        <h1 className="font-display text-4xl text-[var(--deep-wine)] mt-3">My Account</h1>
        <p className="text-sm text-[var(--muted)] mt-3">Login to view your orders, profile and Marketing Partner rewards.</p>
        <button onClick={() => window.dispatchEvent(new CustomEvent("humor-open-customer-auth"))} className="mt-7 rounded-full bg-[var(--deep-wine)] text-white px-7 py-3.5 text-sm font-medium">Login / Create Account</button>
      </main>
    );
  }

  return (
    <main className="bg-[var(--milk-sage)] min-h-[70vh] px-5 md:px-8 py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)]">Humor Luxury</p>
        <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mt-2">My Account</h1>

        <button
          type="button"
          onClick={async () => {
            const { getSupabase } = await import("@/lib/supabase");
            await getSupabase().auth.signOut();
            window.location.href = "/";
          }}
          className="mt-5 rounded-full border border-[var(--deep-wine)] px-6 py-2.5 text-sm font-medium text-[var(--deep-wine)] hover:bg-[var(--deep-wine)] hover:text-white transition"
        >
          Logout
        </button>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <button type="button" onClick={() => setShowOrderTracking((open) => !open)} className="text-left rounded-2xl bg-white border border-[var(--line)] p-5 hover:border-[var(--deep-wine)]">
            <p className="text-xs text-[var(--muted)]">Orders</p><p className="mt-2 font-medium text-[var(--ink)]">{showOrderTracking ? "Hide order tracking ↑" : "Track your orders ↓"}</p>
          </button>
          <Link href="#profile-settings" className="rounded-2xl bg-white border border-[var(--line)] p-5 hover:border-[var(--deep-wine)]">
            <p className="text-xs text-[var(--muted)]">Profile</p><p className="mt-2 font-medium text-[var(--ink)]">View or edit your details →</p>
          </Link>
          <Link href="/marketing-partner" className="rounded-2xl bg-white border border-[var(--line)] p-5 hover:border-[var(--deep-wine)]">
            <p className="text-xs text-[var(--muted)]">Partner</p><p className="mt-2 font-medium text-[var(--ink)]">{partner?.status === "approved" ? "Marketing Partner dashboard →" : "Become a Marketing Partner →"}</p>
          </Link>
        </div>

        {showOrderTracking && (
          <section id="order-tracking" className="mt-8 rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8 scroll-mt-28">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)]">Orders</p>
            <h2 className="font-display text-2xl text-[var(--deep-wine)] mt-2">Track your order</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Enter your order number and the email used at checkout.</p>
            <form onSubmit={(event) => {
              event.preventDefault();
              setOrderStatus("Order tracking will be live once the order database is connected. In the meantime, check the email confirmation sent after your order.");
            }} className="mt-5 grid gap-4 md:grid-cols-2">
              <input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Order number (e.g. HL-10234)" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" />
              <input required type="email" value={orderEmail} onChange={(event) => setOrderEmail(event.target.value)} placeholder="Email used at checkout" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" />
              <button type="submit" className="md:col-span-2 rounded-full bg-[var(--deep-wine)] px-6 py-3.5 text-sm font-medium text-white hover:bg-[var(--ink)] transition-colors">Track order</button>
            </form>
            {orderStatus && <p className="mt-5 rounded-xl bg-[var(--milk-sage)] border border-[var(--line)] px-5 py-4 text-sm text-[var(--muted)]">{orderStatus}</p>}
          </section>
        )}

        <section id="profile-settings" className="mt-8 grid gap-5 lg:grid-cols-2 scroll-mt-28">
          <form onSubmit={async (event) => {
            event.preventDefault();
            setProfileSaving(true); setProfileMessage(""); setError("");
            try {
              const { getSupabase } = await import("@/lib/supabase");
              const supabase = getSupabase();
              const { data: current } = await supabase.auth.getUser();
              const { error: updateError } = await supabase.auth.updateUser({
                data: {
                  ...(current.user?.user_metadata || {}),
                  full_name: profile.fullName.trim(),
                  phone: profile.mobile.trim(),
                  address: profile.address.trim(),
                },
              });
              if (updateError) throw updateError;
              setProfileMessage("Your profile details have been saved.");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save profile details.");
            } finally { setProfileSaving(false); }
          }} className="rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)]">Personal details</p>
            <h2 className="font-display text-2xl text-[var(--deep-wine)] mt-2">Your Profile</h2>
            <div className="mt-6 space-y-4">
              <div><label className="text-xs font-medium text-[var(--ink)]">Email address</label><input value={profile.email} readOnly className="mt-2 w-full rounded-xl border border-[var(--line)] bg-gray-50 px-4 py-3 text-sm text-[var(--muted)]" /><p className="mt-1 text-[11px] text-[var(--muted)]">Your login email is shown here. Email changes require a separate verification flow.</p></div>
              <div><label className="text-xs font-medium text-[var(--ink)]">Full name</label><input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="Enter your full name" /></div>
              <div><label className="text-xs font-medium text-[var(--ink)]">Mobile number</label><input value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="+91..." /></div>
              <div><label className="text-xs font-medium text-[var(--ink)]">Delivery address</label><textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="mt-2 min-h-28 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="House/flat, street, area, city, state, PIN code" /></div>
              {profileMessage && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{profileMessage}</p>}
              <button disabled={profileSaving} className="w-full rounded-full bg-[var(--deep-wine)] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50">{profileSaving ? "Saving…" : "Save Profile Details"}</button>
            </div>
          </form>

          <form onSubmit={async (event) => {
            event.preventDefault(); setPasswordError(""); setPasswordMessage("");
            if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters."); return; }
            if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
            setPasswordSaving(true);
            try {
              const { getSupabase } = await import("@/lib/supabase");
              const { error: updateError } = await getSupabase().auth.updateUser({ password: newPassword });
              if (updateError) throw updateError;
              setNewPassword(""); setConfirmPassword("");
              setPasswordMessage("Password changed successfully.");
            } catch (err) {
              setPasswordError(err instanceof Error ? err.message : "Could not change password.");
            } finally { setPasswordSaving(false); }
          }} className="rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)]">Security</p>
            <h2 className="font-display text-2xl text-[var(--deep-wine)] mt-2">Change Password</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Choose a strong password with at least 8 characters.</p>
            <div className="mt-6 space-y-4">
              <div><label className="text-xs font-medium text-[var(--ink)]">New password</label><input type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="Enter new password" /></div>
              <div><label className="text-xs font-medium text-[var(--ink)]">Confirm new password</label><input type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="Re-enter new password" /></div>
              {passwordError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{passwordError}</p>}
              {passwordMessage && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{passwordMessage}</p>}
              <button disabled={passwordSaving} className="w-full rounded-full border border-[var(--deep-wine)] px-5 py-3.5 text-sm font-semibold text-[var(--deep-wine)] disabled:opacity-50">{passwordSaving ? "Updating…" : "Change Password"}</button>
            </div>
          </form>
        </section>

        {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {partner?.status === "approved" ? (
          <section className="mt-8 rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div>
                <span className="inline-flex rounded-full bg-[var(--milk-sage)] px-3 py-1 text-xs font-semibold text-[var(--deep-wine)]">✓ You are a Marketing Partner</span>
                <h2 className="font-display text-2xl text-[var(--deep-wine)] mt-4">Your Partner Wallet</h2>
                <p className="text-sm text-[var(--muted)] mt-1">Share your code, give customers a discount and earn 10% reward on eligible billed product value.</p>
              </div>
              <Link href="/marketing-partner" className="rounded-full border border-[var(--line)] px-5 py-2.5 text-xs font-medium">View dashboard</Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
              <div className="rounded-2xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Wallet balance</p><p className="text-2xl font-semibold text-[var(--deep-wine)] mt-2">₹{Number(partner.walletBalance || 0).toLocaleString("en-IN")}</p></div>
              <div className="rounded-2xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Customers referred</p><p className="text-2xl font-semibold text-[var(--deep-wine)] mt-2">{partner.referredCustomers || 0}</p></div>
              <div className="rounded-2xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Total rewards</p><p className="text-2xl font-semibold text-[var(--deep-wine)] mt-2">₹{Number(partner.totalRewards || 0).toLocaleString("en-IN")}</p></div>
              <div className="rounded-2xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Referral sales</p><p className="text-2xl font-semibold text-[var(--deep-wine)] mt-2">₹{Number(partner.totalSales || 0).toLocaleString("en-IN")}</p></div>
            </div>
          </section>
        ) : partner?.status === "pending" || application?.status === "pending" ? (
          <section className="mt-8 rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8">
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Application under review</span>
            <h2 className="font-display text-2xl text-[var(--deep-wine)] mt-4">Marketing Partner</h2>
            <p className="text-sm text-[var(--muted)] mt-2">Your registration has been submitted. Our team will verify your business details before activating your partner code.</p>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)]">Earn while you share</p>
            <h2 className="font-display text-2xl md:text-3xl text-[var(--deep-wine)] mt-2">Become a Marketing Partner</h2>
            <p className="text-sm leading-6 text-[var(--muted)] mt-2 max-w-2xl">Register your business, get a unique referral code and earn a flat 10% reward on eligible purchases made using your code. Customers also receive their partner discount.</p>
            <Link href="/marketing-partner" className="inline-flex mt-6 rounded-full bg-[var(--deep-wine)] text-white px-6 py-3.5 text-sm font-medium">Register as Marketing Partner</Link>
          </section>
        )}
      </div>
    </main>
  );
}
