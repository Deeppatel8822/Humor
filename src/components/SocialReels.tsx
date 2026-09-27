"use client";

const reels = [
  "DVtIYYjkbG5",
  "DVQZ2d-EhG9",
  "DWoS8yik-J8",
  "DVfu3gJkczd",
];

export default function SocialReels() {
  return (
    <section className="border-y border-[var(--line)] bg-white py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)]">
              From our community
            </p>
            <h2 className="font-display text-3xl text-[var(--deep-wine)] md:text-4xl">
              Real People. Real Humor.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              See how our community experiences Humor Luxury, straight from Instagram.
            </p>
          </div>
          <a
            href="https://www.instagram.com/humor_cosmetics/"
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 text-sm font-medium text-[var(--warm-gold)] md:block"
          >
            Follow @humor_cosmetics →
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

        <a
          href="https://www.instagram.com/humor_cosmetics/"
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex rounded-full border border-[var(--deep-wine)] px-6 py-3 text-sm font-medium text-[var(--deep-wine)] transition-colors hover:bg-[var(--milk-sage)] md:hidden"
        >
          Follow @humor_cosmetics →
        </a>
      </div>
    </section>
  );
}
