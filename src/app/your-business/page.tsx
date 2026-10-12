import Link from "next/link";

const steps = [
  ["01", "Apply for ₹9", "Create or sign in to your Humor account, choose your business type and submit your details with proof."],
  ["02", "Get verified", "Our team reviews your documents. Your application remains pending until verification is complete."],
  ["03", "Get your ID & code", "After approval, you receive a unique partner User ID and coupon code to share with customers."],
  ["04", "Help customers save", "Customers use your code at checkout to receive a 10% discount on eligible product value."],
  ["05", "Earn coins", "Eligible paid orders earn coins in your account. Your dashboard shows order details, rewards and balance."],
  ["06", "Request withdrawal", "When your available balance reaches ₹1,000, submit a withdrawal request. Approved payouts are normally processed in 5–7 business days."],
];

const faqs = [
  ["Who can join?", "Influencers/content creators, beauty parlour or salon owners, and beauty shop/retail owners can apply. Approval is subject to document verification."],
  ["How much does registration cost?", "The registration fee is ₹9. Payment alone does not guarantee approval. The proposed fee is non-refundable except where applicable law or payment-provider rules require otherwise."],
  ["How do coins work?", "The base rate is 25% of the actual eligible product amount paid after applicable product discounts, excluding shipping. 1 coin represents ₹1 reward value."],
  ["How do I unlock a higher rate?", "Basic reward rate is 25%. Tier qualification is based on eligible coins earned within one rolling 30-day qualification period: 3,000 coins unlocks 27%, and 5,000 coins unlocks 30%. 1,000 coins is a reference milestone and does not increase the rate. If you do not reach the next target within the 30-day period, you stay at your current tier. Once upgraded, your tier never drops. The 30-day counter is used only to qualify for upgrades; lifetime earned coins and available balance are tracked separately. The upgraded rate applies only to future eligible orders."],
  ["Does my coupon expire?", "There is no fixed expiry date while your partner account remains approved and your code is active. Humor Luxury may suspend a code for fraud, misuse, policy or legal reasons."],
  ["When can I withdraw?", "You can request withdrawal when your available balance is at least ₹1,000. After verification and approval, processing normally takes 5–7 business days. Bank settlement may take additional time."],
  ["What happens if an order is refunded?", "Rewards linked to cancelled, refunded, returned, charged-back or otherwise ineligible orders may be reversed. Your transaction history should show the adjustment."],
  ["Are earnings guaranteed?", "No. Rewards depend on eligible, verified customer orders. Results vary, and the programme does not guarantee a particular income."],
];

