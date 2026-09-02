export const metadata = {
  title: "Shipping & Returns | Humor Luxury",
  description: "Shipping timelines, costs, and return policy for Humor Luxury orders.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16">
      <h1 className="font-display text-4xl text-[var(--deep-wine)] mb-10">Shipping & returns</h1>
      <section className="mb-10">
        <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-4">Shipping</h2>
        <ul className="space-y-2 text-sm text-[var(--ink)]/80">
          <li>Free shipping on orders over &#8377;599. Orders below that ship for a flat &#8377;60.</li>
          <li>Orders are dispatched within 1–2 business days of confirmation.</li>
          <li>Delivery typically takes 3–5 business days, depending on location.</li>
          <li>You&apos;ll receive a tracking link by email and SMS once your order ships.</li>
        </ul>
      </section>
      <section>
        <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-4">Returns</h2>
        <ul className="space-y-2 text-sm text-[var(--ink)]/80">
          <li>Unopened products can be returned within 7 days of delivery for a full refund.</li>
          <li>If a product arrives damaged or incorrect, contact us within 48 hours with photos and we&apos;ll replace it at no cost.</li>
          <li>Refunds are processed to the original payment method within 5–7 business days of the return being received.</li>
          <li>Cash-on-delivery order refunds are issued via bank transfer or store credit.</li>
        </ul>
      </section>
    </div>
  );
}
