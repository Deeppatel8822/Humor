import Link from "next/link";

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string; order?: string; total?: string }>;
}) {
  const { method, order, total } = await searchParams;

  return (
    <div className="max-w-xl mx-auto px-5 md:px-8 py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-[var(--moss)]/15 text-[var(--moss)] flex items-center justify-center text-2xl mx-auto mb-6">
        &#10003;
      </div>
      <h1 className="font-display text-3xl text-[var(--deep-wine)] mb-3">Order confirmed</h1>
      <p className="text-[var(--muted)] mb-1">
        {method === "cod" ? "Your cash-on-delivery order has been placed." : "Your payment was successful and your order has been placed."}
      </p>
      {order && <p className="text-sm text-[var(--muted)] mb-1">Order number: <span className="font-medium text-[var(--ink)]">{order}</span></p>}
      {total && <p className="text-sm text-[var(--muted)] mb-8">Total: <span className="font-medium text-[var(--ink)]">&#8377;{total}</span></p>}
      <p className="text-xs text-[var(--muted)] mb-8">
        A confirmation has been sent to your email. You can track your order status from the Track Order page using your order number.
      </p>
      <Link href="/shop" className="inline-block bg-[var(--deep-wine)] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--ink)] transition-colors">
        Continue shopping
      </Link>
    </div>
  );
}