export default function YourBusinessPage() {
  return (
    <main className="overflow-hidden bg-[var(--ink)] text-[var(--milk-sage)]">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(212,154,106,0.20),transparent_35%),radial-gradient(circle_at_10%_80%,rgba(124,90,166,0.22),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D49A6A]/70 bg-[#D49A6A]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--warm-gold)]">Humor Luxury Partner Programme</p>
          <h1 className="max-w-4xl font-display text-4xl leading-[1.08] text-white md:text-7xl">Your Business.<br/><span className="text-[var(--warm-gold)]">Your Audience.</span><br/>Your Opportunity.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 md:text-lg">A referral programme for influencers, beauty parlour owners and beauty shop owners. Share products you love, help customers save, and earn rewards on eligible orders.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/your-business/register" className="inline-flex items-center gap-2 rounded-full bg-[var(--warm-gold)] px-7 py-3.5 text-sm font-bold text-[var(--ink)] transition hover:-translate-y-0.5">Apply for ₹9 <span>→</span></Link>
            <a href="/start-your-business-terms.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10">Read full programme terms ↗</a>
          </div>
          <p className="mt-4 text-xs text-white/50">Application is subject to document verification and programme approval. Rewards are not guaranteed income.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["₹9", "Registration fee"],["10%", "Customer coupon discount"],["25% → 30%", "Reward rate by tier"],["₹1,000", "Minimum withdrawal"]].map(([value,label]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
              <p className="font-display text-3xl text-[var(--warm-gold)]">{value}</p>
              <p className="mt-2 text-sm text-white/65">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8 md:pb-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--warm-gold)]">How it works</p>
          <h2 className="mt-3 font-display text-3xl text-white md:text-4xl">Six simple steps to get started</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">The process is designed to keep verification, orders and reward tracking clear.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map(([number,title,description]) => (
            <article key={number} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-[var(--warm-gold)]/50">
              <p className="text-xs font-bold tracking-[0.2em] text-[var(--warm-gold)]">{number}</p>
              <h3 className="mt-4 font-display text-2xl text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/65">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f8f3f7] text-[var(--ink)]">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a6a9f]">Transparent rewards</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">Your coins, explained clearly.</h2>
            <p className="mt-3 text-sm leading-6 text-black/60">Coins are calculated on eligible product value actually paid after applicable product discounts. Shipping is excluded. Tier qualification uses coins earned within one 30-day period only. Once upgraded, a tier never drops. Lifetime coins and available balance are tracked separately. Refunds and cancellations can reverse related rewards.</p>
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#e7dce7] bg-white">
            <div className="grid grid-cols-3 bg-[#3e1730] px-5 py-4 text-xs font-bold uppercase tracking-wide text-white"><span>Coins earned in 30 days</span><span>Rate</span><span>Tier rule</span></div>
            {[
              ["Basic: below 1,000","25%","Current tier stays active"],
              ["1,000 coins","25%","Basic tier"],
              ["3,000 coins","27%","Permanent upgrade"],
              ["5,000 coins","30%","Permanent upgrade; highest tier"],
            ].map(([coins,rate,when]) => <div key={coins} className="grid grid-cols-3 gap-2 border-t border-[#eee5ee] px-5 py-4 text-sm"><span>{coins}</span><strong className="text-[#6f4a9a]">{rate}</strong><span className="text-black/60">{when}</span></div>)}
          </div>
          <p className="mt-3 text-xs leading-5 text-black/50">1 coin = ₹1 reward value. In a 30-day qualification period, 1,000 coins corresponds to the Basic 25% tier, 3,000 unlocks 27%, and 5,000 unlocks 30%. If the next target is missed, the partner stays at their current tier. Once upgraded, the tier never drops. The 30-day counter qualifies upgrades only; lifetime earned coins and available balance are separate. Higher rates apply to future eligible orders only. Withdrawal starts at ₹1,000 available balance.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--warm-gold)]">Questions & answers</p>
        <h2 className="mt-3 font-display text-3xl text-white md:text-4xl">Know the rules before you join.</h2>
        <div className="mt-7 space-y-3">
          {faqs.map(([question,answer]) => <details key={question} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 open:border-[var(--warm-gold)]/50">
            <summary className="cursor-pointer list-none font-semibold text-white marker:hidden">{question}<span className="float-right text-[var(--warm-gold)]">+</span></summary>
            <p className="mt-3 text-sm leading-6 text-white/65">{answer}</p>
          </details>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8 md:pb-24">
        <div className="rounded-[2rem] border border-[var(--warm-gold)]/30 bg-[var(--deep-wine)] p-8 md:p-12">
          <h2 className="font-display text-3xl text-white md:text-4xl">Ready to grow with Humor?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Read the full programme terms, understand the rewards and withdrawal process, then submit your application for verification.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/your-business/register" className="rounded-full bg-[var(--warm-gold)] px-6 py-3 text-sm font-bold text-[var(--ink)]">Start registration for ₹9</Link>
            <a href="/start-your-business-terms.html" target="_blank" rel="noreferrer" className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white">Full terms &amp; conditions</a>
          </div>
        </div>
        <p className="mt-6 text-xs leading-5 text-white/40">Programme participation is subject to verification, applicable law and the full terms. Rewards depend on eligible verified orders and are not guaranteed income. The registration fee is proposed as non-refundable except where applicable law or payment-provider rules require otherwise.</p>
      </section>
    </main>
  );
}
