export const metadata = {
  title: "Manufacturing Standards & Certifications | Humor Luxury",
  description: "How Humor Luxury products are made, tested, and certified.",
};

const certifications = [
  { name: "Dermatologically Tested", note: "Every formula is patch-tested under dermatological supervision before launch." },
  { name: "Cruelty-Free", note: "No animal testing at any stage of formulation or production." },
  { name: "GMP-Compliant Manufacturing", note: "Produced in facilities following Good Manufacturing Practice standards." },
  { name: "Made in India", note: "Formulated and manufactured domestically, end to end." },
];

export default function CertificationsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16">
      <h1 className="font-display text-4xl text-[var(--deep-wine)] mb-6">Manufacturing standards & certifications</h1>
      <p className="text-[var(--ink)]/80 leading-relaxed mb-12">
        We manufacture in India under Good Manufacturing Practice (GMP) conditions, with batch
        testing at every stage from raw material intake to finished product. Below are the
        standards we hold ourselves to.
      </p>
      <div className="space-y-4">
        {certifications.map((c) => (
          <div key={c.name} className="flex gap-4 bg-[var(--milk-sage)] border border-[var(--line)] rounded-xl px-5 py-4">
            <span className="text-[var(--warm-gold)] text-lg leading-none mt-0.5">&#9670;</span>
            <div>
              <div className="text-sm font-medium text-[var(--ink)]">{c.name}</div>
              <div className="text-xs text-[var(--muted)] mt-1">{c.note}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--muted)] mt-10">
        Certificate documents and batch test reports are available on request — contact us
        through the <a href="/contact" className="underline">contact page</a>.
      </p>
    </div>
  );
}
