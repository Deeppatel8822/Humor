import Link from "next/link";

export default function YourBusinessPage() {
  return (
    <main className="min-h-[70vh] bg-[var(--paper)]">
      <section className="border-b border-[var(--line)] bg-[var(--velvet-gradient-soft)]">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--warm-gold)]">Humor Salon Referral Programme</p>
            <h1 className="font-display text-4xl leading-tight text-[var(--ink)] md:text-6xl">Your Business. Your Audience. Your Opportunity.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              A dedicated programme for influencers, salon and parlour owners, beauty professionals, and home-based beauty businesses.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/your-business/register" className="rounded-full bg-[var(--deep-wine)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--wine-soft)]">Get started for ₹9 →</Link>
              <span className="rounded-full border border-[var(--line)] bg-white/70 px-5 py-2.5 text-sm font-medium text-[var(--wine-soft)]">No hidden charges</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["01", "Create your account", "Join the programme and set up your business profile."],
            ["02", "Share & recommend", "Share Humor products with your audience and customers."],
            ["03", "Grow with Humor", "Build your referral business and unlock programme benefits."],
          ].map(([number, title, text]) => (
            <div key={number} className="rounded-3xl border border-[var(--line)] bg-white p-7 shadow-[0_10px_35px_rgba(111,74,154,0.06)]">
              <div className="mb-5 text-xs font-semibold tracking-[0.18em] text-[var(--warm-gold)]">{number}</div>
              <h2 className="font-display text-2xl text-[var(--deep-wine)]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-[var(--line)] bg-[var(--milk-sage)] p-7 md:p-10">
          <h2 className="font-display text-3xl text-[var(--deep-wine)]">Programme details coming together</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Registration, referral links, rewards, programme terms, payment details and your business dashboard can be added here as the programme is finalized.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-full border border-[var(--deep-wine)] px-6 py-3 text-sm font-medium text-[var(--deep-wine)] hover:bg-white">
            Back to Humor Luxury
          </Link>
        </div>
      </section>
    </main>
  );
}
