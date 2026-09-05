import Link from "next/link";

export const metadata = {
  title: "About Humor Luxury | Thoughtfully Made Beauty",
  description:
    "Discover the story, philosophy and standards behind Humor Luxury skincare, haircare and bodycare.",
};

const values = [
  {
    number: "01",
    title: "Dermatologist Tested",
    text: "Our products are developed with a focus on thoughtful formulation, skin compatibility and everyday use.",
  },
  {
    number: "02",
    title: "Made in India",
    text: "Proudly created and manufactured in India with care, attention and high standards.",
  },
  {
    number: "03",
    title: "Cruelty Free",
    text: "We believe beauty should never come at the cost of animal testing.",
  },
  {
    number: "04",
    title: "No Parabens or Sulphates",
    text: "Our formulas are made without parabens or sulphates, keeping your everyday ritual considered and uncomplicated.",
  },
];

const principles = [
  {
    title: "Ingredients first",
    text: "We focus on purposeful ingredients and thoughtful formulations rather than adding complexity for the sake of it.",
  },
  {
    title: "Routines over randomness",
    text: "Good skincare is not about collecting products. It is about knowing what to use, when to use it and staying consistent.",
  },
  {
    title: "Made for real life",
    text: "Our products are created for everyday beauty rituals, not just special occasions.",
  },
];

