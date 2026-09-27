"use client";

const reels = [
  "DVtIYYjkbG5",
  "DVQZ2d-EhG9",
  "DWoS8yik-J8",
  "DVfu3gJkczd",
];

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.6" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const trustPoints = [
  {
    title: "Dermatologist Tested",
    text: "Thoughtfully formulated for everyday beauty routines.",
  },
  {
    title: "Made in India",
    text: "Proudly created and made in India.",
  },
  {
    title: "Free Shipping",
    text: "Free shipping on every order, with no minimum.",
  },
  {
    title: "COD Available",
    text: "Cash on Delivery is available at checkout.",
  },
];

export default function SocialReels() {
  return (
    <section className="border-y border-[var(--line)] bg-white py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)]">
              <InstagramIcon className="h-5 w-5" />
              <span>From our Instagram community</span>
            </div>
            <h2 className="font-display text-3xl text-[var(--deep-wine)] md:text-4xl">
              Real People. Real Humor.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Watch real customer content and see how our community experiences
              Humor Luxury.
            </p>
          </div>

          <a
            href="https://www.instagram.com/humor_cosmetics/"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Humor Luxury on Instagram"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-[var(--deep-wine)] px-5 py-3 text-sm font-medium text-[var(--deep-wine)] transition-colors hover:bg-[var(--milk-sage)] md:inline-flex"
          >
            <InstagramIcon className="h-5 w-5" />
            <span>Follow us on Instagram</span>
          </a>
        </div>

        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 md:grid md:grid-cols-4 md:overflow-visible">
          {reels.map((id) => (
            <article
              key={id}
              className="w-[78vw] max-w-[330px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--milk-sage)] shadow-sm md:w-auto md:max-w-none"
            >
              <div className="aspect-[9/16] w-full overflow-hidden bg-black">
                <iframe
                  src={"https://www.instagram.com/reel/" + id + "/embed"}
                  title={"Humor Luxury Instagram Reel " + id}
                  className="h-full w-full border-0"
                  loading="lazy"
                  allow="autoplay; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-3 border-t border-[var(--line)] pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-[var(--line)] bg-[var(--milk-sage)] px-5 py-5"
            >
              <p className="text-sm font-semibold text-[var(--deep-wine)]">
                {point.title}
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                {point.text}
              </p>
            </div>
          ))}
        </div>

        <a
          href="https://www.instagram.com/humor_cosmetics/"
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full border border-[var(--deep-wine)] px-6 py-3 text-sm font-medium text-[var(--deep-wine)] transition-colors hover:bg-[var(--milk-sage)] md:hidden"
        >
          <InstagramIcon className="h-5 w-5" />
          <span>Follow us on Instagram</span>
        </a>
      </div>
    </section>
  );
}
