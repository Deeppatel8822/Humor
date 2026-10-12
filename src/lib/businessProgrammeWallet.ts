import { supabaseAdmin } from "@/lib/supabase";

export type WalletTransactionType =
  | "reward"
  | "withdrawal_request"
  | "withdrawal_rejected"
  | "withdrawal_paid"
  | "wallet_spend"
  | "wallet_refund"
  | "manual_adjustment";

export interface WalletPostResult {
  success: boolean;
  duplicate?: boolean;
  balance?: number;
  transaction_id?: string;
  error?: string;
}

/**
 * Posts a wallet transaction through the database RPC. The SQL function locks
 * the account row, prevents overdrafts, and makes (partner, type, reference)
 * idempotent. Requires the wallet-ledger migration to be applied in Supabase.
 */
export async function postWalletTransaction(input: {
  partnerUserId: string;
  type: WalletTransactionType;
  amountInr: number;
  referenceId: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<WalletPostResult> {
  const { data, error } = await supabaseAdmin().rpc("business_programme_wallet_post", {
    p_partner_user_id: input.partnerUserId,
    p_transaction_type: input.type,
    p_amount_inr: input.amountInr,
    p_reference_id: input.referenceId,
    p_description: input.description ?? null,
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    // Fail closed. Do not silently treat a missing migration as a successful
    // wallet operation.
    throw new Error(`Wallet ledger unavailable: ${error.message}`);
  }
  const result = data as WalletPostResult | null;
  if (!result?.success) {
    if (result?.error === "INSUFFICIENT_BALANCE") {
      throw new Error("Insufficient wallet balance.");
    }
    throw new Error(result?.error || "Wallet transaction failed.");
  }
  return result;
}
