import Link from "next/link";

export default function YourBusinessPage() {
  return (
    <main className="min-h-[70vh] overflow-hidden bg-[var(--ink)] text-[var(--milk-sage)]">
      <section className="relative overflow-hidden border-b border-white/10 bg-[var(--ink)]">
        <div className="relative mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D49A6A] bg-[#D49A6A] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#30233B] shadow-[0_6px_22px_rgba(212,154,106,0.22)]"><span className="h-2 w-2 rounded-full bg-[#30233B]" aria-hidden="true" /> Humor Business Programme</p>
            <h1 className="font-display text-4xl leading-[1.08] text-white md:text-6xl">Your Business.<br /><span className="text-[var(--warm-gold)]">Your Audience.</span><br />Your Opportunity.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
              A dedicated programme for influencers, salon and parlour owners, beauty professionals, and home-based beauty businesses.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/your-business/register" className="group inline-flex items-center gap-2 rounded-full border border-[var(--warm-gold)]/70 bg-[var(--warm-gold)] px-6 py-3 text-sm font-bold text-[var(--ink)] shadow-[0_10px_30px_rgba(212,154,106,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#e2ad7d]">Get started for <span className="text-xl font-extrabold">₹9</span> <span className="transition-transform group-hover:translate-x-1">→</span></Link>
              <span className="rounded-full border border-white/20 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/80">No hidden charges</span>
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
            <div key={number} className="rounded-3xl border border-white/10 bg-white/[0.045] p-7 shadow-[0_10px_35px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--warm-gold)]/45 hover:bg-white/[0.07]">
              <div className="mb-5 text-xs font-semibold tracking-[0.18em] text-[var(--warm-gold)]">{number}</div>
              <h2 className="font-display text-2xl text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">{text}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-10 overflow-hidden rounded-3xl border border-[var(--warm-gold)]/30 bg-[var(--deep-wine)] p-7 md:p-10">
          <h2 className="font-display text-3xl text-white">Grow your beauty business with Humor.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
            Registration, referral links, rewards, programme terms, payment details and your business dashboard can be added here as the programme is finalized.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-full border border-[var(--warm-gold)]/70 px-6 py-3 text-sm font-semibold text-[var(--warm-gold)] transition-colors hover:bg-[var(--warm-gold)] hover:text-[var(--ink)]">
            Back to Humor Luxury
          </Link>
        </div>
      </section>
    </main>
  );
}
