export default function TrustFacts() {
  const facts = [
    {
      icon: "↗",
      title: "Shipping & COD Available",
      text: "Free shipping on orders ₹299+ with Cash on Delivery available.",
    },
    {
      icon: "✦",
      title: "Exciting Offers & Discounts",
      text: "Discover special offers, bundle deals and limited-time savings.",
    },
    {
      icon: "♡",
      title: "Sign Up & Get a Discount",
      text: "Create your account and unlock exclusive offers and member savings.",
    },
  ];

  return (
    <section
      id="trust-facts"
      className="border-y border-[var(--line)] bg-[#f7f2fb] py-8 md:py-10"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 md:grid-cols-3 md:px-8">
        {facts.map((fact) => (
          <div
            key={fact.title}
            className="group rounded-2xl border border-[var(--line)] bg-white/75 px-5 py-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div
              aria-hidden="true"
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--deep-wine)]/25 bg-[#f7f2fb] text-lg font-semibold text-[var(--deep-wine)] transition-transform duration-300 group-hover:scale-110"
            >
              {fact.icon}
            </div>
            <h3 className="text-sm font-semibold text-[var(--deep-wine)]">
              {fact.title}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">
              {fact.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