export default function AboutPage() {
  return (
    <main>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20">

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* IMAGE PLACEHOLDER */}
          <div className="order-1 md:order-2">
            <div className="aspect-[4/5] rounded-3xl bg-[var(--milk-sage)] border border-[var(--line)] flex items-center justify-center">
              <div className="text-center px-8">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-3">
                  Photography
                </div>
                <p className="font-display text-lg text-[var(--deep-wine)]/35">
                  Model / Brand Image
                </p>
              </div>
            </div>
          </div>

          {/* TEXT */}
          <div className="order-2 md:order-1">

            <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-4">
              The Humor Luxury Story
            </p>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.08] text-[var(--deep-wine)]">
              Beauty, thoughtfully made.
            </h1>

            <p className="mt-7 text-base md:text-lg leading-8 text-[var(--ink)]/75 max-w-xl">
              Humor Luxury was created with a simple belief: everyday beauty
              should feel effective, uncomplicated and genuinely enjoyable.
            </p>

            <p className="mt-5 text-base leading-7 text-[var(--muted)] max-w-xl">
              Instead of filling your shelf with endless products, we believe
              in purposeful formulas and simple routines that make sense.
              Cleanse, treat, protect and stay consistent.
            </p>

          </div>

        </div>
      </section>


      {/* OUR STORY */}
      <section className="bg-[var(--milk-sage)] border-y border-[var(--line)]">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-16 md:py-20">

          <div className="max-w-3xl">

            <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-4">
              Why Humor Luxury
            </p>

            <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-6">
              We wanted beauty to feel simpler.
            </h2>

            <div className="space-y-5 text-[var(--ink)]/75 leading-7">

              <p>
                Beauty can sometimes feel overwhelming. Too many products,
                complicated routines and endless promises.
              </p>

              <p>
                Humor Luxury takes a more considered approach. We create
                products around specific beauty needs and bring them together
                into routines that are easy to understand and easy to follow.
              </p>

              <p>
                Every product has a purpose. Every step has a reason. And every
                routine is designed to fit naturally into everyday life.
              </p>

            </div>

          </div>

        </div>
      </section>


      {/* OUR PHILOSOPHY */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">

        <div className="max-w-2xl mb-12">

          <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-4">
            Our Philosophy
          </p>

          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-4">
            Less confusion. More intention.
          </h2>

          <p className="text-[var(--muted)] leading-7">
            We believe a good beauty routine should be clear enough to
            understand and simple enough to actually follow.
          </p>

        </div>

        <div className="grid md:grid-cols-3 gap-5">

          {principles.map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--line)] p-7 hover:bg-[var(--milk-sage)]/50 transition-colors"
            >

              <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--warm-gold)] font-semibold mb-5">
                0{index + 1}
              </div>

              <h3 className="font-display text-2xl text-[var(--deep-wine)] mb-3">
                {item.title}
              </h3>

              <p className="text-sm text-[var(--muted)] leading-6">
                {item.text}
              </p>

            </div>
          ))}

        </div>

      </section>


      {/* IMAGE / BRAND MOMENT */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pb-20">

        <div className="grid md:grid-cols-2 gap-5">

          {/* IMAGE PLACEHOLDER 1 */}
          <div className="aspect-[4/3] rounded-3xl bg-[var(--dusty-rose)]/20 border border-[var(--line)] flex items-center justify-center">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-2">
                Photography
              </div>
              <p className="font-display text-lg text-[var(--deep-wine)]/35">
                Model / Lifestyle Image
              </p>
            </div>
          </div>

          {/* IMAGE PLACEHOLDER 2 */}
          <div className="aspect-[4/3] rounded-3xl bg-[var(--warm-gold)]/10 border border-[var(--line)] flex items-center justify-center">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-2">
                Photography
              </div>
              <p className="font-display text-lg text-[var(--deep-wine)]/35">
                Product / Lifestyle Image
              </p>
            </div>
          </div>

        </div>

      </section>


      {/* OUR STANDARDS */}
      <section className="bg-[var(--deep-wine)] text-white">

        <div className="max-w-7xl mx-auto px-5 md:px-8 py-20">

          <div className="max-w-2xl mb-12">

            <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-4">
              Our Standards
            </p>

            <h2 className="font-display text-3xl md:text-4xl mb-4">
              Beauty with standards you can trust.
            </h2>

            <p className="text-white/70 leading-7">
              We want you to know what you are putting into your routine and
              why each product belongs there.
            </p>

          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">

            {values.map((item) => (
              <div
                key={item.number}
                className="border border-white/15 rounded-2xl p-6"
              >

                <div className="text-[11px] tracking-[0.16em] text-[var(--warm-gold)] font-semibold mb-5">
                  {item.number}
                </div>

                <h3 className="font-display text-xl mb-3">
                  {item.title}
                </h3>

                <p className="text-sm text-white/65 leading-6">
                  {item.text}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>


      {/* ROUTINE PHILOSOPHY */}
      <section className="max-w-5xl mx-auto px-5 md:px-8 py-20 text-center">

        <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-4">
          The Humor Luxury Approach
        </p>

        <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-6">
          Cleanse. Treat. Protect. Repeat.
        </h2>

        <p className="text-[var(--muted)] leading-7 max-w-2xl mx-auto">
          We believe consistency beats complexity. Build a routine around
          your concern, use the right products in the right order, and give
          your skin and hair the time they need.
        </p>

        <div className="mt-8">
          <Link
            href="/build-your-routine"
            className="inline-flex items-center rounded-full bg-[var(--deep-wine)] text-white px-7 py-3.5 text-sm font-medium hover:bg-[var(--ink)] transition-colors"
          >
            Build Your Routine →
          </Link>
        </div>

      </section>


      {/* INSTAGRAM / REAL EXPERIENCES */}
      <section className="bg-[var(--milk-sage)] border-y border-[var(--line)]">

        <div className="max-w-7xl mx-auto px-5 md:px-8 py-20">

          <div className="grid md:grid-cols-2 gap-12 items-center">

            <div>

              <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-4">
                Real People. Real Experiences.
              </p>

              <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-5">
                See Humor Luxury in real life.
              </h2>

              <p className="text-[var(--muted)] leading-7 max-w-xl">
                We believe real customer experiences matter more than
                polished promises. Explore our Instagram to discover product
                experiences, routines and the Humor Luxury community.
              </p>

              {/* Replace # with official Instagram profile URL */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex mt-7 rounded-full border border-[var(--deep-wine)] text-[var(--deep-wine)] px-7 py-3.5 text-sm font-medium hover:bg-[var(--deep-wine)] hover:text-white transition-colors"
              >
                See Us on Instagram →
              </a>

            </div>


            {/* INSTAGRAM PHOTO PLACEHOLDER */}
            <div className="grid grid-cols-2 gap-4">

              <div className="aspect-square rounded-2xl bg-white border border-[var(--line)] flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                  Customer Photo
                </span>
              </div>

              <div className="aspect-square rounded-2xl bg-white border border-[var(--line)] flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                  Customer Photo
                </span>
              </div>

              <div className="aspect-square rounded-2xl bg-white border border-[var(--line)] flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                  Customer Photo
                </span>
              </div>

              <div className="aspect-square rounded-2xl bg-white border border-[var(--line)] flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                  Customer Photo
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* FINAL CTA */}
      <section className="max-w-4xl mx-auto px-5 md:px-8 py-20 text-center">

        <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-4">
          Your Everyday Beauty Ritual
        </p>

        <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-5">
          Good beauty starts with a routine that makes sense.
        </h2>

        <p className="text-[var(--muted)] leading-7 max-w-2xl mx-auto mb-8">
          Discover products designed to work together, not compete for space
          on your shelf.
        </p>

        <Link
          href="/build-your-routine"
          className="inline-flex rounded-full bg-[var(--deep-wine)] text-white px-8 py-3.5 text-sm font-medium hover:bg-[var(--ink)] transition-colors"
        >
          Find Your Routine →
        </Link>

      </section>

    </main>
  );
}
