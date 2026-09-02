export const metadata = {
  title: "Contact Us | Humor Luxury",
  description: "Get in touch with the Humor Luxury team.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-16">
      <h1 className="font-display text-4xl text-[var(--deep-wine)] mb-3">Get in touch</h1>
      <p className="text-[var(--muted)] mb-10 text-sm">
        Questions about a product, an order, or a bulk enquiry — we usually reply within one business day.
      </p>
      <form className="space-y-4 mb-10">
        <input placeholder="Name" className="w-full border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white" />
        <input placeholder="Email" type="email" className="w-full border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white" />
        <textarea placeholder="How can we help?" rows={5} className="w-full border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white" />
        <button type="submit" className="bg-[var(--deep-wine)] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--ink)] transition-colors">
          Send message
        </button>
        <p className="text-xs text-[var(--muted)]">* Wire this form to an email API (e.g. Resend) or a Supabase table before launch.</p>
      </form>
      <div className="bg-[var(--milk-sage)] border border-[var(--line)] rounded-xl p-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-[var(--ink)]">Prefer WhatsApp?</div>
          <div className="text-xs text-[var(--muted)] mt-0.5">Chat with our support team directly.</div>
        </div>
        <a href="https://wa.me/910000000000" target="_blank" rel="noopener noreferrer" className="bg-[var(--moss)] text-white px-5 py-2.5 rounded-full text-xs font-medium">
          Open WhatsApp
        </a>
      </div>
    </div>
  );
}
