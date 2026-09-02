import Razorpay from "razorpay";

// Server-only — never import this in a client component.
// Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.
export function razorpayClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}
