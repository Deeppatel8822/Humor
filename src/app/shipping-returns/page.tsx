import Link from "next/link";

export const metadata = {
  title: "Shipping & Returns | Humor Luxury",
  description: "Everything you need to know about shipping, delivery, returns and refunds at Humor Luxury.",
};

const shippingPoints = [
  "Free shipping on all orders across India.",
  "Orders are dispatched within 1–2 business days of confirmation.",
  "Delivery typically takes 3–5 business days, depending on location.",
  "You’ll receive a tracking link by email and SMS once your order ships.",
];

const returnPoints = [
  "Unopened products can be returned within 7 days of delivery for a full refund.",
  "If a product arrives damaged or incorrect, contact us within 48 hours with photos and we’ll replace it at no cost.",
  "Refunds are processed to the original payment method within 5–7 business days after the returned product is received.",
  "Cash-on-delivery order refunds are issued via bank transfer or store credit.",
];

function CheckIcon() {
  return <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--deep-wine)] text-white"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="m2.2 6.2 2.2 2.1 5.3-4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;
}

function TruckIcon() {
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none"><path d="M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="7" cy="18" r="1.8" stroke="currentColor" strokeWidth="1.5" /><circle cx="18" cy="18" r="1.8" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function ReturnIcon() {
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none"><path d="M9 7H5l3-3M5 7a7 7 0 1 1 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function ShippingReturnsPage() {
  return (
    <main>
      <section className="border-b border-[var(--line)] bg-[var(--milk-sage)]/45">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-5"><Link href="/" className="hover:text-[var(--deep-wine)]">Home</Link><span>›</span><span className="text-[var(--deep-wine)]">Shipping & Returns</span></div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-4">Customer Care</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.08] text-[var(--deep-wine)]">Shipping & Returns</h1>
            <p className="mt-5 text-base md:text-lg text-[var(--muted)] max-w-2xl leading-7">Hassle-free shopping, because your trust matters. Here’s everything you need to know about getting your Humor Luxury order and returning it if needed.</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <article className="rounded-3xl border border-[var(--line)] bg-white p-7 md:p-9 shadow-sm">
            <div className="flex items-start gap-4 mb-7"><div className="h-12 w-12 rounded-2xl bg-[var(--dusty-rose)]/25 text-[var(--deep-wine)] flex items-center justify-center"><TruckIcon /></div><div><h2 className="font-display text-2xl md:text-3xl text-[var(--deep-wine)]">Shipping</h2><p className="text-sm text-[var(--muted)] mt-1">Fast, reliable and free across India.</p></div></div>
            <ul className="space-y-4">{shippingPoints.map((point) => <li key={point} className="flex gap-3 text-sm leading-6 text-[var(--ink)]/75"><CheckIcon /><span>{point}</span></li>)}</ul>
          </article>

          <article className="rounded-3xl border border-[var(--line)] bg-white p-7 md:p-9 shadow-sm">
            <div className="flex items-start gap-4 mb-7"><div className="h-12 w-12 rounded-2xl bg-[var(--warm-gold)]/15 text-[var(--deep-wine)] flex items-center justify-center"><ReturnIcon /></div><div><h2 className="font-display text-2xl md:text-3xl text-[var(--deep-wine)]">Returns</h2><p className="text-sm text-[var(--muted)] mt-1">Simple and customer-friendly.</p></div></div>
            <ul className="space-y-4">{returnPoints.map((point) => <li key={point} className="flex gap-3 text-sm leading-6 text-[var(--ink)]/75"><CheckIcon /><span>{point}</span></li>)}</ul>
          </article>
        </div>

        <div className="mt-12 border-t border-[var(--line)] pt-12 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-3">Need more help?</p>
          <h2 className="font-display text-2xl md:text-3xl text-[var(--deep-wine)]">We’re here for you.</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">Have a question about your order, delivery or return? Get in touch with our support team.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/contact" className="inline-flex rounded-full bg-[var(--deep-wine)] px-7 py-3.5 text-sm font-medium text-white hover:bg-[var(--ink)] transition-colors">Contact Us →</Link><a href="https://wa.me/919586233163?text=Hi%20Humor%20Luxury!%20I%20need%20help%20with%20my%20order." target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-[var(--deep-wine)] px-7 py-3.5 text-sm font-medium text-[var(--deep-wine)] hover:bg-[var(--milk-sage)] transition-colors">WhatsApp Support</a></div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--milk-sage)]/50"><div className="max-w-7xl mx-auto px-5 md:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">{[["Free Shipping","On every order"],["Secure Payments","Safe & protected"],["Dermatologist Tested","Made for everyday care"],["Made in India","With care & quality"]].map(([title,text],index)=><div key={title} className={`text-center px-4 ${index>0?"md:border-l md:border-[var(--line)]":""}`}><p className="font-display text-lg text-[var(--deep-wine)]">{title}</p><p className="text-xs text-[var(--muted)] mt-1">{text}</p></div>)}</div></section>
    </main>
  );
}
