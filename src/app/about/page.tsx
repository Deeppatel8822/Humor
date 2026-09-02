export const metadata = {
  title: "About Us | Humor Luxury",
  description: "The story and standards behind Humor Luxury skincare and haircare.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16">
      <h1 className="font-display text-4xl text-[var(--deep-wine)] mb-6">About Humor Luxury</h1>
      <p className="text-[var(--ink)]/80 leading-relaxed mb-6">
        Humor Luxury started with a simple frustration: most skincare marketing talks about
        results and says almost nothing about what&apos;s actually in the bottle. We build our
        formulas the other way around — starting from ingredients that are proven to do the job,
        then working out how to make them feel good to use.
      </p>
      <p className="text-[var(--ink)]/80 leading-relaxed mb-6">
        Every product is dermatologist tested, made without parabens or sulphates, never tested
        on animals, and manufactured in India to standards we&apos;re happy to publish in full —
        see our <a href="/ingredients" className="text-[var(--deep-wine)] underline">ingredients page</a> and{" "}
        <a href="/certifications" className="text-[var(--deep-wine)] underline">certifications</a> for
        the specifics.
      </p>

      <h2 className="font-display text-2xl text-[var(--deep-wine)] mt-12 mb-4">Why choose Humor Luxury?</h2>
      <ul className="space-y-3 text-sm text-[var(--ink)]/80">
        <li className="flex gap-3"><span className="text-[var(--warm-gold)]">&#10003;</span>Formulas built around active ingredients at real, effective concentrations — not just on the label.</li>
        <li className="flex gap-3"><span className="text-[var(--warm-gold)]">&#10003;</span>Full ingredient transparency on every product page, including the full INCI list.</li>
        <li className="flex gap-3"><span className="text-[var(--warm-gold)]">&#10003;</span>Routines, not random products — we group items by concern so you know what to use together.</li>
        <li className="flex gap-3"><span className="text-[var(--warm-gold)]">&#10003;</span>Made and tested in India, priced for regular use, not as an occasional treat.</li>
      </ul>
    </div>
  );
}
