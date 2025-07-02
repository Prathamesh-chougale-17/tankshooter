/**
 * Gas Payment Utility for Tank Shooter Game
 * Handles payment of 0.001 GOR gas fee via Gorbagana RPC
 */

import {
  address,
  Address,
  appendTransactionMessageInstruction,
  assertIsTransactionMessageWithSingleSendingSigner,
  Blockhash,
  createTransactionMessage,
  getBase58Decoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  SolanaClient,
  TransactionSendingSigner,
  createSolanaRpc,
} from "gill";
import { getTransferSolInstruction } from "gill/programs";
import { toastTx } from "@/components/toast-tx";

export interface GasPaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export const GAS_FEE_AMOUNT = 0.001; // GOR
export const GAS_FEE_LAMPORTS = Math.floor(GAS_FEE_AMOUNT * 1_000_000_000); // 0.001 GOR in lamports
export const GORBAGANA_RPC = "https://rpc.gorbagana.wtf";

// Game treasury address - the address you specified
export const GAME_TREASURY_ADDRESS =
  "FMapH1GN91uiHcxnJmgAbqqUyJspVPq5Wv8y1BvENgJ6";

export async function payGameGasFee(
  walletAddress: string,
  txSigner: TransactionSendingSigner | null
): Promise<GasPaymentResult> {
  try {
    if (!txSigner) {
      throw new Error(
        "Wallet signer not available. Please connect your wallet."
      );
    }

    console.log("🎮 Starting gas payment for Tank Shooter...");
    console.log("💰 Amount: 0.001 GOR");
    console.log("🔗 RPC: " + GORBAGANA_RPC);
    console.log("👛 Wallet: " + walletAddress);
    console.log("🏦 Treasury: " + GAME_TREASURY_ADDRESS);

    // Create connection to custom RPC
    const customClient = {
      rpc: createSolanaRpc(GORBAGANA_RPC),
    } as SolanaClient;

    // Create address objects
    const fromAddress = address(walletAddress);
    const toAddress = address(GAME_TREASURY_ADDRESS);

    // Check wallet balance first
    const balanceResponse = await customClient.rpc
      .getBalance(fromAddress)
      .send();
    const balance = Number(balanceResponse.value || balanceResponse);
    console.log("💳 Current balance:", balance / 1_000_000_000, "GOR");
    console.log("🔍 Raw balance response:", balanceResponse);

    if (balance < GAS_FEE_LAMPORTS + 5000) {
      // Include buffer for transaction fees
      throw new Error(
        "Insufficient balance. Need at least " +
          (GAS_FEE_LAMPORTS + 5000) / 1_000_000_000 +
          " GOR"
      );
    }

    // Create and send transaction using the same pattern as account-data-access
    const { signature } = await createGasPaymentTransaction({
      txSigner,
      destination: toAddress,
      amount: GAS_FEE_LAMPORTS,
      client: customClient,
    });

    console.log("✅ Gas payment successful!");
    console.log("📝 Transaction signature: " + signature);
    console.log("🏦 Paid to treasury: " + GAME_TREASURY_ADDRESS);

    // Show toast notification for transaction success
    toastTx(signature, "Gas fee paid successfully!");

    return {
      success: true,
      signature: signature,
    };
  } catch (error) {
    console.error("❌ Gas payment failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Transaction creation helper using the same pattern as account-data-access
async function createGasPaymentTransaction({
  amount,
  destination,
  client,
  txSigner,
}: {
  amount: number;
  destination: Address;
  client: SolanaClient;
  txSigner: TransactionSendingSigner;
}): Promise<{
  signature: string;
  latestBlockhash: {
    blockhash: Blockhash;
    lastValidBlockHeight: bigint;
  };
}> {
  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash({ commitment: "confirmed" })
    .send();

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(txSigner, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        getTransferSolInstruction({
          amount,
          destination: address(destination),
          source: txSigner,
        }),
        m
      )
  );
  assertIsTransactionMessageWithSingleSendingSigner(message);

  const signature = await signAndSendTransactionMessageWithSigners(message);

  return {
    signature: getBase58Decoder().decode(signature),
    latestBlockhash,
  };
}

export function formatGorAmount(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(3) + " GOR";
}

export function validateWalletBalance(balance: number): boolean {
  // Check if wallet has enough GOR (including network fees)
  const requiredBalance = GAS_FEE_LAMPORTS + 5000; // Add some buffer for network fees
  return balance >= requiredBalance;
}
